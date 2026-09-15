"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "דף הבית", match: (path: string) => path === "/" },
  {
    href: "/map",
    label: "מפת בית המדרש",
    match: (path: string) => path === "/map" || path.startsWith("/map/"),
  },
  {
    href: "/my-seats",
    label: "המקומות שלי",
    match: (path: string) => path === "/my-seats",
  },
] as const;

export function WorshipperNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex flex-wrap items-center gap-1 rounded-xl bg-[#f5efe6] p-1"
      aria-label="תפריט מתפללים"
    >
      {links.map((link) => {
        const active = link.match(pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              active
                ? "bg-[#7b1e3a] text-white shadow-sm"
                : "text-[#5d4037] hover:bg-white/80"
            }`}
            aria-current={active ? "page" : undefined}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
