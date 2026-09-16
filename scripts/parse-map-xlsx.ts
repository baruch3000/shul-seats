import * as XLSX from "xlsx";
import { existsSync, writeFileSync } from "fs";
import { resolve } from "path";

const p = [
  "g:/האחסון שלי/אפליקציה/shul-seats/מפה.xlsx",
  resolve(process.cwd(), "scripts/map.xlsx"),
].find((c) => existsSync(c));
if (!p) {
  console.error("map.xlsx not found");
  process.exit(1);
}
const wb = XLSX.readFile(p);
const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {
  header: 1,
  defval: "",
}) as string[][];

export const SEAT_W = 38;
export const SEAT_H = 36;
export const SEAT_GAP = 2;
export const COL_STEP = SEAT_W + SEAT_GAP;
export const ROW_STEP = SEAT_H + SEAT_GAP;
const ORIGIN_X = 16;
const ORIGIN_Y = 16;

/** Stepped mechitza — horizontal step above row 41–44, not between 41–44 and 45–48 */
const womenEastEdge = ORIGIN_X + 12 * COL_STEP + SEAT_W; // col 12 (seat 44)
const menWestEdge = ORIGIN_X + 17 * COL_STEP; // col 17 (men block starts)
const STROKE_WIDTH = 14;

const row45Y = ORIGIN_Y + 14 * ROW_STEP; // 548 — seats 45–48
const row4144Y = row45Y - ROW_STEP; // 510 — stacked above 45–48
const splitY = row4144Y - STROKE_WIDTH / 2 - SEAT_GAP; // 501 — line above row 41–44

export const MECHITZA = {
  topVerticalX: ORIGIN_X + 8 * COL_STEP + COL_STEP / 2, // aisle between cols 7 and 9
  splitY,
  dividerX: (womenEastEdge + menWestEdge) / 2, // aisle east of col 12, west of men
  strokeWidth: STROKE_WIDTH,
} as const;

type Section = "men" | "women";

interface ParsedSeat {
  section: Section;
  number: number;
  r: number;
  c: number;
  x: number;
  y: number;
}

interface ParsedLabel {
  type: "aron" | "bima" | "entrance" | "blocked" | "mechitza";
  label: string;
  r: number;
  c: number;
  x: number;
  y: number;
  section?: Section;
}

function pos(r: number, c: number) {
  return { x: ORIGIN_X + c * COL_STEP, y: ORIGIN_Y + r * ROW_STEP, r, c };
}

/** Light-gray X zones from reference map (grid rows/cols) */
function gridRect(r: number, c: number, rows: number, cols: number) {
  return {
    x: ORIGIN_X + c * COL_STEP,
    y: ORIGIN_Y + r * ROW_STEP,
    width: cols * COL_STEP - SEAT_GAP,
    height: rows * ROW_STEP - SEAT_GAP,
  };
}

/** Smaller X zones — must not overlap seat cells (esp. women 37–40 at c=6, r=7–10) */
const REFERENCE_BLOCKED = [
  { r: 1, c: 0, rows: 5, cols: 4, name: "top-left" },
  { r: 1, c: 5, rows: 5, cols: 1, name: "pillar-left" },
  { r: 9, c: 29, rows: 4, cols: 2, name: "right" },
];

function rectsOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function seatRect(s: ParsedSeat) {
  return { x: s.x, y: s.y, width: SEAT_W, height: SEAT_H };
}

/** Narrow gap between women's middle block (19–36) and third block (45–68) */
function compactWomenBottomColumns(seat: ParsedSeat) {
  if (seat.section !== "women") return;
  if (seat.r >= 14 && seat.c >= 10) seat.c -= 1;
  else if (seat.r === 11 && seat.c >= 10) seat.c -= 1;
  seat.x = ORIGIN_X + seat.c * COL_STEP;
}

function isWomenCell(r: number, c: number, n: number): boolean {
  // 37-40 — עמודה עליונה ליד כניסת נשים
  if (n >= 37 && n <= 40 && c === 6 && r >= 7 && r <= 10) return true;
  // 41-44 — עזרת נשים, מתחת למחיצה האופקית
  if (n >= 41 && n <= 44 && r === 11 && c >= 10 && c <= 13) return true;
  // גריד תחתון: 1-18 (עמ' 1-3), 19-36 (עמ' 5-7), 45-68 (עמ' 10-13)
  if (r >= 14 && r <= 19) {
    if (n >= 1 && n <= 18 && c >= 1 && c <= 3) return true;
    if (n >= 19 && n <= 36 && c >= 5 && c <= 7) return true;
    if (n >= 45 && n <= 68 && c >= 10 && c <= 13) return true;
  }
  return false;
}

const seats: ParsedSeat[] = [];
const labels: ParsedLabel[] = [];

