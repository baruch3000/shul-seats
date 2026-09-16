import type { BenchLayout, BlockedAreaLayout, LandmarkLayout, SectionSlug } from "@/lib/types";

/** Generated from מפה.xlsx — do not edit manually; run: npm run layout:generate */
export const SEAT_W = 38;
export const SEAT_H = 36;
export const SEAT_GAP = 2;

/** Stepped mechitza: down from top → horizontal in aisle → down between blocks */
export const mechitzaLayout = {
  topVerticalX: 356,
  splitY: 501,
  dividerX: 615,
  strokeWidth: 14,
} as const;

const menBenches: BenchLayout[] = [
  { section: "men", row: 1, seats: [{ number: 1, x: 536, y: 168 }, { number: 2, x: 576, y: 168 }, { number: 3, x: 616, y: 168 }] },
  { section: "men", row: 2, seats: [{ number: 86, x: 1016, y: 168 }, { number: 87, x: 1056, y: 168 }, { number: 88, x: 1096, y: 168 }] },
  { section: "men", row: 3, seats: [{ number: 4, x: 496, y: 244 }, { number: 5, x: 536, y: 244 }, { number: 6, x: 576, y: 244 }, { number: 7, x: 616, y: 244 }] },
  { section: "men", row: 4, seats: [{ number: 8, x: 496, y: 282 }, { number: 9, x: 536, y: 282 }, { number: 10, x: 576, y: 282 }, { number: 11, x: 616, y: 282 }] },
  { section: "men", row: 5, seats: [{ number: 16, x: 696, y: 282 }, { number: 17, x: 736, y: 282 }, { number: 18, x: 776, y: 282 }, { number: 19, x: 816, y: 282 }] },
  { section: "men", row: 6, seats: [{ number: 52, x: 896, y: 282 }, { number: 53, x: 936, y: 282 }, { number: 54, x: 976, y: 282 }, { number: 55, x: 1016, y: 282 }] },
  { section: "men", row: 7, seats: [{ number: 89, x: 1096, y: 282 }, { number: 90, x: 1136, y: 282 }, { number: 91, x: 1176, y: 282 }, { number: 92, x: 1216, y: 282 }] },
  { section: "men", row: 8, seats: [{ number: 12, x: 496, y: 320 }, { number: 13, x: 536, y: 320 }, { number: 14, x: 576, y: 320 }, { number: 15, x: 616, y: 320 }] },
  { section: "men", row: 9, seats: [{ number: 20, x: 696, y: 320 }, { number: 21, x: 736, y: 320 }, { number: 22, x: 776, y: 320 }, { number: 23, x: 816, y: 320 }] },
  { section: "men", row: 10, seats: [{ number: 56, x: 896, y: 320 }, { number: 57, x: 936, y: 320 }, { number: 58, x: 976, y: 320 }, { number: 59, x: 1016, y: 320 }] },
  { section: "men", row: 11, seats: [{ number: 24, x: 696, y: 358 }, { number: 25, x: 736, y: 358 }, { number: 26, x: 776, y: 358 }, { number: 27, x: 816, y: 358 }] },
  { section: "men", row: 12, seats: [{ number: 60, x: 896, y: 358 }, { number: 61, x: 936, y: 358 }, { number: 62, x: 976, y: 358 }, { number: 63, x: 1016, y: 358 }] },
  { section: "men", row: 13, seats: [{ number: 64, x: 976, y: 396 }, { number: 65, x: 1016, y: 396 }] },
  { section: "men", row: 14, seats: [{ number: 32, x: 696, y: 548 }, { number: 33, x: 736, y: 548 }, { number: 34, x: 776, y: 548 }, { number: 35, x: 816, y: 548 }] },
  { section: "men", row: 15, seats: [{ number: 66, x: 896, y: 548 }, { number: 67, x: 936, y: 548 }, { number: 68, x: 976, y: 548 }, { number: 69, x: 1016, y: 548 }] },
  { section: "men", row: 16, seats: [{ number: 93, x: 1096, y: 548 }, { number: 94, x: 1136, y: 548 }, { number: 95, x: 1176, y: 548 }, { number: 96, x: 1216, y: 548 }] },
  { section: "men", row: 17, seats: [{ number: 36, x: 696, y: 586 }, { number: 37, x: 736, y: 586 }, { number: 38, x: 776, y: 586 }, { number: 39, x: 816, y: 586 }] },
  { section: "men", row: 18, seats: [{ number: 70, x: 896, y: 586 }, { number: 71, x: 936, y: 586 }, { number: 72, x: 976, y: 586 }, { number: 73, x: 1016, y: 586 }] },
  { section: "men", row: 19, seats: [{ number: 97, x: 1096, y: 586 }, { number: 98, x: 1136, y: 586 }, { number: 99, x: 1176, y: 586 }, { number: 100, x: 1216, y: 586 }] },
  { section: "men", row: 20, seats: [{ number: 40, x: 696, y: 624 }, { number: 41, x: 736, y: 624 }, { number: 42, x: 776, y: 624 }, { number: 43, x: 816, y: 624 }] },
  { section: "men", row: 21, seats: [{ number: 74, x: 896, y: 624 }, { number: 75, x: 936, y: 624 }, { number: 76, x: 976, y: 624 }, { number: 77, x: 1016, y: 624 }] },
  { section: "men", row: 22, seats: [{ number: 101, x: 1096, y: 624 }, { number: 102, x: 1136, y: 624 }, { number: 103, x: 1176, y: 624 }, { number: 104, x: 1216, y: 624 }] },
  { section: "men", row: 23, seats: [{ number: 44, x: 696, y: 662 }, { number: 45, x: 736, y: 662 }, { number: 46, x: 776, y: 662 }, { number: 47, x: 816, y: 662 }] },
  { section: "men", row: 24, seats: [{ number: 78, x: 896, y: 662 }, { number: 79, x: 936, y: 662 }, { number: 80, x: 976, y: 662 }, { number: 81, x: 1016, y: 662 }] },
  { section: "men", row: 25, seats: [{ number: 105, x: 1096, y: 662 }, { number: 106, x: 1136, y: 662 }, { number: 107, x: 1176, y: 662 }, { number: 108, x: 1216, y: 662 }] },
  { section: "men", row: 26, seats: [{ number: 48, x: 696, y: 700 }, { number: 49, x: 736, y: 700 }, { number: 50, x: 776, y: 700 }, { number: 51, x: 816, y: 700 }] },
  { section: "men", row: 27, seats: [{ number: 82, x: 896, y: 700 }, { number: 83, x: 936, y: 700 }, { number: 84, x: 976, y: 700 }, { number: 85, x: 1016, y: 700 }] },
  { section: "men", row: 28, seats: [{ number: 109, x: 1096, y: 700 }, { number: 110, x: 1136, y: 700 }, { number: 111, x: 1176, y: 700 }, { number: 112, x: 1216, y: 700 }] },
  { section: "men", row: 29, seats: [{ number: 113, x: 1096, y: 738 }, { number: 114, x: 1136, y: 738 }, { number: 115, x: 1176, y: 738 }, { number: 116, x: 1216, y: 738 }] },
];

