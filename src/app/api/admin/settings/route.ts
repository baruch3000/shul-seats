import { NextResponse } from "next/server";
import { getAdminSession, logAudit } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    await getAdminSession();
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "booking_open")
      .maybeSingle();

    const open = data?.value === true || data?.value === "true";
    return NextResponse.json({ bookingOpen: open ?? true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookingOpen } = await request.json();
    const supabase = createServiceClient();

    await supabase
      .from("settings")
      .upsert({ key: "booking_open", value: bookingOpen });

    await logAudit(admin.email, "toggle_booking", { bookingOpen });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
  }
}
