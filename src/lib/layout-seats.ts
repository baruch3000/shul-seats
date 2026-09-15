import {
  allBenches,
  blockedSeatNumbers,
  getBenchesForSection,
} from "@/data/layout";
import type { PublicSeat, SectionSlug } from "@/lib/types";

export function getLayoutFallbackSeats(
  section: SectionSlug | "all" = "all"
): PublicSeat[] {
  const benches =
    section === "all" ? allBenches : getBenchesForSection(section);

  return benches.flatMap((bench) =>
    bench.seats.map((s) => ({
      id: `layout-${bench.section}-${s.number}`,
      section: bench.section,
      seatNumber: s.number,
      x: s.x,
      y: s.y,
      status: blockedSeatNumbers[bench.section]?.includes(s.number)
        ? ("blocked" as const)
        : ("available" as const),
    }))
  );
}
