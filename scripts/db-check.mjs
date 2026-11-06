// Tries several Supabase connection variants with Prisma and reports which work.
// Run: node scripts/db-check.mjs   (prints no passwords)
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const env = {};
for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z_]+)\s*=\s*"?(.*?)"?\s*$/);
  if (m) env[m[1]] = m[2];
}
const base = new URL(env.DATABASE_URL);
const make = (port, params) => {
  const u = new URL(base.toString());
  u.port = String(port);
  u.search = new URLSearchParams(params).toString();
  return u.toString();
};
const variants = [
  ["Current DATABASE_URL (6543, 10s timeout)", env.DATABASE_URL],
  ["Transaction pooler 6543, 30s timeout", make(6543, { pgbouncer: "true", connection_limit: "1", connect_timeout: "30", sslmode: "require" })],
  ["Session pooler 5432, 30s timeout", make(5432, { connect_timeout: "30", sslmode: "require" })],
  ["DIRECT_URL (db.<ref>.supabase.co:5432)", env.DIRECT_URL],
];

for (const [name, url] of variants) {
  if (!url) continue;
  const db = new PrismaClient({ datasources: { db: { url } }, log: [] });
  const t = Date.now();
  try {
    await Promise.race([
      db.$queryRawUnsafe("SELECT 1"),
      new Promise((_, r) => setTimeout(() => r(new Error("gave up after 45s")), 45000)),
    ]);
    console.log(`OK    ${name}  (${Date.now() - t} ms)`);
  } catch (e) {
    const msg = String(e.message).split("\n").filter(Boolean).pop();
    console.log(`FAIL  ${name}  (${Date.now() - t} ms)  ${e.code ?? ""} ${msg}`);
  } finally {
    await db.$disconnect().catch(() => {});
  }
}
