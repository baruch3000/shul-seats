"use client";

import type { AdminSeat, PublicSeat, PublicSeatStatus } from "@/lib/types";
import { SEAT_H, SEAT_W } from "@/data/layout";

const statusStyles: Record<
  PublicSeatStatus | "reserved",
  { fill: string; stroke: string; text: string }
> = {
  available: { fill: "#C4A882", stroke: "#8B6914", text: "#3D2E10" },
  reserved: { fill: "#F2D4D4", stroke: "#C47070", text: "#8B3030" },
  yours: { fill: "#D4E4F7", stroke: "#5B8FC7", text: "#2A5080" },
  blocked: { fill: "#E8E4E0", stroke: "#B0A8A0", text: "#888080" },
};

interface SeatProps {
  seat: PublicSeat | AdminSeat;
  selected?: boolean;
  onClick?: (seat: PublicSeat | AdminSeat) => void;
  onContextMenu?: (seat: PublicSeat | AdminSeat, e: React.MouseEvent) => void;
  showName?: boolean;
  disabled?: boolean;
}

export function Seat({
  seat,
  selected,
  onClick,
  onContextMenu,
  showName,
  disabled,
}: SeatProps) {
  const adminSeat = seat as AdminSeat;
  const style = statusStyles[seat.status] ?? statusStyles.available;
  const isClickable =
    !disabled &&
    (showName || seat.status === "available" || seat.status === "yours");

  return (
    <g
      transform={`translate(${seat.x}, ${seat.y})`}
      className={`seat-btn${selected ? " selected" : ""}`}
      style={{ cursor: isClickable ? "pointer" : "default" }}
      onClick={() => isClickable && onClick?.(seat)}
      onContextMenu={(e) => {
        if (showName && onContextMenu) {
          e.preventDefault();
          onContextMenu(seat, e);
        }
      }}
    >
      <rect
        className="seat-shape"
        width={SEAT_W}
        height={SEAT_H}
        rx={5}
        fill={selected ? "#E8C547" : style.fill}
        stroke={selected ? "#B8860B" : style.stroke}
        strokeWidth={selected ? 3 : 1.5}
        opacity={seat.status === "blocked" ? 0.55 : 1}
      />
      <text
        x={SEAT_W / 2}
        y={showName && adminSeat.reservedName && seat.status === "reserved" ? 14 : SEAT_H / 2 + 5}
        textAnchor="middle"
        fill={style.text}
        fontSize={showName && adminSeat.reservedName ? 9 : 11}
        fontWeight="600"
        pointerEvents="none"
      >
        {seat.seatNumber}
      </text>
      {showName && adminSeat.reservedName && seat.status === "reserved" && (
        <>
          <text
            x={SEAT_W / 2}
            y={26}
            textAnchor="middle"
            fill={style.text}
            fontSize={7}
            fontWeight="500"
            pointerEvents="none"
          >
            {adminSeat.reservedName.length > 8
              ? `${adminSeat.reservedName.slice(0, 7)}…`
              : adminSeat.reservedName}
          </text>
          <title>{adminSeat.reservedName}</title>
        </>
      )}
      {!showName && (
        <title>
          {seat.section === "men" ? "גברים" : "נשים"} — מקום {seat.seatNumber} —{" "}
          {seat.status === "available"
            ? "פנוי"
            : seat.status === "yours"
              ? "שלך"
              : seat.status === "blocked"
                ? "חסום"
                : "תפוס"}
        </title>
      )}
    </g>
  );
}
