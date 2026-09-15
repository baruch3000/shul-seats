"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { WorshipperNav } from "@/components/WorshipperNav";

export function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");
  const showWorshipperNav = !!session && !isAdminRoute;

  return (
    <header className="sticky top-0 z-50 border-b border-[#e8ddd0] bg-[#faf7f2]/95 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl space-y-3 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="shrink-0 text-xl font-bold text-[#7b1e3a]">
            Shul Seats
          </Link>
          <div className="flex items-center gap-3">
            {session ? (
              <>
                <span className="hidden text-sm text-[#8d6e63] sm:inline">
                  {session.user.displayName || session.user.name}
                </span>
                <button
                  onClick={() => signOut()}
                  className="rounded-lg bg-[#5d4037] px-3 py-1.5 text-sm text-white hover:bg-[#4e342e]"
                >
                  יציאה
                </button>
              </>
            ) : (
              <button
                onClick={() => signIn("google")}
                className="rounded-lg bg-[#7b1e3a] px-4 py-2 text-sm font-medium text-white hover:bg-[#5c1529]"
              >
                כניסה עם Google
              </button>
            )}
            {!isAdminRoute && (
              <Link
                href="/admin/login"
                className="text-xs text-[#8d6e63] hover:underline"
              >
                גבאי
              </Link>
            )}
          </div>
        </div>

        {showWorshipperNav && <WorshipperNav />}
      </div>
    </header>
  );
}
