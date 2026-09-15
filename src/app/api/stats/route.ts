import { NextResponse } from "next/server";
import { getLayoutStatsFallback } from "@/lib/layout-fallback";
import { getStats } from "@/lib/seats";

export async function GET() {
  try {
    const stats = await getStats();
    return NextResponse.json(stats);
  } catch {
    return NextResponse.json(getLayoutStatsFallback());
  }
}
