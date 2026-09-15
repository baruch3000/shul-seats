/**
 * Pre-flight check before opening the site to users.
 * Run: npm run health
 */
import { execFileSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function curlStatus(url: string, headers: Record<string, string> = {}): number {
  const args = ["-s", "-o", "NUL", "-w", "%{http_code}"];
  for (const [k, v] of Object.entries(headers)) {
    args.push("-H", `${k}: ${v}`);
  }
  args.push(url);
  try {
    return parseInt(execFileSync("curl.exe", args, { encoding: "utf-8" }).trim(), 10);
  } catch {
    return 0;
  }
}

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvLocal();

const checks: { name: string; ok: boolean; detail: string }[] = [];

function record(name: string, ok: boolean, detail: string) {
  checks.push({ name, ok, detail });
  console.log(`${ok ? "✓" : "✗"} ${name}: ${detail}`);
}

async function main() {
  console.log("Shul Seats — health check\n");

  const secret =
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    "";
  record(
    "AUTH_SECRET",
    secret.length >= 16,
    secret ? "configured" : "missing — login will fail"
  );

  const googleId =
    process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID ?? "";
  const googleSecret =
    process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET ?? "";
  record(
    "Google OAuth",
    !!googleId && !!googleSecret,
    googleId ? "client id configured" : "GOOGLE_CLIENT_ID missing"
  );

  const authUrl =
    process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "";
  record(
    "AUTH_URL",
    !!authUrl,
    authUrl || "not set — set AUTH_URL to your public site URL"
  );

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const keyLooksValid = (k: string) =>
    k.startsWith("eyJ") || k.startsWith("sb_secret_") || k.startsWith("sb_publishable_");
  record(
    "Supabase env",
    !!supabaseUrl && !!serviceKey && keyLooksValid(serviceKey),
    !serviceKey
      ? "missing SUPABASE_SERVICE_ROLE_KEY"
      : !keyLooksValid(serviceKey)
        ? "invalid key format — copy from Supabase → Settings → API"
        : supabaseUrl
  );

  const googleStatus = curlStatus("https://www.googleapis.com/oauth2/v3/certs");
  record(
    "Google OAuth API",
    googleStatus >= 200 && googleStatus < 400,
    googleStatus >= 200 && googleStatus < 400
      ? "reachable"
      : `HTTP ${googleStatus} — check network / firewall`
  );

  const supabaseReadKey = anonKey || serviceKey;
  if (supabaseUrl && supabaseReadKey) {
    const supabaseStatus = curlStatus(
      `${supabaseUrl}/rest/v1/sections?select=id&limit=1`,
      {
        apikey: supabaseReadKey,
        Authorization: `Bearer ${supabaseReadKey}`,
      }
    );
    record(
      "Supabase API",
      supabaseStatus >= 200 && supabaseStatus < 400,
      supabaseStatus >= 200 && supabaseStatus < 400
        ? "connected"
        : `HTTP ${supabaseStatus} — check keys / run migration + seed`
    );
  }

  const failed = checks.filter((c) => !c.ok);
  console.log(
    failed.length
      ? `\n${failed.length} check(s) failed — fix before go-live.`
      : "\nAll checks passed."
  );
  process.exit(failed.length ? 1 : 0);
}

void main();