for (let r = 0; r < data.length; r++) {
  for (let c = 0; c < (data[r]?.length ?? 0); c++) {
    const raw = String(data[r][c]).trim();
    if (!raw) continue;
    const { x, y } = pos(r, c);

    if (/^\d+$/.test(raw)) {
      const n = +raw;
      const section: Section = isWomenCell(r, c, n) ? "women" : "men";
      const seat: ParsedSeat = { section, number: n, r, c, x, y };
      compactWomenBottomColumns(seat);
      seats.push(seat);
    } else if (/^x$/i.test(raw)) {
      labels.push({ type: "blocked", label: "X", ...pos(r, c) });
    } else if (raw === "ארון קודש") {
      labels.push({ type: "aron", label: raw, ...pos(r, c) });
    } else if (raw === "בימה") {
      labels.push({ type: "bima", label: raw, ...pos(r, c) });
    } else if (raw.includes("כניסה")) {
      labels.push({
        type: "entrance",
        label: raw,
        section: raw.includes("נשים") ? "women" : "men",
        ...pos(r, c),
      });
    }
  }
}

function validate(section: Section, expected: number) {
  const list = seats.filter((s) => s.section === section);
  const nums = list.map((s) => s.number);
  const missing = Array.from({ length: expected }, (_, i) => i + 1).filter(
    (n) => !nums.includes(n)
  );
  const dupes = nums.filter((n, i) => nums.indexOf(n) !== i);
  return { count: list.length, unique: new Set(nums).size, missing, dupes: [...new Set(dupes)] };
}

/** Row 41–44: directly above row 45–48, below mechitza horizontal stroke */
function alignWomen4144Block() {
  for (const seat of seats) {
    if (seat.section === "women" && seat.number >= 41 && seat.number <= 44) {
      seat.y = row4144Y;
    }
  }
}

alignWomen4144Block();

const menV = validate("men", 116);
const womenV = validate("women", 68);

console.log("MEN", menV);
console.log("WOMEN", womenV);

const maxC = Math.max(...seats.map((s) => s.c), ...labels.map((l) => l.c));
const maxR = Math.max(...seats.map((s) => s.r), ...labels.map((l) => l.r));
const MAP_WIDTH = ORIGIN_X * 2 + (maxC + 2) * COL_STEP;
const MAP_HEIGHT = ORIGIN_Y * 2 + (maxR + 2) * ROW_STEP;

// Group into benches: same row + adjacent cols = horizontal bench; same col + adjacent rows = vertical
function groupBenches(section: Section) {
  const sectionSeats = seats.filter((s) => s.section === section);
  const used = new Set<string>();
  const benches: { row: number; numbers: number[]; x: number; y: number; vertical: boolean }[] = [];
  let benchRow = 1;

  for (const seat of sectionSeats.sort((a, b) => a.r - b.r || a.c - b.c)) {
    const key = `${seat.r},${seat.c}`;
    if (used.has(key)) continue;

    // try horizontal run on same row
    const hRun = [seat];
    used.add(key);
    let nc = seat.c + 1;
    while (true) {
      const next = sectionSeats.find((s) => s.r === seat.r && s.c === nc && !used.has(`${s.r},${s.c}`));
      if (!next) break;
      hRun.push(next);
      used.add(`${next.r},${next.c}`);
      nc++;
    }

    if (hRun.length > 1) {
      benches.push({
        row: benchRow++,
        numbers: hRun.map((s) => s.number),
        x: hRun[0].x,
        y: hRun[0].y,
        vertical: false,
      });
      continue;
    }

    // vertical run same column
    const vRun = [seat];
    let nr = seat.r + 1;
    while (true) {
      const next = sectionSeats.find((s) => s.c === seat.c && s.r === nr && !used.has(`${s.r},${s.c}`));
      if (!next) break;
      vRun.push(next);
      used.add(`${next.r},${next.c}`);
      nr++;
    }

    benches.push({
      row: benchRow++,
      numbers: vRun.map((s) => s.number),
      x: vRun[0].x,
      y: vRun[0].y,
      vertical: vRun.length > 1,
    });
  }

  return benches;
}

const menBenches = groupBenches("men");
const womenBenches = groupBenches("women");

const blockedAreas = [
  ...REFERENCE_BLOCKED.map(({ r, c, rows, cols }) => gridRect(r, c, rows, cols)),
  ...labels
    .filter((l) => l.type === "blocked")
    .map((l) => gridRect(l.r, l.c, 1, 1)),
].filter((zone) => !seats.some((s) => rectsOverlap(zone, seatRect(s))));

const outPath = resolve(process.cwd(), "scripts/parsed-layout.json");
writeFileSync(
  outPath,
  JSON.stringify(
    { seats, labels, menBenches, womenBenches, MAP_WIDTH, MAP_HEIGHT, menV, womenV, MECHITZA, blockedAreas },
    null,
    2
  )
);
console.log("Wrote", outPath);
console.log("MAP", MAP_WIDTH, MAP_HEIGHT);

for (const n of [37, 38, 39, 40, 48, 52, 1, 45]) {
  console.log(
    `n=${n}:`,
    seats.filter((s) => s.number === n).map((s) => `${s.section}@${s.r},${s.c}`)
  );
}
