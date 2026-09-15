/**
 * Run this AFTER pasting supabase/migrations/001_init.sql in Supabase SQL Editor.
 * This script verifies connectivity and runs seed.
 */
import { execSync } from "child_process";

console.log("⚠️  Run supabase/migrations/001_init.sql in Supabase SQL Editor first!");
console.log("Then run: npm run seed\n");

try {
  execSync("npm run seed", { stdio: "inherit", cwd: process.cwd() });
} catch {
  console.error("\nSeed failed — make sure SQL migration was run first.");
  process.exit(1);
}
