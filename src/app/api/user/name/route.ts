import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
    }

    const { displayName } = await request.json();
    if (!displayName?.trim()) {
      return NextResponse.json({ error: "שם חובה" }, { status: 400 });
    }

    const trimmed = displayName.trim();

    try {
      const supabase = createServiceClient();
      const email = session.user.email;

      const { data: existing } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("users")
          .update({ display_name: trimmed })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("users").insert({
          email,
          display_name: trimmed,
        });
        if (error) throw error;
      }
    } catch (err) {
      console.warn("POST /api/user/name: Supabase unavailable, session-only save", err);
    }

    return NextResponse.json({ success: true, displayName: trimmed });
  } catch (err) {
    console.error("POST /api/user/name:", err);
    return NextResponse.json(
      { error: "שגיאת שרת — בדקו חיבור לאינטרנט ונסו שוב" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
    }

    if (session.user.displayName?.trim()) {
      return NextResponse.json({ displayName: session.user.displayName });
    }

    const supabase = createServiceClient();
    const { data } = await supabase
      .from("users")
      .select("display_name")
      .eq("email", session.user.email)
      .maybeSingle();

    return NextResponse.json({ displayName: data?.display_name ?? "" });
  } catch (err) {
    console.error("GET /api/user/name:", err);
    return NextResponse.json({ displayName: "" });
  }
}
