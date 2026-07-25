/**
 * Locate the local D1 database file.
 *
 * `wrangler d1 migrations apply --local` and `next dev` (via
 * initOpenNextCloudflareForDev's miniflare) both read and write the same
 * SQLite file under .wrangler/state. Node-side tooling that cannot use the D1
 * binding — Prisma Studio, prisma/seed.ts — opens that file directly through
 * better-sqlite3 so every path sees one database.
 *
 * FINDING THE RIGHT FILE
 * ----------------------
 * Miniflare names the file after the D1 `database_id`, so changing that id in
 * wrangler.jsonc (notably: the first real deploy replacing REPLACE_WITH_D1_ID)
 * leaves the old file sitting next to the new one. Picking the first *.sqlite
 * in the directory then silently selects a stale database, and the symptom is
 * a baffling "table does not exist" from a schema you just migrated.
 *
 * The naming is a miniflare implementation detail and is NOT a plain
 * sha256(database_id), so this does not try to reproduce it. Instead it opens
 * each candidate and keeps the ones that actually look like this app's
 * database, preferring whichever has applied the most migrations. That stays
 * correct if miniflare changes its naming scheme.
 */
import Database from "better-sqlite3";
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

/** Applied-migration count, or -1 if this file is not one of our databases. */
function migrationCount(file) {
  let db;
  try {
    db = new Database(file, { readonly: true, fileMustExist: true });
    const row = db
      .prepare(
        "SELECT count(*) AS n FROM sqlite_master WHERE type='table' AND name='d1_migrations'",
      )
      .get();
    if (!row || row.n === 0) return -1;
    return db.prepare("SELECT count(*) AS n FROM d1_migrations").get().n;
  } catch {
    return -1;
  } finally {
    db?.close();
  }
}

/**
 * @returns absolute path to the local D1 sqlite file, or null if there is not
 * one yet (nothing migrated since the last `pnpm dev --force`).
 */
export function findLocalD1File() {
  if (!existsSync(D1_STATE_DIR)) return null;

  const candidates = readdirSync(D1_STATE_DIR)
    .filter((f) => f.endsWith(".sqlite") && f !== "metadata.sqlite")
    .map((f) => join(D1_STATE_DIR, f));

  let best = null;
  let bestCount = -1;
  for (const file of candidates) {
    const count = migrationCount(file);
    if (count > bestCount) {
      best = file;
      bestCount = count;
    }
  }
  return bestCount >= 0 ? best : null;
}

/**
 * Same, but throws with an actionable message. Use from tooling that cannot do
 * anything useful without a database.
 */
export function requireLocalD1File() {
  const file = findLocalD1File();
  if (!file) {
    throw new Error(
      "No migrated local D1 database found. Run `pnpm db:migrate:local` first " +
        `(looked for a .sqlite with a d1_migrations table in ${D1_STATE_DIR}).`,
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
