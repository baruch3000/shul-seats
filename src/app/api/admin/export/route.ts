import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";
import { sectionMeta } from "@/data/layout";

export async function GET() {
  try {
    await requireAdmin();
    const supabase = createServiceClient();

    const { data: seats } = await supabase
      .from("seats")
      .select(
        `
        section_id,
        seat_number,
        status,
        reservations ( reserved_name, users ( email ), reserved_at )
      `
      )
      .order("section_id")
      .order("seat_number");

    const header = "עזרה,מספר מקום,סטטוס,שם,אימייל,תאריך\n";
    const rows = (seats ?? [])
      .map((s) => {
        const section = sectionMeta[s.section_id as keyof typeof sectionMeta]?.displayName ?? s.section_id;
        const reservation = (s.reservations as unknown as {
          reserved_name: string;
          reserved_at: string;
          users: { email: string } | null;
        }[])?.[0];

        let status = "פנוי";
        if (s.status === "blocked") status = "חסום";
        else if (reservation) status = "תפוס";

        return [
          section,
          s.seat_number,
          status,
          reservation?.reserved_name ?? "",
          reservation?.users?.email ?? "",
          reservation?.reserved_at ?? "",
        ].join(",");
      })
      .join("\n");

    return new NextResponse("\uFEFF" + header + rows, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="shul-seats.csv"',
      },
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
