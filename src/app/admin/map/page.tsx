import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminSeatMap } from "@/components/admin/AdminSeatMap";
import { getAdminSession } from "@/lib/admin-auth";

export default async function AdminUnifiedMapPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <Link href="/admin" className="text-sm text-[#A08070] hover:underline">
          ← חזרה ללוח בקרה
        </Link>
        <h1 className="text-2xl font-bold text-[#8B4557]">מפת שליטה — כל בית הכנסת</h1>
      </div>
      <AdminSeatMap />
    </div>
  );
}
