"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Seat } from "@/components/Seat";
import { SeatLegend } from "@/components/SeatLegend";
import { SeatSelectionBar } from "@/components/SeatSelectionBar";
import {
  blockedAreas,
  FULL_MAP_HEIGHT,
  landmarks,
  MAP_WIDTH,
  mechitzaLayout,
  menSectionLabelX,
  sectionMeta,
  womenSectionLabelX,
  womenSectionLabelY,
} from "@/data/layout";
import { getLayoutFallbackSeats } from "@/lib/layout-seats";
import { createBrowserClient } from "@/lib/supabase/client";
import type { AdminSeat, PublicSeat, SectionSlug } from "@/lib/types";

interface SeatMapProps {
  section?: SectionSlug | "all";
  isAdmin?: boolean;
  onAdminAction?: (seat: AdminSeat, action: string) => void;
  refreshToken?: number;
}

export function SeatMap({
  section = "all",
  isAdmin = false,
  onAdminAction,
  refreshToken = 0,
}: SeatMapProps) {
  const [seats, setSeats] = useState<(PublicSeat | AdminSeat)[]>(() =>
    getLayoutFallbackSeats(section)
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [synced, setSynced] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchingRef = useRef(false);

  const fetchSeats = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    const sectionParam = section === "all" ? "all" : section;
    const url = isAdmin
      ? `/api/admin/seats?section=${sectionParam}`
      : `/api/seats?section=${sectionParam}`;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.seats?.length) {
            setSelected((prev) => {
              if (prev.size === 0) return prev;
              const next = new Set<string>();
              for (const seat of data.seats as PublicSeat[]) {
                const layoutId = `layout-${seat.section}-${seat.seatNumber}`;
                if (prev.has(seat.id) || prev.has(layoutId)) next.add(seat.id);
              }
              return next;
            });
            setSeats(data.seats);
            setSynced(data.synced !== false);
            setSyncError(data.synced === false);
          } else {
            setSyncError(true);
          }
          fetchingRef.current = false;
          return;
        }
      } catch {
        // retry
      }
      if (attempt < 2) await new Promise((r) => setTimeout(r, 1000));
    }

    setSyncError(true);
    fetchingRef.current = false;
  }, [section, isAdmin]);

  const scheduleRefetch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void fetchSeats();
    }, 800);
  }, [fetchSeats]);

  useEffect(() => {
    void fetchSeats();
  }, [fetchSeats, refreshToken]);

  useEffect(() => {
    try {
      const supabase = createBrowserClient();
      const channelName = `seat-changes-${section}-${isAdmin ? "admin" : "public"}`;

      const channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "reservations" },
          () => scheduleRefetch()
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "seats" },
          () => scheduleRefetch()
        )
        .subscribe();

      return () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        void supabase.removeChannel(channel);
      };
    } catch {
      return undefined;
    }
  }, [section, isAdmin, scheduleRefetch]);

  const yoursCount = seats.filter((s) => s.status === "yours").length;

  const releaseSeat = async (seat: PublicSeat | AdminSeat) => {
    if (!confirm(`לשחרר מקום ${seat.seatNumber}?`)) return;
    setMessage("");
    try {
      const res = await fetch("/api/reserve", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seatIds: [seat.id] }),
      });
      if (res.ok) {
        setMessage(`✅ מקום ${seat.seatNumber} שוחרר`);
        await fetchSeats();
      } else {
        const data = await res.json();
        setMessage(`❌ ${data.error}`);
      }
    } catch {
      setMessage("❌ שגיאת רשת");
    }
  };

  const toggleSelect = (seat: PublicSeat | AdminSeat) => {
    if (isAdmin) return;

    if (seat.status === "yours") {
      void releaseSeat(seat);
      return;
    }

    if (seat.status !== "available") return;

    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(seat.id)) next.delete(seat.id);
      else next.add(seat.id);
      return next;
    });
  };

  const handleConfirm = async () => {
    if (selected.size === 0) return;
    setConfirming(true);
    setMessage("");
    const savedIds = Array.from(selected);

    try {
      const res = await fetch("/api/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seatIds: savedIds,
          replaceExisting: yoursCount > 0,
        }),
      });

      const data = await res.json();
      if (res.ok && data.reserved > 0) {
        setMessage(`✅ ${data.reserved} מקומות נשמרו בהצלחה!`);
        setSelected(new Set());
        setSeats((prev) =>
          prev.map((seat) =>
            savedIds.includes(seat.id)
              ? { ...seat, status: "yours" as const }
              : seat
          )
        );
        await fetchSeats();
      } else {
        setMessage(`❌ ${data.error ?? "לא ניתן לשמור את המקומות"}`);
      }
    } catch {
      setMessage("❌ שגיאת רשת — נסה שוב");
    }
    setConfirming(false);
  };

  return (
    <div className="space-y-4">
      <SeatLegend isAdmin={isAdmin} />

      {syncError && (
        <div className="flex items-center justify-between rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span>אין חיבור ל-Supabase — שמירה מקומית בלבד (לא משותפת בין מחשבים)</span>
          <button
            onClick={() => void fetchSeats()}
            className="rounded-lg bg-amber-200 px-3 py-1 font-medium hover:bg-amber-300"
          >
            רענן
          </button>
        </div>
      )}

      {!synced && !syncError && (
        <div className="rounded-xl bg-blue-50 px-4 py-2 text-center text-sm text-blue-800">
          טוען סטטוס מקומות...
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-[#E8D5C4] bg-[#FAF6F0] shadow-inner">
        <div className="overflow-auto" style={{ height: "min(85vh, 900px)" }}>
          <svg
            viewBox={`0 0 ${MAP_WIDTH} ${FULL_MAP_HEIGHT}`}
            width="100%"
            height={FULL_MAP_HEIGHT}
            preserveAspectRatio="xMidYMin meet"
            className="bg-[#FAF6F0]"
            style={{ display: "block", minWidth: 800 }}
          >
            {/* Background layers — must not intercept seat clicks */}
            <g pointerEvents="none">
              <rect x={0} y={0} width={MAP_WIDTH} height={mechitzaLayout.splitY} fill="#FFF9F3" />
              <rect
                x={0}
                y={mechitzaLayout.splitY}
                width={mechitzaLayout.dividerX}
                height={FULL_MAP_HEIGHT - mechitzaLayout.splitY}
                fill="#F5EDE4"
              />
              <rect
                x={mechitzaLayout.dividerX}
                y={mechitzaLayout.splitY}
                width={MAP_WIDTH - mechitzaLayout.dividerX}
                height={FULL_MAP_HEIGHT - mechitzaLayout.splitY}
                fill="#FFF9F3"
              />
              <rect x={0} y={160} width={mechitzaLayout.dividerX} height={260} fill="#F5EDE4" opacity={0.55} />
              <path
                d={`M ${mechitzaLayout.topVerticalX} 0 L ${mechitzaLayout.topVerticalX} ${mechitzaLayout.splitY} L ${mechitzaLayout.dividerX} ${mechitzaLayout.splitY} L ${mechitzaLayout.dividerX} ${FULL_MAP_HEIGHT}`}
                fill="none"
                stroke="#9A9590"
                strokeWidth={mechitzaLayout.strokeWidth}
                strokeLinecap="square"
                strokeLinejoin="miter"
              />
              {landmarks.map((lm, i) => {
                if (!lm.label) return null;
                const w = lm.width ?? 60;
                const h = lm.height ?? 40;
                return (
                  <g key={i}>
                    <rect
                      x={(lm.x ?? 0) - w / 2}
                      y={lm.y ?? 0}
                      width={w}
                      height={h}
                      rx={6}
                      fill="#D4A59A"
                      stroke="#B8897E"
                      strokeWidth={1.5}
                    />
                    <text
                      x={lm.x ?? 0}
                      y={(lm.y ?? 0) + h / 2 + 5}
                      textAnchor="middle"
                      fill="#4A2C2A"
                      fontSize={12}
                      fontWeight="600"
                    >
                      {lm.label}
                    </text>
                  </g>
                );
              })}
            </g>

            {blockedAreas.map((zone, i) => (
              <g key={`blocked-${i}`} pointerEvents="none">
                <rect
                  x={zone.x}
                  y={zone.y}
                  width={zone.width}
                  height={zone.height}
                  fill="#E8E6E2"
                  fillOpacity={0.92}
                  stroke="#C5C0B8"
                  strokeWidth={1.5}
                />
                <line
                  x1={zone.x + 6}
                  y1={zone.y + 6}
                  x2={zone.x + zone.width - 6}
                  y2={zone.y + zone.height - 6}
                  stroke="#9A9590"
                  strokeWidth={zone.width > 60 ? 4 : 2.5}
                />
                <line
                  x1={zone.x + zone.width - 6}
                  y1={zone.y + 6}
                  x2={zone.x + 6}
                  y2={zone.y + zone.height - 6}
                  stroke="#9A9590"
                  strokeWidth={zone.width > 60 ? 4 : 2.5}
                />
              </g>
            ))}

            <text
              x={menSectionLabelX}
              y={50}
              textAnchor="middle"
              fill="#8B4557"
              fontSize={22}
              fontWeight="bold"
              pointerEvents="none"
            >
              {sectionMeta.men.displayName}
            </text>
            <text
              x={womenSectionLabelX}
              y={womenSectionLabelY}
              textAnchor="middle"
              fill="#8B4557"
              fontSize={20}
              fontWeight="bold"
              pointerEvents="none"
            >
              {sectionMeta.women.displayName}
            </text>

            {seats.map((seat) => (
              <Seat
                key={`${seat.section}-${seat.seatNumber}`}
                seat={seat}
                selected={selected.has(seat.id)}
                onClick={(s) => {
                  if (isAdmin && onAdminAction) {
                    onAdminAction(s as AdminSeat, "menu");
                  } else {
                    toggleSelect(s);
                  }
                }}
                showName={isAdmin}
                disabled={false}
              />
            ))}
          </svg>
        </div>
      </div>

      {!isAdmin && yoursCount > 0 && (
        <div className="rounded-xl bg-[#D4E4F7] px-4 py-3 text-center text-sm text-[#2A5080]">
          יש לך {yoursCount} מקומות — לחץ על מקום כחול לשחרור, או בחר חדשים ולחץ &quot;החלף מקומות&quot;
        </div>
      )}

      <p className="text-center text-sm text-[#A08070]">
        גללו מלמעלה למטה • {seats.length} מקומות על המפה
      </p>

      {message && (
        <div className="animate-fade-in rounded-xl bg-white p-3 text-center shadow">{message}</div>
      )}

      {!isAdmin && (
        <SeatSelectionBar
          count={selected.size}
          confirming={confirming}
          replaceMode={yoursCount > 0}
          synced={synced}
          onConfirm={handleConfirm}
          onClear={() => setSelected(new Set())}
        />
      )}
    </div>
  );
}
