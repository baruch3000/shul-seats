import { NextResponse } from "next/server";
import { getAdminSession, logAudit } from "@/lib/admin-auth";
import {
  adminAssignSeat,
  adminReleaseSeat,
} from "@/lib/reservation-store";
import { createServiceClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { seatId, action, reservedName } = await request.json();
    if (!seatId || !action) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    if (action === "release") {
      await adminReleaseSeat(seatId);
      await logAudit(admin.email, "release_seat", { seatId });
    } else if (action === "block" || action === "unblock") {
      try {
        const supabase = createServiceClient();
        if (action === "block") {
          await supabase.from("reservations").delete().eq("seat_id", seatId);
          await supabase.from("seats").update({ status: "blocked" }).eq("id", seatId);
        } else {
          await supabase.from("seats").update({ status: "available" }).eq("id", seatId);
        }
        await logAudit(admin.email, `${action}_seat`, { seatId });
      } catch {
        return NextResponse.json(
          { error: "חסימת מקומות דורשת חיבור ל-Supabase" },
          { status: 503 }
        );
      }
    } else if (action === "assign") {
      if (!reservedName?.trim()) {
        return NextResponse.json({ error: "שם חובה" }, { status: 400 });
      }
      const ok = await adminAssignSeat(seatId, reservedName);
      if (!ok) {
        return NextResponse.json({ error: "לא ניתן להקצות מקום" }, { status: 400 });
      }
      await logAudit(admin.email, "assign_seat", { seatId, reservedName });
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
  }
}
