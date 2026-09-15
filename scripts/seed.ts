import bcrypt from "bcryptjs";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { allBenches, blockedSeatNumbers, pillars } from "../src/data/layout";

const forceReseed = process.argv.includes("--force");

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key);

const ADMIN_EMAILS = [
  { email: "5379833@gmail.com", name: "מנהל ראשי" },
  { email: "moti96043@gmail.com", name: "מוטי" },
];

async function runMigration() {
  console.log("Note: Run supabase/migrations/001_init.sql in Supabase SQL Editor first if tables don't exist.");
}

async function seedAdmins() {
  const password = process.env.ADMIN_INITIAL_PASSWORD || "ShulSeats2026!";
  const hash = await bcrypt.hash(password, 12);

  for (const admin of ADMIN_EMAILS) {
    const { error } = await supabase.from("admins").upsert(
      {
        email: admin.email,
        password_hash: hash,
        name: admin.name,
        active: true,
      },
      { onConflict: "email" }
    );
    if (error) console.error(`Admin seed error for ${admin.email}:`, error.message);
    else console.log(`Admin seeded: ${admin.email}`);
  }
  console.log(`Default admin password: ${password}`);
}

async function seedSeats() {
  const { count } = await supabase.from("seats").select("*", { count: "exact", head: true });
  if (count && count > 0 && !forceReseed) {
    console.log(`Seats already exist (${count}), skipping. Use: npm run seed -- --force`);
    return;
  }

  if (forceReseed && count && count > 0) {
    console.log("Force reseed: clearing reservations, seats, benches, pillars...");
    await supabase.from("reservations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("seats").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("benches").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("pillars").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  }

  for (const bench of allBenches) {
    const { data: benchRow, error: benchError } = await supabase
      .from("benches")
      .insert({ section_id: bench.section, row_number: bench.row })
      .select("id")
      .single();

    if (benchError || !benchRow) {
      console.error("Bench insert error:", benchError?.message);
      continue;
    }

    const blocked = blockedSeatNumbers[bench.section] ?? [];
    const seatRows = bench.seats.map((s) => ({
      section_id: bench.section,
      bench_id: benchRow.id,
      seat_number: s.number,
      pos_x: s.x,
      pos_y: s.y,
      status: blocked.includes(s.number) ? "blocked" : "available",
    }));

    const { error: seatsError } = await supabase.from("seats").insert(seatRows);
    if (seatsError) console.error("Seats insert error:", seatsError.message);
  }

  console.log("Seats seeded.");
}

/** Sync DB blocked flags with layout.ts (fixes stale blocks e.g. men seat 4) */
async function syncBlockedFromLayout() {
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
        if (!error) updated++;
      }
    }
  }
  if (updated) console.log(`Synced blocked status for ${updated} seats.`);
}

async function seedPillars() {
  const { count } = await supabase.from("pillars").select("*", { count: "exact", head: true });
  if (count && count > 0 && !forceReseed) {
    console.log("Pillars already exist, skipping.");
    return;
  }

  const rows = pillars.map((p) => ({
    section_id: p.section,
    cx: p.cx,
    cy: p.cy,
    radius: p.r,
  }));

  const { error } = await supabase.from("pillars").insert(rows);
  if (error) console.error("Pillars error:", error.message);
  else console.log("Pillars seeded.");
}

async function testConnection() {
  const { error } = await supabase.from("sections").select("id").limit(1);
  if (error) {
    console.error("\n❌ Cannot connect to Supabase or tables missing.");
    console.error("   Error:", error.message);
    console.error("\n   Steps:");
    console.error("   1. Verify NEXT_PUBLIC_SUPABASE_URL in .env.local");
    console.error("   2. Run supabase/migrations/001_init.sql in Supabase SQL Editor");
    console.error("   3. Run npm run seed again\n");
    process.exit(1);
  }
}

async function main() {
  const layoutErrors = (await import("../src/data/layout")).validateLayout();
  if (layoutErrors.length) {
    console.warn("Layout warnings:", layoutErrors.join("; "));
  }

  await runMigration();
  await testConnection();
  await seedAdmins();
  await seedSeats();
  await syncBlockedFromLayout();
  await seedPillars();
  console.log("✅ Seed complete!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
