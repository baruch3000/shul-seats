import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { isSupabaseReachable } from "@/lib/reservation-store";
import { getAdminSeats } from "@/lib/seats";
import type { SectionSlug } from "@/lib/types";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const section = searchParams.get("section");
    const seats = await getAdminSeats(
      section && section !== "all" ? (section as SectionSlug) : undefined
    );
    const dbOk = await isSupabaseReachable();
    return NextResponse.json({
      seats,
      synced: true,
      storage: dbOk ? "supabase" : "local",
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
