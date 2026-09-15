/**
 * Generates src/data/layout.ts from Excel-derived parsed-layout.json
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { execSync } from "child_process";

execSync("npx tsx scripts/parse-map-xlsx.ts", { stdio: "inherit" });

interface ParsedSeat {
  section: "men" | "women";
  number: number;
  x: number;
  y: number;
  r: number;
  c: number;
}

interface Parsed {
  seats: ParsedSeat[];
  labels: {
    type: string;
    label: string;
    x: number;
    y: number;
    section?: string;
    r?: number;
    c?: number;
  }[];
  MAP_WIDTH: number;
  MAP_HEIGHT: number;
  menV: { count: number; missing: number[] };
  womenV: { count: number };
  MECHITZA: {
    topVerticalX: number;
    splitY: number;
    dividerX: number;
    strokeWidth: number;
  };
  blockedAreas: { x: number; y: number; width: number; height: number }[];
}

const parsed: Parsed = JSON.parse(
  readFileSync(resolve(process.cwd(), "scripts/parsed-layout.json"), "utf-8")
);

const { topVerticalX, splitY, dividerX, strokeWidth } = parsed.MECHITZA;
const COL_STEP = 40;
const ROW_STEP = 38;
const SEAT_W = 38;
const SEAT_H = 36;
const ORIGIN_X = 16;
const ORIGIN_Y = 16;

const posByNumber = (section: "men" | "women") =>
  new Map(parsed.seats.filter((s) => s.section === section).map((s) => [s.number, s]));

function regroup(section: "men" | "women") {
  const sectionSeats = parsed.seats.filter((s) => s.section === section);
  const used = new Set<string>();
  const benches: { row: number; numbers: number[]; vertical: boolean }[] = [];
  let row = 1;

  for (const seat of sectionSeats.sort((a, b) => a.y - b.y || a.x - b.x)) {
    const key = `${seat.x},${seat.y}`;
    if (used.has(key)) continue;

    const hRun = [seat];
    used.add(key);
    let nx = seat.x + COL_STEP;
    while (true) {
      const next = sectionSeats.find((s) => s.y === seat.y && s.x === nx && !used.has(`${s.x},${s.y}`));
      if (!next) break;
      hRun.push(next);
      used.add(`${next.x},${next.y}`);
      nx += COL_STEP;
    }
    if (hRun.length > 1) {
      benches.push({ row: row++, numbers: hRun.map((s) => s.number), vertical: false });
      continue;
    }

    const vRun = [seat];
    let ny = seat.y + ROW_STEP;
    while (true) {
      const next = sectionSeats.find((s) => s.x === seat.x && s.y === ny && !used.has(`${s.x},${s.y}`));
      if (!next) break;
      vRun.push(next);
      used.add(`${next.x},${next.y}`);
      ny += ROW_STEP;
    }
    benches.push({ row: row++, numbers: vRun.map((s) => s.number), vertical: vRun.length > 1 });
  }
  return benches;
}

function benchLines(section: "men" | "women", benches: ReturnType<typeof regroup>) {
  const positions = posByNumber(section);
  return benches
    .sort((a, b) => a.row - b.row)
    .map((b) => {
      const seatEntries = b.numbers
        .map((n) => {
          const s = positions.get(n)!;
          return `{ number: ${n}, x: ${s.x}, y: ${s.y} }`;
        })
        .join(", ");
      return `  { section: "${section}", row: ${b.row}, seats: [${seatEntries}] },`;
    })
    .join("\n");
}

const menBenches = regroup("men");
const womenBenches = regroup("women");

const aron = parsed.labels.find((l) => l.type === "aron");
const bima = parsed.labels.find((l) => l.type === "bima");
const entrances = parsed.labels.filter((l) => l.type === "entrance");

const womenEntranceY = ORIGIN_Y + 13 * ROW_STEP - 36;
const womenEntranceX = ORIGIN_X + 1.5 * COL_STEP;
const aronCenterX = (aron?.x ?? 776) + SEAT_W / 2;
const aronY = aron?.y ?? 168;

const mapHeight = parsed.MAP_HEIGHT + 40;
const womenLabelX = dividerX / 2;
const menLabelX = dividerX + (parsed.MAP_WIDTH - dividerX) / 2;
const womenBottomRowY = ORIGIN_Y + 14 * ROW_STEP;
const womenLabelY = womenBottomRowY - 24;
const womenUpperLabelY = ORIGIN_Y + 7 * ROW_STEP - 8;
const menTotal = parsed.menV.count;
const womenTotal = parsed.womenV.count;

const blockedAreasLines = parsed.blockedAreas
  .map((b) => `  { x: ${b.x}, y: ${b.y}, width: ${b.width}, height: ${b.height} },`)
  .join("\n");

const content = `import type { BenchLayout, BlockedAreaLayout, LandmarkLayout, SectionSlug } from "@/lib/types";

/** Generated from מפה.xlsx — do not edit manually; run: npm run layout:generate */
export const SEAT_W = ${SEAT_W};
export const SEAT_H = ${SEAT_H};
export const SEAT_GAP = 2;

