/**
 * Smoke tests — run while dev server is up: npm run dev + npm run test:smoke
 */
const base = process.env.BASE_URL ?? "http://localhost:3000";

async function get(path: string) {
  const res = await fetch(`${base}${path}`);
  return { status: res.status, body: await res.json().catch(() => null) };
}

async function main() {
  console.log(`Smoke tests → ${base}\n`);
  let failed = 0;

  const health = await get("/api/health");
  const healthOk = health.status === 200 && health.body?.ok === true;
  console.log(`${healthOk ? "✓" : "✗"} /api/health`);
  if (!healthOk) failed++;

  const stats = await get("/api/stats");
  const statsOk =
    stats.status === 200 &&
    typeof stats.body?.total?.total === "number" &&
    stats.body.total.total > 0;
  console.log(
    `${statsOk ? "✓" : "✗"} /api/stats (${stats.body?.total?.total ?? "?"} seats)`
  );
  if (!statsOk) failed++;

  const seats = await get("/api/seats?section=all");
  const seatsOk =
    seats.status === 200 &&
    Array.isArray(seats.body?.seats) &&
    seats.body.seats.length > 0 &&
    seats.body.synced !== false;
  console.log(
    `${seatsOk ? "✓" : "✗"} /api/seats (${seats.body?.seats?.length ?? 0} on map, storage: ${seats.body?.storage ?? "?"})`
  );
  if (!seatsOk) failed++;

  const home = await fetch(`${base}/`);
  console.log(`${home.ok ? "✓" : "✗"} / (homepage)`);
  if (!home.ok) failed++;

  const map = await fetch(`${base}/map`);
  console.log(`${map.ok ? "✓" : "✗"} /map`);
  if (!map.ok) failed++;

  console.log(
    failed
      ? `\n${failed} test(s) failed.`
      : "\nAll smoke tests passed.\nManual: Google login → save seat → check /admin map."
  );
  process.exit(failed ? 1 : 0);
}

void main();
