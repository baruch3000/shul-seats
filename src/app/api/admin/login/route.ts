import { NextResponse } from "next/server";
import { createAdminSession, logAudit, verifyAdminPassword } from "@/lib/admin-auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "חסר אימייל או סיסמה" }, { status: 400 });
    }

    const result = await verifyAdminPassword(email, password);
    if (!result.ok) {
      if (result.reason === "db_error") {
        return NextResponse.json(
          {
            error:
              "אין חיבור ל-Supabase — הרצו npm run seed אחרי שהפרויקט פעיל, או השתמשו בסיסמה: ShulSeats2026!",
          },
          { status: 503 }
        );
      }
      return NextResponse.json({ error: "אימייל או סיסמה שגויים" }, { status: 401 });
    }

    await createAdminSession(result.admin);
    try {
      await logAudit(result.admin.email, "login");
    } catch {
      // DB unavailable — session still valid
    }

    return NextResponse.json({ success: true, name: result.admin.name });
  } catch {
    return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
  }
}
