import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { blockedSeatNumbers } from "@/data/layout";
import { layoutSeatId, parseSeatId, seatKey } from "@/lib/seat-id";
import { createServiceClient } from "@/lib/supabase/server";
import type { SectionSlug } from "@/lib/types";

export interface StoredReservation {
  id: string;
  seatId: string;
  section: SectionSlug;
  seatNumber: number;
  userId: string;
  userEmail: string;
  reservedName: string;
  reservedAt: string;
}

const DATA_DIR = resolve(process.cwd(), ".data");
const FILE_PATH = resolve(DATA_DIR, "reservations.json");

/** Local file store is dev-only; Vercel has no shared disk between instances. */
function allowFileFallback(): boolean {
  return process.env.NODE_ENV !== "production";
}

function readFileStore(): StoredReservation[] {
  try {
    if (!existsSync(FILE_PATH)) return [];
    const raw = JSON.parse(readFileSync(FILE_PATH, "utf-8")) as {
      reservations?: StoredReservation[];
    };
    return raw.reservations ?? [];
  } catch {
    return [];
  }
}

function writeFileStore(reservations: StoredReservation[]) {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(
    FILE_PATH,
    JSON.stringify({ reservations, updatedAt: new Date().toISOString() }, null, 2),
    "utf-8"
  );
}

export async function isSupabaseReachable(): Promise<boolean> {
  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from("sections").select("id").limit(1);
    return !error;
  } catch {
    return false;
  }
}

function mapDbReservation(r: {
  id: string;
  user_id: string;
  reserved_name: string;
  reserved_at: string;
  seats: unknown;
  users: unknown;
}): StoredReservation {
  const seat = r.seats as {
    id: string;
    section_id: SectionSlug;
    seat_number: number;
  };
  const users = r.users as { email: string } | { email: string }[] | null;
  const email = Array.isArray(users) ? users[0]?.email : users?.email;
  return {
    id: r.id,
    seatId: seat.id,
    section: seat.section_id,
    seatNumber: seat.seat_number,
    userId: r.user_id,
    userEmail: email ?? "",
    reservedName: r.reserved_name,
    reservedAt: r.reserved_at,
  };
}

export async function listReservations(): Promise<StoredReservation[]> {
  const fileReservations = allowFileFallback() ? readFileStore() : [];
  let dbReservations: StoredReservation[] = [];

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase.from("reservations").select(`
        id,
        user_id,
        reserved_name,
        reserved_at,
        seats ( id, section_id, seat_number ),
        users ( email )
      `);

    if (!error && data?.length) {
      dbReservations = data.map((r) => mapDbReservation(r));
    }
  } catch {
    // use file store only in dev
  }

  if (!allowFileFallback()) return dbReservations;
  if (!dbReservations.length) return fileReservations;

  const dbKeys = new Set(
    dbReservations.map((r) => seatKey(r.section, r.seatNumber))
  );
  const fileOnly = fileReservations.filter(
    (r) => !dbKeys.has(seatKey(r.section, r.seatNumber))
  );
  return [...dbReservations, ...fileOnly];
}

async function resolveDbUserId(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  userEmail: string
): Promise<string | null> {
  if (userId && !userId.includes("@")) return userId;
  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("email", userEmail)
    .maybeSingle();
  return data?.id ?? null;
}

async function findDbSeat(
  supabase: ReturnType<typeof createServiceClient>,
  seatId: string
) {
  const parsed = parseSeatId(seatId);
  if (parsed) {
    const { data } = await supabase
      .from("seats")
      .select("id, section_id, seat_number, reservations(id)")
      .eq("section_id", parsed.section)
      .eq("seat_number", parsed.seatNumber)
      .maybeSingle();
    return data;
  }

  const { data } = await supabase
    .from("seats")
    .select("id, section_id, seat_number, reservations(id)")
    .eq("id", seatId)
    .maybeSingle();
  return data;
}

export async function createReservations(input: {
  seatIds: string[];
  userId: string;
  userEmail: string;
  reservedName: string;
  replaceExisting: boolean;
}): Promise<{ reserved: number; failed: number }> {
  const supabaseOk = await isSupabaseReachable();

  if (supabaseOk) {
    try {
      const supabase = createServiceClient();
      const dbUserId = await resolveDbUserId(
        supabase,
        input.userId,
        input.userEmail
      );

      if (dbUserId) {
        if (input.replaceExisting) {
          await supabase.from("reservations").delete().eq("user_id", dbUserId);
        }

        let reserved = 0;
        let failed = 0;

        for (const seatId of input.seatIds) {
          const seat = await findDbSeat(supabase, seatId);
          const section = seat?.section_id as SectionSlug | undefined;
          const layoutBlocked =
            !!seat &&
            !!section &&
            blockedSeatNumbers[section]?.includes(seat.seat_number);

          if (!seat || layoutBlocked || seat.reservations?.length) {
            failed++;
            continue;
          }

          const { error } = await supabase.from("reservations").insert({
            seat_id: seat.id,
            user_id: dbUserId,
            reserved_name: input.reservedName,
            reserved_by: "user",
          });

          if (error) failed++;
          else reserved++;
        }

        if (reserved > 0) return { reserved, failed };
        if (!allowFileFallback()) {
          return { reserved: 0, failed: input.seatIds.length };
        }
      }
    } catch {
      if (!allowFileFallback()) {
        return { reserved: 0, failed: input.seatIds.length };
      }
    }
  }

  if (!allowFileFallback()) {
    return { reserved: 0, failed: input.seatIds.length };
  }

  return createReservationsFile(input);
}