/** Stepped mechitza: down from top → horizontal in aisle → down between blocks */
export const mechitzaLayout = {
  topVerticalX: ${topVerticalX},
  splitY: ${splitY},
  dividerX: ${dividerX},
  strokeWidth: ${strokeWidth},
} as const;

const menBenches: BenchLayout[] = [
${benchLines("men", menBenches)}
];

const womenBenches: BenchLayout[] = [
${benchLines("women", womenBenches)}
];

export const blockedSeatNumbers: Record<SectionSlug, number[]> = {
  men: [],
  women: [],
};

export const blockedAreas: BlockedAreaLayout[] = [
${blockedAreasLines || "  // none"}
];

export const landmarks: LandmarkLayout[] = [
  { type: "aron", x: ${aronCenterX}, y: ${aronY}, label: "ארון קודש", width: 200, height: 44 },
  { type: "bima", x: ${(bima?.x ?? 776) + SEAT_W / 2}, y: ${bima?.y ?? 434}, label: "בימה", width: 100, height: 100 },
${entrances
  .map((e) => {
    if (e.label.includes("נשים")) {
      return `  { type: "entrance", x: ${womenEntranceX}, y: ${womenEntranceY}, label: "${e.label}", width: 168, height: 32 },`;
    }
    if (e.section === "men" && (e.x ?? 0) < 600) {
      const seat1 = parsed.seats.find((s) => s.section === "men" && s.number === 1);
      const entranceW = 110;
      // Right of mechitza stroke — label sits in the corridor, not on the wall line
      const leftEntranceX = topVerticalX + strokeWidth / 2 + entranceW / 2 + 12;
      const leftEntranceY = (seat1?.y ?? 168) + Math.round(SEAT_H / 2) - 16;
      return `  { type: "entrance", x: ${leftEntranceX}, y: ${leftEntranceY}, label: "${e.label}", width: ${entranceW}, height: 32 },`;
    }
    return `  { type: "entrance", x: ${(e.x ?? 0) + SEAT_W / 2}, y: ${e.y}, label: "${e.label}", width: 110, height: 32 },`;
  })
  .join("\n")}
];

export const allBenches: BenchLayout[] = [...menBenches, ...womenBenches];

/** No pillars on this map */
export const pillars: { section: SectionSlug; cx: number; cy: number; r: number }[] = [];

export const sectionMeta = {
  men: { totalSeats: ${menTotal}, displayName: "עזרת גברים" },
  women: { totalSeats: ${womenTotal}, displayName: "עזרת נשים" },
} as const;

export const MAP_WIDTH = ${parsed.MAP_WIDTH};
export const FULL_MAP_HEIGHT = ${mapHeight};
export const womenSectionLabelX = ${womenLabelX};
export const womenSectionLabelY = ${womenLabelY};
export const womenUpperSectionLabelY = ${womenUpperLabelY};
export const menSectionLabelX = ${menLabelX};

export const sectionMapHeight: Record<SectionSlug, number> = {
  men: ${parsed.MAP_HEIGHT},
  women: ${parsed.MAP_HEIGHT + 40},
};

export function getMapHeight(section?: SectionSlug | "all"): number {
  if (!section || section === "all") return FULL_MAP_HEIGHT;
  return sectionMapHeight[section];
}

export function getBenchesForSection(section: SectionSlug): BenchLayout[] {
  return allBenches.filter((b) => b.section === section);
}

export function validateLayout() {
  const men = getBenchesForSection("men").flatMap((b) => b.seats.map((s) => s.number));
  const women = getBenchesForSection("women").flatMap((b) => b.seats.map((s) => s.number));
  const errors: string[] = [];
  if (new Set(men).size !== men.length) errors.push("Men: duplicate seat numbers");
  if (new Set(women).size !== women.length) errors.push("Women: duplicate seat numbers");
  if (men.length !== ${menTotal}) errors.push(\`Men count: \${men.length}, expected ${menTotal}\`);
  if (women.length !== ${womenTotal}) errors.push(\`Women count: \${women.length}, expected ${womenTotal}\`);
  return errors;
}
`;

writeFileSync(resolve(process.cwd(), "src/data/layout.ts"), content, "utf-8");
console.log("Generated src/data/layout.ts");

execSync("npx tsx -e \"import { validateLayout } from './src/data/layout'; console.log(validateLayout());\"", {
  stdio: "inherit",
});