const womenBenches: BenchLayout[] = [
  { section: "women", row: 1, seats: [{ number: 37, x: 256, y: 282 }, { number: 38, x: 256, y: 320 }, { number: 39, x: 256, y: 358 }, { number: 40, x: 256, y: 396 }] },
  { section: "women", row: 2, seats: [{ number: 41, x: 376, y: 510 }, { number: 42, x: 416, y: 510 }, { number: 43, x: 456, y: 510 }, { number: 44, x: 496, y: 510 }] },
  { section: "women", row: 3, seats: [{ number: 1, x: 56, y: 548 }, { number: 2, x: 96, y: 548 }, { number: 3, x: 136, y: 548 }] },
  { section: "women", row: 4, seats: [{ number: 19, x: 216, y: 548 }, { number: 20, x: 256, y: 548 }, { number: 21, x: 296, y: 548 }] },
  { section: "women", row: 5, seats: [{ number: 45, x: 376, y: 548 }, { number: 46, x: 416, y: 548 }, { number: 47, x: 456, y: 548 }, { number: 48, x: 496, y: 548 }] },
  { section: "women", row: 6, seats: [{ number: 4, x: 56, y: 586 }, { number: 5, x: 96, y: 586 }, { number: 6, x: 136, y: 586 }] },
  { section: "women", row: 7, seats: [{ number: 22, x: 216, y: 586 }, { number: 23, x: 256, y: 586 }, { number: 24, x: 296, y: 586 }] },
  { section: "women", row: 8, seats: [{ number: 49, x: 376, y: 586 }, { number: 50, x: 416, y: 586 }, { number: 51, x: 456, y: 586 }, { number: 52, x: 496, y: 586 }] },
  { section: "women", row: 9, seats: [{ number: 7, x: 56, y: 624 }, { number: 8, x: 96, y: 624 }, { number: 9, x: 136, y: 624 }] },
  { section: "women", row: 10, seats: [{ number: 25, x: 216, y: 624 }, { number: 26, x: 256, y: 624 }, { number: 27, x: 296, y: 624 }] },
  { section: "women", row: 11, seats: [{ number: 53, x: 376, y: 624 }, { number: 54, x: 416, y: 624 }, { number: 55, x: 456, y: 624 }, { number: 56, x: 496, y: 624 }] },
  { section: "women", row: 12, seats: [{ number: 10, x: 56, y: 662 }, { number: 11, x: 96, y: 662 }, { number: 12, x: 136, y: 662 }] },
  { section: "women", row: 13, seats: [{ number: 28, x: 216, y: 662 }, { number: 29, x: 256, y: 662 }, { number: 30, x: 296, y: 662 }] },
  { section: "women", row: 14, seats: [{ number: 57, x: 376, y: 662 }, { number: 58, x: 416, y: 662 }, { number: 59, x: 456, y: 662 }, { number: 60, x: 496, y: 662 }] },
  { section: "women", row: 15, seats: [{ number: 13, x: 56, y: 700 }, { number: 14, x: 96, y: 700 }, { number: 15, x: 136, y: 700 }] },
  { section: "women", row: 16, seats: [{ number: 31, x: 216, y: 700 }, { number: 32, x: 256, y: 700 }, { number: 33, x: 296, y: 700 }] },
  { section: "women", row: 17, seats: [{ number: 61, x: 376, y: 700 }, { number: 62, x: 416, y: 700 }, { number: 63, x: 456, y: 700 }, { number: 64, x: 496, y: 700 }] },
  { section: "women", row: 18, seats: [{ number: 16, x: 56, y: 738 }, { number: 17, x: 96, y: 738 }, { number: 18, x: 136, y: 738 }] },
  { section: "women", row: 19, seats: [{ number: 34, x: 216, y: 738 }, { number: 35, x: 256, y: 738 }, { number: 36, x: 296, y: 738 }] },
  { section: "women", row: 20, seats: [{ number: 65, x: 376, y: 738 }, { number: 66, x: 416, y: 738 }, { number: 67, x: 456, y: 738 }, { number: 68, x: 496, y: 738 }] },
];

