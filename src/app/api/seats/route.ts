import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getLayoutFallbackSeats } from "@/lib/layout-seats";
import { isSupabaseReachable } from "@/lib/reservation-store";
import { getAllPublicSeats, getPublicSeats } from "@/lib/seats";
import type { SectionSlug } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const section = searchParams.get("section");

  try {
    const session = await auth();
    const userId = session?.user?.id;
    const userEmail = session?.user?.email ?? undefined;

    let seats;
    if (!section || section === "all") {
      seats = await getAllPublicSeats(userId, userEmail);
    } else if (section === "men" || section === "women") {
      seats = await getPublicSeats(section as SectionSlug, userId, userEmail);
    } else {
      return NextResponse.json({ error: "section invalid" }, { status: 400 });
    }

    const dbOk = await isSupabaseReachable();
    return NextResponse.json({
      seats,
      synced: true,
      storage: dbOk ? "supabase" : "local",
    });
  } catch (error) {
    console.error(error);
    const fallbackSection =
      section === "men" || section === "women" ? section : "all";
    return NextResponse.json({
      seats: getLayoutFallbackSeats(fallbackSection as SectionSlug | "all"),
      synced: false,
      storage: "none",
    });
  }
}