function createReservationsFile(input: {
  seatIds: string[];
  userId: string;
  userEmail: string;
  reservedName: string;
  replaceExisting: boolean;
}): { reserved: number; failed: number } {
  let reservations = readFileStore();

  if (input.replaceExisting) {
    reservations = reservations.filter(
      (r) => r.userEmail !== input.userEmail && r.userId !== input.userId
    );
  }

  const taken = new Set(reservations.map((r) => seatKey(r.section, r.seatNumber)));
  let reserved = 0;
  let failed = 0;

  for (const seatId of input.seatIds) {
    const parsed = parseSeatId(seatId);
    if (!parsed) {
      failed++;
      continue;
    }
    if (blockedSeatNumbers[parsed.section]?.includes(parsed.seatNumber)) {
      failed++;
      continue;
    }
    const key = seatKey(parsed.section, parsed.seatNumber);
    if (taken.has(key)) {
      failed++;
      continue;
    }

    reservations.push({
      id: crypto.randomUUID(),
      seatId: layoutSeatId(parsed.section, parsed.seatNumber),
      section: parsed.section,
      seatNumber: parsed.seatNumber,
      userId: input.userId,
      userEmail: input.userEmail,
      reservedName: input.reservedName,
      reservedAt: new Date().toISOString(),
    });
    taken.add(key);
    reserved++;
  }

  writeFileStore(reservations);
  return { reserved, failed };
}

export async function deleteReservations(input: {
  seatIds: string[];
  userId: string;
  userEmail: string;
}): Promise<boolean> {
  const supabaseOk = await isSupabaseReachable();

  if (supabaseOk) {
    try {
      const supabase = createServiceClient();
      const dbUserId = await resolveDbUserId(
        supabase,
        input.userId,
        input.userEmail
      );
      const dbSeatIds: string[] = [];
      for (const seatId of input.seatIds) {
        const seat = await findDbSeat(supabase, seatId);
        if (seat?.id) dbSeatIds.push(seat.id);
      }

      if (dbUserId && dbSeatIds.length) {
        const { error } = await supabase
          .from("reservations")
          .delete()
          .in("seat_id", dbSeatIds)
          .eq("user_id", dbUserId);
        if (!error) return true;
      }
    } catch {
      if (!allowFileFallback()) return false;
    }
  }

  if (!allowFileFallback()) return false;

  const ids = new Set(input.seatIds);
  const parsedKeys = new Set(
    input.seatIds
      .map(parseSeatId)
      .filter(Boolean)
      .map((p) => seatKey(p!.section, p!.seatNumber))
  );

  const next = readFileStore().filter((r) => {
    const isOwner = r.userId === input.userId || r.userEmail === input.userEmail;
    if (!isOwner) return true;
    if (ids.has(r.seatId)) return false;
    if (parsedKeys.has(seatKey(r.section, r.seatNumber))) return false;
    return true;
  });

  writeFileStore(next);
  return true;
}

export async function getUserReservations(
  userId: string,
  userEmail: string
): Promise<StoredReservation[]> {
  const all = await listReservations();
  return all.filter((r) => r.userId === userId || r.userEmail === userEmail);
}

function seatMatchesId(r: StoredReservation, seatId: string): boolean {
  if (r.seatId === seatId) return true;
  const parsed = parseSeatId(seatId);
  if (!parsed) return false;
  return r.section === parsed.section && r.seatNumber === parsed.seatNumber;
}

export async function adminReleaseSeat(seatId: string): Promise<boolean> {
  const supabaseOk = await isSupabaseReachable();

  if (supabaseOk) {
    try {
      const supabase = createServiceClient();
      const seat = await findDbSeat(supabase, seatId);
      if (seat?.id) {
        const { error } = await supabase
          .from("reservations")
          .delete()
          .eq("seat_id", seat.id);
        if (!error) return true;
      }
    } catch {
      if (!allowFileFallback()) return false;
    }
  }

  if (!allowFileFallback()) return false;

  const next = readFileStore().filter((r) => !seatMatchesId(r, seatId));
  writeFileStore(next);
  return true;
}

export async function adminAssignSeat(
  seatId: string,
  reservedName: string
): Promise<boolean> {
  const supabaseOk = await isSupabaseReachable();

  if (supabaseOk) {
    try {
      const supabase = createServiceClient();
      const seat = await findDbSeat(supabase, seatId);
      if (seat?.id) {
        await supabase.from("reservations").delete().eq("seat_id", seat.id);

        const { data: placeholderUser } = await supabase
          .from("users")
          .select("id")
          .eq("email", "admin-assigned@shul.local")
          .maybeSingle();

        let userId = placeholderUser?.id;
        if (!userId) {
          const { data: newUser } = await supabase
            .from("users")
            .insert({
              email: "admin-assigned@shul.local",
              display_name: 'הוקצה ע"י גבאי',
            })
            .select("id")
            .single();
          userId = newUser?.id;
        }

        if (userId) {
          const { error } = await supabase.from("reservations").insert({
            seat_id: seat.id,
            user_id: userId,
            reserved_name: reservedName.trim(),
            reserved_by: "admin",
          });
          if (!error) return true;
        }
      }
    } catch {
      if (!allowFileFallback()) return false;
    }
  }

  if (!allowFileFallback()) return false;

  const parsed = parseSeatId(seatId);
  if (!parsed) return false;

  let reservations = readFileStore().filter((r) => !seatMatchesId(r, seatId));
  reservations.push({
    id: crypto.randomUUID(),
    seatId: layoutSeatId(parsed.section, parsed.seatNumber),
    section: parsed.section,
    seatNumber: parsed.seatNumber,
    userId: "admin-assigned",
    userEmail: "admin-assigned@shul.local",
    reservedName: reservedName.trim(),
    reservedAt: new Date().toISOString(),
  });
  writeFileStore(reservations);
  return true;
}
