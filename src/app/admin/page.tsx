import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminSeatMap } from "@/components/admin/AdminSeatMap";
import { AdminControls } from "@/components/admin/AdminControls";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { getAdminSession } from "@/lib/admin-auth";
import { listReservations } from "@/lib/reservation-store";
import { getStats } from "@/lib/seats";
import { createServiceClient } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const stats = await getStats();

  let recentReservations: {
    reserved_name: string;
    seats: { section_id: string; seat_number: number };
  }[] = [];
  let logs: { id: string; action: string; admin_email: string }[] = [];
  let dbOffline = false;

  try {
    const supabase = createServiceClient();
    const [resResult, logsResult] = await Promise.all([
      supabase
        .from("reservations")
        .select("reserved_name, reserved_at, seats(section_id, seat_number)")
        .order("reserved_at", { ascending: false })
        .limit(10),
      supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);
    if (resResult.error || logsResult.error) dbOffline = true;
    recentReservations = (resResult.data ?? []) as unknown as typeof recentReservations;
    logs = (logsResult.data ?? []) as typeof logs;
  } catch {
    dbOffline = true;
  }

  if (!recentReservations.length) {
    const local = await listReservations();
    recentReservations = local.slice(0, 10).map((r) => ({
      reserved_name: r.reservedName,
      seats: { section_id: r.section, seat_number: r.seatNumber },
    }));
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#7b1e3a]">לוח בקרה — גבאי</h1>
          <p className="text-[#8d6e63]">שלום, {session.name}</p>
        </div>
        <AdminLogoutButton />
      </div>

      {dbOffline && (
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          אין חיבור ל-Supabase — הסטטיסטיקות מהמפה המקומית. הריצו{" "}
          <code className="rounded bg-amber-100 px-1">npm run seed</code> כשהפרויקט
          פעיל.
        </div>
      )}

      <AdminControls />

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-[#7b1e3a]">מפת שליטה — תפוס / פנוי</h2>
        <p className="text-sm text-[#8d6e63]">
          וורוד = תפוס (עם שם) · חום = פנוי · לחץ על מקום לשחרור / הקצאה
        </p>
        <AdminSeatMap />
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "סה\"כ", value: stats.total.total, color: "bg-[#5d4037]" },
          { label: "פנויים", value: stats.total.available, color: "bg-[#2e7d32]" },
          { label: "תפוסים", value: stats.total.reserved, color: "bg-[#c62828]" },
          { label: "חסומים", value: stats.total.blocked, color: "bg-[#9e9e9e]" },
        ].map((card) => (
          <div key={card.label} className={`rounded-xl ${card.color} p-4 text-white`}>
            <div className="text-3xl font-bold">{card.value}</div>
            <div className="text-sm opacity-80">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-white p-4 shadow">
          <h3 className="mb-2 font-bold">עזרת גברים</h3>
          <p>
            {stats.men.available} פנויים / {stats.men.reserved} תפוסים /{" "}
            {stats.men.total} סה&quot;כ
          </p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow">
          <h3 className="mb-2 font-bold">עזרת נשים</h3>
          <p>
            {stats.women.available} פנויים / {stats.women.reserved} תפוסים /{" "}
            {stats.women.total} סה&quot;כ
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <a href="/api/admin/export" className="rounded-lg bg-[#5d4037] px-4 py-2 text-white">
          ייצוא CSV
        </a>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-4 shadow">
          <h3 className="mb-3 font-bold text-[#7b1e3a]">הזמנות אחרונות</h3>
          <div className="space-y-2 text-sm">
            {recentReservations.map((r, i) => {
              const seat = r.seats;
              return (
                <div key={i} className="flex justify-between border-b pb-1">
                  <span>{r.reserved_name}</span>
                  <span className="text-[#8d6e63]">
                    {seat.section_id === "men" ? "גברים" : "נשים"} {seat.seat_number}
                  </span>
                </div>
              );
            })}
            {!recentReservations.length && (
              <p className="text-[#8d6e63]">אין הזמנות עדיין</p>
            )}
          </div>
        </div>

        <div className="rounded-xl bg-white p-4 shadow">
          <h3 className="mb-3 font-bold text-[#7b1e3a]">יומן פעילות</h3>
          <div className="space-y-2 text-sm">
            {logs.map((log) => (
              <div key={log.id} className="border-b pb-1">
                <span className="font-medium">{log.action}</span>
                <span className="mx-2 text-[#8d6e63]">{log.admin_email}</span>
              </div>
            ))}
            {!logs.length && <p className="text-[#8d6e63]">אין פעילות</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
