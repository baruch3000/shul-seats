import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import { Header } from "@/components/Header";
import { Providers } from "@/components/Providers";
import "./globals.css";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
});

export const metadata: Metadata = {
  title: "Shul Seats — בחירת מקומות",
  description: "מערכת בחירת מקומות לבית כנסת",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#7b1e3a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} h-full`}>
      <body className="min-h-full bg-[#faf7f2] antialiased">
        <Providers>
          <Header />
          <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