export const blockedSeatNumbers: Record<SectionSlug, number[]> = {
  men: [],
  women: [],
};

export const blockedAreas: BlockedAreaLayout[] = [
  { x: 16, y: 54, width: 158, height: 188 },
  { x: 216, y: 54, width: 38, height: 188 },
  { x: 1176, y: 358, width: 78, height: 150 },
  { x: 456, y: 244, width: 38, height: 36 },
];

export const landmarks: LandmarkLayout[] = [
  { type: "aron", x: 795, y: 168, label: "ארון קודש", width: 200, height: 44 },
  { type: "bima", x: 795, y: 434, label: "בימה", width: 100, height: 100 },
  { type: "entrance", x: 430, y: 170, label: "כניסה גברים", width: 110, height: 32 },
  { type: "entrance", x: 1195, y: 168, label: "כניסה גברים", width: 110, height: 32 },
  { type: "entrance", x: 76, y: 474, label: "כניסה נשים", width: 168, height: 32 },
];

export const allBenches: BenchLayout[] = [...menBenches, ...womenBenches];

/** No pillars on this map */
export const pillars: { section: SectionSlug; cx: number; cy: number; r: number }[] = [];

export const sectionMeta = {
  men: { totalSeats: 112, displayName: "עזרת גברים" },
  women: { totalSeats: 68, displayName: "עזרת נשים" },
} as const;

export const MAP_WIDTH = 1312;
export const FULL_MAP_HEIGHT = 870;
export const womenSectionLabelX = 307.5;
export const womenSectionLabelY = 524;
export const womenUpperSectionLabelY = 274;
export const menSectionLabelX = 963.5;

export const sectionMapHeight: Record<SectionSlug, number> = {
  men: 830,
  women: 870,
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
  if (men.length !== 112) errors.push(`Men count: ${men.length}, expected 112`);
  if (women.length !== 68) errors.push(`Women count: ${women.length}, expected 68`);
  return errors;
}
