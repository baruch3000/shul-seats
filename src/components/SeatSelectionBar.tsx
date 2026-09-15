interface SeatSelectionBarProps {
  count: number;
  confirming: boolean;
  replaceMode?: boolean;
  synced?: boolean;
  onConfirm: () => void;
  onClear: () => void;
}

export function SeatSelectionBar({
  count,
  confirming,
  replaceMode = false,
  synced = true,
  onConfirm,
  onClear,
}: SeatSelectionBarProps) {
  if (count === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#E8D5C4] bg-white/95 p-4 shadow-lg backdrop-blur-sm">
      <div className="mx-auto flex max-w-lg flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="font-medium text-[#8B4557]">
            {count} מקומות נבחרו
          </span>
          {replaceMode && (
            <p className="text-xs text-[#A08070]">המקומות הקודמים שלך ישוחררו</p>
          )}
          {!synced && (
            <p className="text-xs text-amber-700">ממתין לחיבור לשרת — השמירה תהיה זמינה בקרוב</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onClear}
            className="rounded-lg border border-[#C4956A] px-4 py-2 text-sm text-[#5D4037]"
          >
            ביטול
          </button>
          <button
            onClick={onConfirm}
            disabled={confirming}
            className="rounded-lg bg-[#8B4557] px-6 py-2 text-sm font-medium text-white hover:bg-[#6D3444] disabled:opacity-50"
          >
            {confirming ? "שומר..." : replaceMode ? "החלף מקומות" : "אשר הכל"}
          </button>
        </div>
      </div>
    </div>
  );
}
