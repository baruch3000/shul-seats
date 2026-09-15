"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { sectionMeta } from "@/data/layout";

interface MyReservation {
  id: string;
  seatId: string;
  section: string;
  seatNumber: number;
  reservedName: string;
}

export default function MySeatsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [reservations, setReservations] = useState<MyReservation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSeats = useCallback(async () => {
    const res = await fetch("/api/my-seats");
    const data = await res.json();
    setReservations(data.reservations ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
    if (status === "authenticated") fetchSeats();
  }, [status, router, fetchSeats]);

  const releaseSeat = async (seatId: string) => {
    await fetch("/api/reserve", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seatIds: [seatId] }),
    });
    fetchSeats();
  };

  const releaseAll = async () => {
    if (!confirm("לשחרר את כל המקומות?")) return;
    await fetch("/api/reserve", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seatIds: reservations.map((r) => r.seatId) }),
    });
    fetchSeats();
  };

  const shareWhatsApp = () => {
    const text = reservations
      .map(
        (r) =>
          `${sectionMeta[r.section as keyof typeof sectionMeta]?.displayName ?? r.section} — מקום ${r.seatNumber}`
      )
      .join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent("המקומות שלי:\n" + text)}`, "_blank");
  };

  if (loading) return <div className="py-12 text-center">טוען...</div>;

  return (
    <div className="animate-fade-in space-y-6">
      <h1 className="text-2xl font-bold text-[#7b1e3a]">המקומות שלי</h1>

      {reservations.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center shadow">
          <p className="text-[#5d4037]">עדיין לא בחרת מקומות</p>
          <Link
            href="/map"
            className="mt-4 inline-block rounded-lg bg-[#8B4557] px-6 py-2 text-white"
          >
            בחר מקום
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {reservations.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-xl bg-white p-4 shadow"
              >
                <div>
                  <span className="font-bold text-[#7b1e3a]">
                    {sectionMeta[r.section as keyof typeof sectionMeta]?.displayName}
                  </span>
                  <span className="mx-2">—</span>
                  <span>מקום {r.seatNumber}</span>
                </div>
                <div className="flex gap-2">
                  <Link
                    href="/map"
                    className="rounded-lg border px-3 py-1 text-sm text-[#5d4037]"
                  >
                    שנה מקום
                  </Link>
                  <button
                    onClick={() => releaseSeat(r.seatId)}
                    className="rounded-lg bg-red-100 px-3 py-1 text-sm text-red-700"
                  >
                    שחרר
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={shareWhatsApp}
              className="rounded-lg bg-[#25D366] px-4 py-2 text-white"
            >
              שתף ב-WhatsApp
            </button>
            <button
              onClick={releaseAll}
              className="rounded-lg border border-red-300 px-4 py-2 text-red-700"
            >
              שחרר הכל
            </button>
          </div>
        </>
      )}
    </div>
  );
}
