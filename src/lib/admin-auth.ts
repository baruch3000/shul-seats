import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import type { AdminSession } from "@/lib/types";

const COOKIE_NAME = "admin_session";
const secret = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "fallback-secret-change-me"
);

/** Must match scripts/seed.ts */
const SEEDED_ADMINS: Record<string, string> = {
  "5379833@gmail.com": "מנהל ראשי",
  "moti96043@gmail.com": "מוטי",
};

export type AdminLoginResult =
  | { ok: true; admin: AdminSession }
  | { ok: false; reason: "invalid" | "db_error" };

function envAdminFallback(email: string, password: string): AdminSession | null {
  const expected = process.env.ADMIN_INITIAL_PASSWORD || "ShulSeats2026!";
  const name = SEEDED_ADMINS[email];
  if (!name || password !== expected) return null;
  return { email, name };
}

export async function verifyAdminPassword(
  email: string,
  password: string
): Promise<AdminLoginResult> {
  const normalized = email.toLowerCase().trim();

  try {
    const supabase = createServiceClient();
    const { data: admin, error } = await supabase
      .from("admins")
      .select("email, name, password_hash, active")
      .eq("email", normalized)
      .maybeSingle();

    if (error) {
      const fallback = envAdminFallback(normalized, password);
      if (fallback) return { ok: true, admin: fallback };
      return { ok: false, reason: "db_error" };
    }

    if (admin?.active) {
      const valid = await bcrypt.compare(password, admin.password_hash);
      if (valid) {
        return { ok: true, admin: { email: admin.email, name: admin.name } };
      }
      return { ok: false, reason: "invalid" };
    }

    // Admin row missing — allow seeded credentials until npm run seed succeeds
    const fallback = envAdminFallback(normalized, password);
    if (fallback) return { ok: true, admin: fallback };

    return { ok: false, reason: "invalid" };
  } catch {
    const fallback = envAdminFallback(normalized, password);
    if (fallback) return { ok: true, admin: fallback };
    return { ok: false, reason: "db_error" };
  }
}

export async function createAdminSession(admin: AdminSession) {
  const token = await new SignJWT({ email: admin.email, name: admin.name })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("8h")
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      email: payload.email as string,
      name: payload.name as string,
    };
  } catch {
    return null;
  }
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

export async function logAudit(
  adminEmail: string,
  action: string,
  details?: Record<string, unknown>
) {
  const supabase = createServiceClient();
  await supabase.from("audit_log").insert({
    admin_email: adminEmail,
    action,
    details: details ?? null,
  });
}
