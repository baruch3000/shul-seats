/**
 * Sync seat blocked status in Supabase with layout.ts (no data wipe).
 * Run: npm run sync:blocked
 */
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { allBenches, blockedSeatNumbers } from "../src/data/layout";

const envPath = resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const k = trimmed.slice(0, eq);
    const v = trimmed.slice(eq + 1);
    if (!process.env[k]) process.env[k] = v;
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing Supabase env vars in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  let updated = 0;
  for (const bench of allBenches) {
    for (const s of bench.seats) {
      const shouldBlock = (blockedSeatNumbers[bench.section] ?? []).includes(
        s.number
      );
      const { data } = await supabase
        .from("seats")
        .select("id, status")
        .eq("section_id", bench.section)
        .eq("seat_number", s.number)
        .maybeSingle();
      if (!data) continue;
      const nextStatus = shouldBlock ? "blocked" : "available";
      if (data.status !== nextStatus) {
        const { error } = await supabase
          .from("seats")
          .update({ status: nextStatus })
          .eq("id", data.id);
        if (error) console.error(bench.section, s.number, error.message);
        else updated++;
      }
    }
  }
  console.log(updated ? `✅ Updated ${updated} seats.` : "✅ Already in sync.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
