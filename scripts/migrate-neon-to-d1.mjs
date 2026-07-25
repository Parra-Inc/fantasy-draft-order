/**
 * One-time data migration: Neon Postgres -> Cloudflare D1.
 *
 * Reads the old production database (DATABASE_URL in .env.production) and
 * writes SQLite INSERTs for `wrangler d1 execute --file`. It touches neither
 * database: the output is a file you read before importing anything.
 *
 *   pnpm neon:export                  # -> prisma/data/neon-export.sql
 *   pnpm neon:export --include-orphans
 *   pnpm neon:import:local            # rehearse against the local D1
 *   pnpm neon:import:remote           # the real thing
 *
 * prisma/data/ is gitignored and stays that way. The export carries real
 * creator email addresses and this repo is public, so the cutover runs from a
 * laptop rather than from CI. Full runbook in docs/DEPLOY.md.
 *
 * The schemas are not identical, so this is a translation, not a dump:
 *
 * - DATETIME FORMAT. Prisma on SQLite stores DateTime as TEXT in RFC3339 with
 *   an explicit offset ("2026-07-25T16:14:56.113+00:00"), not as epoch millis
 *   and not as "YYYY-MM-DD HH:MM:SS". Get this wrong and every date reads back
 *   wrong through Prisma while the rows look fine in sqlite3.
 *
 *   Every timestamp is therefore formatted by Postgres (to_char, see UTC_TEXT)
 *   and travels as text. The obvious version of this script (SELECT the
 *   column, let pg hand back a JS Date, call toISOString()) is silently
 *   wrong: the columns are `timestamp without time zone` holding UTC, and
 *   node-postgres parses those in the *local* zone, so every draft time shifts
 *   by the exporting machine's UTC offset. Six hours, on the machine this was
 *   written on. Do not reintroduce a JS Date anywhere in this path.
 *
 * - DROPPED COLUMNS. Draft.status, startedAt and completedAt are derived from
 *   the picks now (src/lib/reveal.ts deriveStatus), and qstashMessageId died
 *   with the QStash scheduler. All four are discarded.
 *
 * - NEW COLUMNS. referrerSlug (NULL) and entrySource ('DIRECT') did not exist
 *   in Postgres: nothing to attribute retroactively.
 *
 * - Draft.seed WAS NULLABLE, IS NOT NULL. Two launch-day drafts predate the
 *   seed column, and both also have zero picks, which means they never drew an
 *   order and would import as permanently-SCHEDULED zombie pages. They are
 *   skipped unless --include-orphans, which gives them LEGACY_SEED instead.
 *
 * - Feedback has no Postgres counterpart. Nothing to migrate.
 *
 * Statement order matters: D1 enforces foreign keys, so Draft precedes Team
 * precedes Pick.
 */
import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const ENV_FILE = join(repoRoot, ".env.production");
const OUT_FILE = join(repoRoot, "prisma", "data", "neon-export.sql");

/** Marker seed for pre-seed-column drafts, only used with --include-orphans. */
const LEGACY_SEED = "LEGACY_NO_SEED";

/** Rows per INSERT. Keeps the statement count low without giant statements. */
const CHUNK = 50;

const includeOrphans = process.argv.includes("--include-orphans");

function readDatabaseUrl() {
  const raw = readFileSync(ENV_FILE, "utf8");
  const match = raw.match(/^\s*DATABASE_URL\s*=\s*"?([^"\n]+)"?\s*$/m);
  if (!match) throw new Error(`No DATABASE_URL in ${ENV_FILE}`);
  return match[1];
}

/**
 * Postgres-side formatter producing Prisma's SQLite DateTime representation:
 * RFC3339, milliseconds, explicit +00:00. The stored wall clock is already
 * UTC, so this stamps the offset on rather than converting anything.
 */
const UTC_TEXT = (column) =>
  `to_char("${column}", 'YYYY-MM-DD"T"HH24:MI:SS.MS"+00:00"') AS "${column}"`;

/** Guard against a formatter change silently emitting something Prisma cannot read. */
const RFC3339_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}\+00:00$/;

function checkDateTime(value, label) {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string" || !RFC3339_UTC.test(value)) {
    throw new Error(`${label} is not RFC3339 +00:00 text: ${String(value)}`);
  }
  return value;
}

function quote(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`Non-finite number: ${value}`);
    return String(value);
  }
  return `'${String(value).replace(/'/g, "''")}'`;
}

function insertStatements(table, columns, rows) {
  const out = [];
  const columnList = columns.map((c) => `"${c}"`).join(", ");
  for (let i = 0; i < rows.length; i += CHUNK) {
    const values = rows
      .slice(i, i + CHUNK)
      .map((row) => `  (${columns.map((c) => quote(row[c])).join(", ")})`)
      .join(",\n");
    out.push(`INSERT INTO "${table}" (${columnList}) VALUES\n${values};`);
  }
  return out;
}

