import { allBenches, blockedSeatNumbers } from "@/data/layout";
import type { AdminSeat, PublicSeat, SectionSlug, Stats } from "@/lib/types";
import { getLayoutFallbackSeats } from "@/lib/layout-seats";

export function getLayoutStatsFallback(): {
  men: Stats;
  women: Stats;
  total: Stats;
} {
  function calc(section: SectionSlug): Stats {
    const blocked = blockedSeatNumbers[section]?.length ?? 0;
    const total = allBenches
      .filter((b) => b.section === section)
      .reduce((n, b) => n + b.seats.length, 0);
    return { total, blocked, reserved: 0, available: total - blocked };
  }

  const men = calc("men");
  const women = calc("women");
  return {
    men,
    women,
    total: {
      total: men.total + women.total,
      available: men.available + women.available,
      reserved: 0,
      blocked: men.blocked + women.blocked,
    },
  };
}

export function getLayoutFallbackAdminSeats(
  section?: SectionSlug
): AdminSeat[] {
  const seats = getLayoutFallbackSeats(section ?? "all");
  return seats.map((s) => ({
    ...s,
    status: s.status === "blocked" ? "blocked" : "available",
  }));
}

export function mergeLayoutSeatsWithDb(
  layoutSeats: PublicSeat[],
  dbSeats: PublicSeat[]
): PublicSeat[] {
  const byKey = new Map(
    dbSeats.map((s) => [`${s.section}-${s.seatNumber}`, s])
  );
  return layoutSeats.map((s) => {
    const fromDb = byKey.get(`${s.section}-${s.seatNumber}`);
    return fromDb ?? s;
  });
}
