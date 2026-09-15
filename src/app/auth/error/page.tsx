"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

interface HealthPayload {
  ok: boolean;
  authUrl: string | null;
  google: { ok: boolean; detail: string };
  supabase: { ok: boolean; detail: string };
  checks: { name: string; ok: boolean; detail: string }[];
}

function AuthErrorContent() {
  const params = useSearchParams();
  const code = params.get("error") ?? "default";
  const [health, setHealth] = useState<HealthPayload | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  const isConfig = code === "Configuration";

  return (
    <div className="mx-auto max-w-lg space-y-6 rounded-2xl bg-white p-8 shadow">
      <h1 className="text-2xl font-bold text-[#8B4557]">
        {isConfig ? "לא הצלחנו להשלים את הכניסה" : "שגיאה בכניסה"}
      </h1>

      <p className="text-[#5D4037]">
        {isConfig
          ? "המערכת לא הצליחה להשלים את ההתחברות עם Google. זה בדרך כלל קורה בגלל הגדרות שרת או רשת — לא בגללכם."
          : "משהו השתבש בתהליך הכניסה. נסו שוב."}
      </p>

      <div className="rounded-xl bg-[#FFF9F3] p-4 text-sm text-[#5D4037]">
        <p className="font-medium">מה לעשות עכשיו:</p>
        <ol className="mt-2 list-decimal space-y-1 pr-5">
          <li>לחצו &quot;נסו שוב&quot; למטה</li>
          <li>ודאו שאתם נכנסים דרך הכתובת הרשמית של האתר (לא IP מקומי)</li>
          <li>אם הבעיה חוזרת — שלחו צילום מסך למנהל</li>
        </ol>
      </div>

      {health && !health.ok && (
        <details className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <summary className="cursor-pointer font-medium">פרטים טכניים (למנהל)</summary>
          <ul className="mt-2 space-y-1">
            {health.checks
              .filter((c) => !c.ok)
              .map((c) => (
                <li key={c.name}>
                  {c.name}: {c.detail}
                </li>
              ))}
            {!health.google.ok && <li>Google API: {health.google.detail}</li>}
            {!health.supabase.ok && <li>Supabase: {health.supabase.detail}</li>}
            {health.authUrl && <li>AUTH_URL: {health.authUrl}</li>}
          </ul>
        </details>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/map" })}
          className="rounded-lg bg-[#8B4557] px-5 py-2 text-white hover:bg-[#6D3444]"
        >
          נסו שוב
        </button>
        <Link
          href="/"
          className="rounded-lg border border-[#C4956A] px-5 py-2 text-[#5D4037]"
        >
          חזרה לדף הבית
        </Link>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <div className="py-12">
      <Suspense fallback={<div className="text-center">טוען...</div>}>
        <AuthErrorContent />
      </Suspense>
    </div>
  );
}
