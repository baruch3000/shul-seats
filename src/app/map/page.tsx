"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { SeatMap } from "@/components/SeatMap";

export default function UnifiedMapPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }
    const displayName =
      session?.user?.displayName?.trim() || session?.user?.name?.trim();
    if (status === "authenticated" && !displayName) {
      sessionStorage.setItem("postNameRedirect", "/map");
      router.push("/onboarding/name");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return <div className="py-12 text-center text-[#8B4557]">טוען...</div>;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-[#8B4557]">מפת בית המדרש</h1>
        <p className="text-sm text-[#A08070]">
          {session?.user.displayName || session?.user.name} — בחרו מקומות פנויים
        </p>
      </div>

      <SeatMap section="all" />
    </div>
  );
}
