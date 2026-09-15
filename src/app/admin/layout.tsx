import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

export async function checkAdmin() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}