async function main() {
  const client = new pg.Client({
    connectionString: readDatabaseUrl(),
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  try {
    // Ordered by createdAt so the dump is stable and diffable between runs.
    // Timestamps come back as text (see UTC_TEXT); the dropped columns
    // (status, startedAt, completedAt, qstashMessageId) are simply not
    // selected.
    const { rows: drafts } = await client.query(`
      SELECT id, slug, "leagueName", "creatorName", "creatorEmail",
             ${UTC_TEXT("scheduledFor")},
             "importSource", "importLeagueId", seed, "commitSha",
             ${UTC_TEXT("createdAt")},
             (SELECT count(*) FROM "Pick" p WHERE p."draftId" = "Draft".id)::int AS pick_count
      FROM "Draft" ORDER BY "createdAt"
    `);

    const orphans = drafts.filter((d) => d.pick_count === 0);
    const kept = includeOrphans
      ? drafts
      : drafts.filter((d) => d.pick_count > 0);
    const keptIds = new Set(kept.map((d) => d.id));

    const { rows: teams } = await client.query(
      `SELECT * FROM "Team" ORDER BY "draftId", position`,
    );
    const { rows: picks } = await client.query(`
      SELECT id, "draftId", "teamId", "pickNumber", ${UTC_TEXT("revealedAt")}
      FROM "Pick" ORDER BY "draftId", "pickNumber"
    `);

    const draftRows = kept.map((d) => ({
      id: d.id,
      slug: d.slug,
      leagueName: d.leagueName,
      creatorName: d.creatorName,
      creatorEmail: d.creatorEmail,
      scheduledFor: checkDateTime(d.scheduledFor, `${d.slug}.scheduledFor`),
      importSource: d.importSource,
      importLeagueId: d.importLeagueId,
      // NOT NULL on D1. Only ever missing on the pre-seed-column drafts, which
      // have no picks, so no drawn order is being misattributed to a fake seed.
      seed: d.seed ?? LEGACY_SEED,
      commitSha: d.commitSha,
      referrerSlug: null,
      entrySource: "DIRECT",
      createdAt: checkDateTime(d.createdAt, `${d.slug}.createdAt`),
    }));

    const teamRows = teams
      .filter((t) => keptIds.has(t.draftId))
      .map((t) => ({
        id: t.id,
        draftId: t.draftId,
        name: t.name,
        ownerName: t.ownerName,
        avatarUrl: t.avatarUrl,
        sourceId: t.sourceId,
        position: t.position,
      }));

    const pickRows = picks
      .filter((p) => keptIds.has(p.draftId))
      .map((p) => ({
        id: p.id,
        draftId: p.draftId,
        teamId: p.teamId,
        pickNumber: p.pickNumber,
        revealedAt: checkDateTime(p.revealedAt, `pick ${p.id}.revealedAt`),
      }));

    const statements = [
      ...insertStatements(
        "Draft",
        [
          "id",
          "slug",
          "leagueName",
          "creatorName",
          "creatorEmail",
          "scheduledFor",
          "importSource",
          "importLeagueId",
          "seed",
          "commitSha",
          "referrerSlug",
          "entrySource",
          "createdAt",
        ],
        draftRows,
      ),
      ...insertStatements(
        "Team",
        [
          "id",
          "draftId",
          "name",
          "ownerName",
          "avatarUrl",
          "sourceId",
          "position",
        ],
        teamRows,
      ),
      ...insertStatements(
        "Pick",
        ["id", "draftId", "teamId", "pickNumber", "revealedAt"],
        pickRows,
      ),
    ];

    const header = [
      "-- Generated by scripts/migrate-neon-to-d1.mjs. Do not edit by hand.",
      `-- Export id: ${randomUUID()}`,
      `-- Source: Neon (fantasy-draft-order), ${drafts.length} drafts on the wire.`,
      `-- Drafts: ${draftRows.length}  Teams: ${teamRows.length}  Picks: ${pickRows.length}`,
      includeOrphans
        ? `-- Including ${orphans.length} pickless draft(s); their seed is "${LEGACY_SEED}".`
        : `-- Skipping ${orphans.length} pickless draft(s): ${orphans.map((d) => d.slug).join(", ") || "none"}`,
      "-- Timestamps are RFC3339 +00:00 text, which is how Prisma stores",
      "-- DateTime on SQLite. Do not rewrite them as epoch millis.",
      "",
    ].join("\n");

    mkdirSync(dirname(OUT_FILE), { recursive: true });
    writeFileSync(OUT_FILE, `${header}${statements.join("\n\n")}\n`);

    console.log(`Wrote ${OUT_FILE}`);
    console.log(
      `  Draft ${draftRows.length}  Team ${teamRows.length}  Pick ${pickRows.length}  (${statements.length} statements)`,
    );
    if (!includeOrphans && orphans.length) {
      console.log(
        `  Skipped ${orphans.length} pickless draft(s): ${orphans.map((d) => d.slug).join(", ")}`,
      );
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
