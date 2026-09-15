import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  createReservations,
  deleteReservations,
} from "@/lib/reservation-store";
import { isBookingOpen } from "@/lib/seats";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "יש להתחבר עם Google" }, { status: 401 });
    }

    const open = await isBookingOpen();
    if (!open) {
      return NextResponse.json({ error: "הבחירה סגורה כרגע" }, { status: 403 });
    }

    const { seatIds, replaceExisting } = await request.json();
    if (!Array.isArray(seatIds) || seatIds.length === 0) {
      return NextResponse.json({ error: "לא נבחרו מקומות" }, { status: 400 });
    }

    const displayName = session.user.displayName?.trim();
    if (!displayName) {
      return NextResponse.json(
        { error: "יש להזין שם לפני בחירת מקום" },
        { status: 400 }
      );
    }

    const userId = session.user.id ?? session.user.email;
    const { reserved, failed } = await createReservations({
      seatIds,
      userId,
      userEmail: session.user.email,
      reservedName: displayName,
      replaceExisting: !!replaceExisting,
    });

    if (reserved === 0) {
      return NextResponse.json(
        {
          error: "לא ניתן לשמור — המקומות תפוסים או שאין חיבור לשרת",
          reserved: 0,
          failed,
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      reserved,
      failed,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
    }

    const { seatIds } = await request.json();
    if (!Array.isArray(seatIds) || seatIds.length === 0) {
      return NextResponse.json({ error: "לא נבחרו מקומות" }, { status: 400 });
    }

    const userId = session.user.id ?? session.user.email;
    await deleteReservations({
      seatIds,
      userId,
      userEmail: session.user.email,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
  }
}
