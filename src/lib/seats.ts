import { blockedSeatNumbers } from "@/data/layout";
import { getLayoutFallbackAdminSeats, getLayoutStatsFallback } from "@/lib/layout-fallback";
import { getLayoutFallbackSeats } from "@/lib/layout-seats";
import { listReservations, type StoredReservation } from "@/lib/reservation-store";
import { seatKey } from "@/lib/seat-id";
import { createServiceClient } from "@/lib/supabase/server";
import type { AdminSeat, PublicSeat, PublicSeatStatus, SectionSlug, Stats } from "@/lib/types";

interface SeatRow {
  id: string;
  section_id: SectionSlug;
  seat_number: number;
  pos_x: number;
  pos_y: number;
  status: "available" | "blocked";
  reservations: {
    id: string;
    user_id: string;
    reserved_name: string;
    users: { email: string } | { email: string }[] | null;
  }[] | null;
}

function isLayoutBlocked(section: SectionSlug, seatNumber: number): boolean {
  return blockedSeatNumbers[section]?.includes(seatNumber) ?? false;
}

async function fetchSeatRows(section?: SectionSlug): Promise<SeatRow[] | null> {
  try {
    const supabase = createServiceClient();
    let query = supabase
      .from("seats")
      .select(
        `
      id,
      section_id,
      seat_number,
      pos_x,
      pos_y,
      status,
      reservations (
        id,
        user_id,
        reserved_name,
        users ( email )
      )
    `
      )
      .order("seat_number");

    if (section) query = query.eq("section_id", section);

    const { data, error } = await query;
    if (error) {
      console.error("fetchSeatRows:", error.message);
      return null;
    }
    return (data ?? []) as unknown as SeatRow[];
  } catch (err) {
    console.error("fetchSeatRows:", err);
    return null;
  }
}

function overlayReservations(
  seats: PublicSeat[],
  reservations: StoredReservation[],
  userId?: string,
  userEmail?: string
): PublicSeat[] {
  const byKey = new Map(
    reservations.map((r) => [seatKey(r.section, r.seatNumber), r])
  );

  return seats.map((seat) => {
    if (isLayoutBlocked(seat.section, seat.seatNumber)) {
      return { ...seat, status: "blocked" as const };
    }

    const r = byKey.get(seatKey(seat.section, seat.seatNumber));
    if (!r) return seat;

    const isYours =
      (userId && r.userId === userId) ||
      (!!userEmail && r.userEmail === userEmail);

    return {
      ...seat,
      id: r.seatId,
      status: (isYours ? "yours" : "reserved") as PublicSeatStatus,
    };
  });
}

function overlayAdminReservations(
  seats: PublicSeat[],
  reservations: StoredReservation[]
): AdminSeat[] {
  const byKey = new Map(
    reservations.map((r) => [seatKey(r.section, r.seatNumber), r])
  );

  return seats.map((seat) => {
    if (isLayoutBlocked(seat.section, seat.seatNumber)) {
      return { ...seat, status: "blocked" as const };
    }

    const r = byKey.get(seatKey(seat.section, seat.seatNumber));
    if (!r) {
      return { ...seat, status: "available" as const };
    }

    return {
      ...seat,
      id: r.seatId,
      status: "reserved" as const,
      reservedName: r.reservedName,
      reservedEmail: r.userEmail,
      userId: r.userId,
    };
  });
}

export function toPublicSeat(row: SeatRow, userId?: string): PublicSeat {
  const reservation = row.reservations?.[0];
  let status: PublicSeatStatus = "available";

  if (isLayoutBlocked(row.section_id, row.seat_number)) {
    status = "blocked";
  } else if (reservation) {
    status = reservation.user_id === userId ? "yours" : "reserved";
  }

  return {
    id: row.id,
    section: row.section_id,
    seatNumber: row.seat_number,
    x: row.pos_x,
    y: row.pos_y,
    status,
  };
}

async function buildPublicSeats(
  section: SectionSlug | "all",
  userId?: string,
  userEmail?: string
): Promise<PublicSeat[]> {
  const rows =
    section === "all" ? await fetchSeatRows() : await fetchSeatRows(section);

  let seats =
    rows?.length && section === "all"
      ? rows.map((r) => toPublicSeat(r, userId))
      : rows?.length && section !== "all"
        ? rows.map((r) => toPublicSeat(r, userId))
        : getLayoutFallbackSeats(section);

  const reservations = await listReservations();
  return overlayReservations(seats, reservations, userId, userEmail);
}

export async function getPublicSeats(
  section: SectionSlug,
  userId?: string,
  userEmail?: string
): Promise<PublicSeat[]> {
  return buildPublicSeats(section, userId, userEmail);
}

export async function getAllPublicSeats(
  userId?: string,
  userEmail?: string
): Promise<PublicSeat[]> {
  return buildPublicSeats("all", userId, userEmail);
}

export async function getAdminSeats(section?: SectionSlug): Promise<AdminSeat[]> {
  const rows = await fetchSeatRows(section);
  const reservations = await listReservations();

  let seats: PublicSeat[] =
    rows?.length && !section
      ? rows.map((r) => toPublicSeat(r))
      : rows?.length && section
        ? rows.filter((r) => r.section_id === section).map((r) => toPublicSeat(r))
        : getLayoutFallbackAdminSeats(section).map((s) => ({
            id: s.id,
            section: s.section,
            seatNumber: s.seatNumber,
            x: s.x,
            y: s.y,
            status: s.status,
          }));

  if (section) {
    seats = seats.filter((s) => s.section === section);
  }

  return overlayAdminReservations(seats, reservations);
}

export async function getStats(): Promise<{ men: Stats; women: Stats; total: Stats }> {
  const reservations = await listReservations();
  const rows = await fetchSeatRows();

  if (!rows?.length) {
    const fallback = getLayoutStatsFallback();
    const reserved = reservations.length;
    if (reserved === 0) return fallback;

    return {
      men: {
        ...fallback.men,
        reserved: reservations.filter((r) => r.section === "men").length,
        available:
          fallback.men.available -
          reservations.filter((r) => r.section === "men").length,
      },
      women: {
        ...fallback.women,
        reserved: reservations.filter((r) => r.section === "women").length,
        available:
          fallback.women.available -
          reservations.filter((r) => r.section === "women").length,
      },
      total: {
        ...fallback.total,
        reserved,
        available: fallback.total.available - reserved,
      },
    };
  }

  function calc(section: SectionSlug): Stats {
    const sectionRows = rows!.filter((r) => r.section_id === section);
    const blocked = sectionRows.filter((r) =>
      isLayoutBlocked(r.section_id, r.seat_number)
    ).length;
    const reservedKeys = new Set(
      reservations.filter((r) => r.section === section).map((r) => seatKey(r.section, r.seatNumber))
    );
    const reservedFromDb = sectionRows.filter((r) => r.reservations?.length).length;
    const reserved = Math.max(reservedFromDb, reservedKeys.size);
    const total = sectionRows.length;
    return {
      total,
      blocked,
      reserved,
      available: total - blocked - reserved,
    };
  }

  const men = calc("men");
  const women = calc("women");

  return {
    men,
    women,
    total: {
      total: men.total + women.total,
      available: men.available + women.available,
      reserved: men.reserved + women.reserved,
      blocked: men.blocked + women.blocked,
    },
  };
}

export async function isBookingOpen(): Promise<boolean> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "booking_open")
      .maybeSingle();

    if (error || !data) return true;
    return data.value === true || data.value === "true";
  } catch {
    return true;
  }
}
