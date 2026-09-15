import { NextResponse } from "next/server";
import { clearAdminSession, getAdminSession, logAudit } from "@/lib/admin-auth";

export async function POST() {
  const session = await getAdminSession();
  if (session) await logAudit(session.email, "logout");
  await clearAdminSession();
  return NextResponse.json({ success: true });
}
