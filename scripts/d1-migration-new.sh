#!/usr/bin/env bash
#
# Generate a new D1 migration from the current Prisma schema.
#
#   pnpm db:migrate:new add_draft_notes
#
# Prisma Migrate does not drive D1, so the two tools split the job: Prisma
# diffs the local D1 database against prisma/schema and emits the SQL, wrangler
# applies and tracks it. Apply the result with `pnpm db:migrate:local` (and, on
# deploy, `pnpm db:migrate:remote` — the workflow does that for you).
#
# ALWAYS review the generated SQL before applying it. Two reasons:
#   - `migrate diff` is mechanical and will happily emit a destructive change
#     if the schema implies one.
#   - SQLite's ALTER TABLE is limited, so Prisma emits a create-copy-drop-rename
#     table rebuild for anything beyond adding a nullable-or-defaulted column.
#     That is correct but heavy, and on a populated table it is worth
#     hand-writing a plain `ALTER TABLE ... ADD COLUMN` instead.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

NAME="${1:-}"
if [ -z "$NAME" ]; then
  echo "Usage: pnpm db:migrate:new <snake_case_name>" >&2
  exit 1
fi

MIGRATIONS_DIR="prisma/migrations"
mkdir -p "$MIGRATIONS_DIR"

# Wrangler orders migrations by the numeric prefix, so continue the sequence.
LAST=$(find "$MIGRATIONS_DIR" -maxdepth 1 -name '[0-9]*.sql' -exec basename {} \; \
  | sort | tail -1 | cut -d_ -f1)
NEXT=$(printf "%04d" $(( 10#${LAST:-0} + 1 )))
OUT="$MIGRATIONS_DIR/${NEXT}_${NAME}.sql"

# Diff the LOCAL D1 database against the schema. Prisma 7 removed
# --from-local-d1, so this goes through --from-config-datasource:
# prisma.config.ts points its datasource url at the same .wrangler/state
# SQLite file (see scripts/local-d1.mjs). Run `pnpm db:migrate:local` first, or
# the diff is measured against a stale database.
#
# On the very first migration there is no local database yet, so baseline from
# empty instead.
if [ -d ".wrangler/state/v3/d1" ]; then
  FROM=(--from-config-datasource)
else
  FROM=(--from-empty)
fi

pnpm exec prisma migrate diff \
  "${FROM[@]}" \
  --to-schema ./prisma/schema \
  --script \
  --output "$OUT"

# When there is nothing to do, Prisma writes the literal comment
# "-- This is an empty migration.", so a plain non-empty check is not enough:
# strip comments and whitespace and see whether any statement is left.
if [ ! -s "$OUT" ] || ! sed 's/--.*//' "$OUT" | grep -q '[^[:space:]]'; then
  rm -f "$OUT"
  echo "No schema changes to migrate."
  exit 0
fi

echo "Wrote $OUT"
echo "Review it, then run: pnpm db:migrate:local"
