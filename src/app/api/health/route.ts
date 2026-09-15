import { NextResponse } from "next/server";
import { env, validateEnv } from "@/lib/env";

export async function GET() {
  const checks = validateEnv();
  const envOk = checks.every((c) => c.ok);

  let googleReachable = false;
  let googleDetail = "not tested";
  try {
    const res = await fetch("https://www.googleapis.com/oauth2/v3/certs", {
      next: { revalidate: 0 },
    });
    googleReachable = res.ok;
    googleDetail = res.ok ? "ok" : `HTTP ${res.status}`;
  } catch (err) {
    googleDetail = err instanceof Error ? err.message : "fetch failed";
  }

  let supabaseReachable = false;
  let supabaseDetail = "not configured";
  const supabaseReadKey = env.supabaseAnonKey || env.supabaseServiceKey;
  if (env.supabaseUrl && supabaseReadKey) {
    try {
      const res = await fetch(`${env.supabaseUrl}/rest/v1/sections?select=id&limit=1`, {
        headers: {
          apikey: supabaseReadKey,
          Authorization: `Bearer ${supabaseReadKey}`,
        },
        next: { revalidate: 0 },
      });
      supabaseReachable = res.ok;
      supabaseDetail = res.ok ? "ok" : `HTTP ${res.status}`;
    } catch (err) {
      supabaseDetail = err instanceof Error ? err.message : "fetch failed";
    }
  }

  const ok = envOk && googleReachable && supabaseReachable;

  return NextResponse.json(
    {
      ok,
      authUrl: env.authUrl || null,
      checks,
      google: { ok: googleReachable, detail: googleDetail },
      supabase: { ok: supabaseReachable, detail: supabaseDetail },
    },
    { status: ok ? 200 : 503 }
  );
}
