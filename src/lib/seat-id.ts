import type { SectionSlug } from "@/lib/types";

const LAYOUT_ID = /^layout-(men|women)-(\d+)$/;

export function parseSeatId(
  seatId: string
): { section: SectionSlug; seatNumber: number } | null {
  const m = seatId.match(LAYOUT_ID);
  if (m) {
    return {
      section: m[1] as SectionSlug,
      seatNumber: Number(m[2]),
    };
  }
  return null;
}

export function layoutSeatId(section: SectionSlug, seatNumber: number): string {
  return `layout-${section}-${seatNumber}`;
}

export function seatKey(section: SectionSlug, seatNumber: number): string {
  return `${section}-${seatNumber}`;
}
