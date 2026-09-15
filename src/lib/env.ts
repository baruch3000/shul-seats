function read(name: string, ...fallbacks: string[]): string {
  for (const key of [name, ...fallbacks]) {
    const val = process.env[key]?.trim();
    if (val) return val;
  }
  return "";
}

export const env = {
  authSecret: read("AUTH_SECRET", "NEXTAUTH_SECRET"),
  authUrl: read("AUTH_URL", "NEXTAUTH_URL"),
  googleClientId: read("AUTH_GOOGLE_ID", "GOOGLE_CLIENT_ID"),
  googleClientSecret: read("AUTH_GOOGLE_SECRET", "GOOGLE_CLIENT_SECRET"),
  supabaseUrl: read("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: read("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceKey: read("SUPABASE_SERVICE_ROLE_KEY"),
};

export type EnvCheck = { ok: boolean; name: string; detail: string };

export function validateEnv(): EnvCheck[] {
  const checks: EnvCheck[] = [];

  checks.push({
    name: "AUTH_SECRET",
    ok: env.authSecret.length >= 16,
    detail: env.authSecret ? "ok" : "missing — Google login will fail",
  });

  checks.push({
    name: "Google OAuth",
    ok: !!env.googleClientId && !!env.googleClientSecret,
    detail:
      env.googleClientId && env.googleClientSecret
        ? "ok"
        : "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET missing",
  });

  checks.push({
    name: "AUTH_URL",
    ok: !!env.authUrl,
    detail: env.authUrl || "set AUTH_URL to your public URL (e.g. https://seats.example.com)",
  });

  const keyLooksValid = (k: string) =>
    k.startsWith("eyJ") || k.startsWith("sb_secret_") || k.startsWith("sb_publishable_");
  checks.push({
    name: "Supabase keys",
    ok:
      !!env.supabaseUrl &&
      !!env.supabaseServiceKey &&
      keyLooksValid(env.supabaseServiceKey),
    detail:
      env.supabaseUrl && env.supabaseServiceKey && keyLooksValid(env.supabaseServiceKey)
        ? "ok"
        : "copy keys from Supabase → Settings → API",
  });

  return checks;
}

export function logEnvIssues(): void {
  const failed = validateEnv().filter((c) => !c.ok);
  if (!failed.length) return;
  console.warn("[shul-seats] Environment issues:");
  for (const f of failed) console.warn(`  - ${f.name}: ${f.detail}`);
}
