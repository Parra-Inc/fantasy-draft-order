/**
 * Locate the local D1 database file.
 *
 * `wrangler d1 migrations apply --local` and `next dev` (via
 * initOpenNextCloudflareForDev's miniflare) both read and write the same
 * SQLite file under .wrangler/state. Node-side tooling that cannot use the D1
 * binding — Prisma Studio, prisma/seed.ts — opens that file directly through
 * better-sqlite3 so every path sees one database.
 *
 * The filename is a miniflare-generated hash, hence the scan.
 */
import { existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const D1_STATE_DIR = join(
  repoRoot,
  ".wrangler",
  "state",
  "v3",
  "d1",
  "miniflare-D1DatabaseObject",
);

/**
 * @returns absolute path to the local D1 sqlite file, or null if it does not
 * exist yet (no migrations applied since the last `pnpm dev --force`).
 */
export function findLocalD1File() {
  if (!existsSync(D1_STATE_DIR)) return null;
  const file = readdirSync(D1_STATE_DIR).find((f) => f.endsWith(".sqlite"));
  return file ? join(D1_STATE_DIR, file) : null;
}

/**
 * Same, but throws with an actionable message. Use from tooling that cannot
 * do anything useful without a database.
 */
export function requireLocalD1File() {
  const file = findLocalD1File();
  if (!file) {
    throw new Error(
      "No local D1 database found. Run `pnpm db:migrate:local` first " +
        `(expected a .sqlite file in ${D1_STATE_DIR}).`,
    );
  }
  return file;
}

/** `file:` URL form, which is what Prisma's datasource url expects. */
export function localD1Url() {
  const file = findLocalD1File();
  // Prisma validates the config at load time even for commands that never open
  // the database, so fall back to a path rather than throwing here.
  return `file:${file ?? join(D1_STATE_DIR, "missing.sqlite")}`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(requireLocalD1File());
}
