export function SeatLegend({ isAdmin = false }: { isAdmin?: boolean }) {
  const items = [
    { color: "bg-[#C4A882] border-2 border-[#8B6914]", label: "פנוי" },
    { color: "bg-[#F2D4D4] border-2 border-[#C47070]", label: isAdmin ? "תפוס (עם שם)" : "תפוס" },
    { color: "bg-[#D4E4F7] border-2 border-[#5B8FC7]", label: "שלך" },
    { color: "bg-[#E8E4E0] border-2 border-[#B0A8A0]", label: "חסום" },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-4 text-sm text-[#5D4037]">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <span className={`inline-block h-5 w-5 ${item.color}`} />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
