import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserReservations } from "@/lib/reservation-store";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
    }

    const userId = session.user.id ?? session.user.email;
    const list = await getUserReservations(userId, session.user.email);

    const reservations = list.map((r) => ({
      id: r.id,
      seatId: r.seatId,
      section: r.section,
      seatNumber: r.seatNumber,
      reservedName: r.reservedName,
      reservedAt: r.reservedAt,
    }));

    return NextResponse.json({ reservations });
  } catch {
    return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
  }
}
