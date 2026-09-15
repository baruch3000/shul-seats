"use client";

import { useState } from "react";
import { SeatMap } from "@/components/SeatMap";
import type { AdminSeat, SectionSlug } from "@/lib/types";

interface AdminSeatMapProps {
  section?: SectionSlug | "all";
}

export function AdminSeatMap({ section = "all" }: AdminSeatMapProps) {
  const [menuSeat, setMenuSeat] = useState<AdminSeat | null>(null);
  const [assignName, setAssignName] = useState("");
  const [message, setMessage] = useState("");
  const [refreshToken, setRefreshToken] = useState(0);

  const doAction = async (action: string, name?: string) => {
    if (!menuSeat) return;

    const res = await fetch("/api/admin/seat", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        seatId: menuSeat.id,
        action,
        reservedName: name,
      }),
    });

    if (res.ok) {
      setMessage(`✅ פעולה בוצעה על מקום ${menuSeat.seatNumber}`);
      setMenuSeat(null);
      setAssignName("");
      setRefreshToken((n) => n + 1);
    } else {
      const data = await res.json();
      setMessage(`❌ ${data.error}`);
    }
  };

  return (
    <div>
      <SeatMap
        section={section}
        isAdmin
        refreshToken={refreshToken}
        onAdminAction={(seat) => setMenuSeat(seat as AdminSeat)}
      />

      {menuSeat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold text-[#7b1e3a]">
              מקום {menuSeat.seatNumber}
              {menuSeat.reservedName && (
                <span className="block text-sm font-normal text-[#5d4037]">
                  {menuSeat.reservedName}
                </span>
              )}
            </h3>

            <div className="space-y-2">
              {menuSeat.status === "reserved" && (
                <button
                  onClick={() => doAction("release")}
                  className="w-full rounded-lg bg-red-100 py-2 text-red-700"
                >
                  שחרר מקום
                </button>
              )}
              {menuSeat.status === "blocked" ? (
                <button
                  onClick={() => doAction("unblock")}
                  className="w-full rounded-lg bg-green-100 py-2 text-green-700"
                >
                  בטל חסימה
                </button>
              ) : (
                <button
                  onClick={() => doAction("block")}
                  className="w-full rounded-lg bg-gray-100 py-2 text-gray-700"
                >
                  חסום מקום
                </button>
              )}

              <div className="pt-2">
                <input
                  type="text"
                  value={assignName}
                  onChange={(e) => setAssignName(e.target.value)}
                  placeholder="שם להקצאה"
                  className="mb-2 w-full rounded-lg border px-3 py-2"
                />
                <button
                  onClick={() => doAction("assign", assignName)}
                  disabled={!assignName.trim()}
                  className="w-full rounded-lg bg-[#7b1e3a] py-2 text-white disabled:opacity-50"
                >
                  הקצה ל...
                </button>
              </div>

              <button
                onClick={() => setMenuSeat(null)}
                className="w-full py-2 text-[#8d6e63]"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className="mt-4 rounded-lg bg-white p-3 text-center shadow">{message}</div>
      )}

      <p className="mt-2 text-sm text-[#A08070]">
        לחצו על כל מקום — כולל תפוסים — לשחרור, הקצאה, חסימה
      </p>
    </div>
  );
}
