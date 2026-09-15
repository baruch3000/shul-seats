"use client";

import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { QrCode } from "@/components/QrCode";
import { sectionMeta } from "@/data/layout";

interface StatsData {
  total: { available: number; total: number };
  men: { available: number; total: number };
  women: { available: number; total: number };
}

export default function HomePage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<StatsData | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.total) setStats(data);
      })
      .catch(() => {});
  }, []);

  const handleMapClick = () => {
    if (!session) {
      signIn("google", { callbackUrl: "/map" });
      return;
    }
    window.location.href = "/map";
  };

  return (
    <div className="animate-fade-in space-y-8 text-center">
      <div className="space-y-3 pt-8">
        <h1 className="text-4xl font-bold text-[#8B4557]">בחירת מקומות</h1>
        <p className="text-lg text-[#5D4037]">בית הכנסת — בחרו את המקום שלכם</p>
        {stats && (
          <p className="text-[#A08070]">
            {stats.total.available} מקומות פנויים מתוך {stats.total.total}
          </p>
        )}
      </div>

      <button
        onClick={handleMapClick}
        className="mx-auto block w-full max-w-lg rounded-2xl border-2 border-[#D4A59A] bg-white p-10 shadow-md transition hover:border-[#8B4557] hover:bg-[#FFF9F3]"
      >
        <h2 className="text-2xl font-bold text-[#8B4557]">מפת בית המדרש</h2>
        <p className="mt-3 text-sm text-[#A08070]">
          עזרת גברים + עזרת נשים — מפה אחת, גלילה מלמעלה למטה
        </p>
        {stats && (
          <div className="mt-4 flex justify-center gap-6 text-sm">
            <span>
              {sectionMeta.men.displayName}: {stats.men.available}/{stats.men.total}
            </span>
            <span>
              {sectionMeta.women.displayName}: {stats.women.available}/{stats.women.total}
            </span>
          </div>
        )}
      </button>

      <QrCode />

      <div className="flex flex-col items-center gap-3 pt-4">
        {session && (
          <Link
            href="/my-seats"
            className="rounded-lg bg-[#8B4557] px-6 py-3 font-medium text-white hover:bg-[#6D3444]"
          >
            המקומות שלי
          </Link>
        )}
        {!session && (
          <button
            onClick={() => signIn("google", { callbackUrl: "/map" })}
            className="rounded-lg bg-[#8B4557] px-6 py-3 font-medium text-white hover:bg-[#6D3444]"
          >
            כניסה עם Google לבחירת מקום
          </button>
        )}
      </div>
    </div>
  );
}
