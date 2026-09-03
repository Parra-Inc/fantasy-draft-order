import { cfEnv } from "@/lib/cloudflare/context";

/**
 * Atomic multi-row writes on D1, bypassing Prisma's transaction API.
 *
 * Why this exists: `prisma.$transaction([...])` on @prisma/adapter-d1 is not a
 * transaction. The adapter warns and then runs each statement as its own D1
 * round-trip (see D1WorkerTransaction in the adapter: commit() and rollback()
 * are no-ops). The create-draft route learned this the hard way: five times in
 * a week the first statement (the Draft row) landed, the second one (the teams)
 * hung in the D1 RPC path for the full 30s D1 timeout and threw, and the user
 * got a 500 plus an orphaned draft with no teams and no picks. D1's own analytics
 * for those minutes show exactly one write of 5 rows reaching the database, so
 * the hang is between the Worker and D1, not inside SQLite: a manual retry a few
 * seconds later succeeded every time.
 *
 * `D1Database.batch()` fixes both halves. It is a single round-trip, and the
 * D1 docs guarantee the statements run as one SQLite transaction: if any
 * statement fails the whole batch rolls back. That atomicity is what makes a
 * retry safe. Every id is generated before the write, so a second attempt is
 * byte-for-byte the same batch: at most one attempt can commit, and any other
 * attempt fails on the primary key.
 *
 * Prisma still owns every read. Only the two create routes write through here,
 * and they mirror Prisma's SQLite storage exactly (see sqliteDateTime) so the
 * rows are indistinguishable from ones Prisma wrote.
 */

/** The subset of D1PreparedStatement these helpers need. */
export type D1Statement = { bind(...values: unknown[]): D1Statement };

/** The subset of D1Database these helpers need. */
export type D1BatchDatabase = {
  prepare(query: string): D1Statement;
  batch(statements: D1Statement[]): Promise<unknown>;
};

/**
 * D1 rejects a statement with more than 100 bound parameters. Match the
 * adapter's own chunking limit (MAX_BIND_VALUES = 98) so a multi-row INSERT
 * never trips it.
 */
export const MAX_BIND_VALUES = 98;

export type SqlValue = string | number | null;

/**
 * Format a Date the way Prisma stores DateTime in SQLite: ISO 8601 with
 * millisecond precision and an explicit "+00:00" offset rather than "Z".
 * Prisma reads these back as Dates, so anything written here must match
 * exactly or a later `findUnique` would return a string-shaped surprise.
 */
export function sqliteDateTime(date: Date): string {
  return date.toISOString().replace(/Z$/, "+00:00");
}

/**
 * Build one or more multi-row INSERT statements for `rows`, chunked so no
 * statement binds more than MAX_BIND_VALUES parameters. Column order is
 * `columns`; every row must have every column (use null for absent values).
 */
export function insertStatements<C extends string>(
  db: D1BatchDatabase,
  table: string,
  columns: readonly C[],
  rows: readonly Record<C, SqlValue>[],
): D1Statement[] {
  if (rows.length === 0) return [];
  const rowsPerStatement = Math.max(
    1,
    Math.floor(MAX_BIND_VALUES / columns.length),
  );
  const columnList = columns.map((c) => `"${c}"`).join(", ");
  const placeholderRow = `(${columns.map(() => "?").join(", ")})`;
  const statements: D1Statement[] = [];
  for (let start = 0; start < rows.length; start += rowsPerStatement) {
    const chunk = rows.slice(start, start + rowsPerStatement);
    const sql = `INSERT INTO "${table}" (${columnList}) VALUES ${chunk
      .map(() => placeholderRow)
      .join(", ")}`;
    const values = chunk.flatMap((row) => columns.map((c) => row[c]));
    statements.push(db.prepare(sql).bind(...values));
  }
  return statements;
}

/**
 * True for the SQLite error a duplicate attempt of the same batch produces:
 * a UNIQUE / PRIMARY KEY violation. Ids are generated per request and slugs
 * are random, so within one request this can only mean a sibling attempt of
 * the identical batch already committed.
 */
export function isUniqueViolation(err: unknown): boolean {
  const message =
    err instanceof Error
      ? `${err.message} ${(err.cause as Error | undefined)?.message ?? ""}`
      : String(err);
  return /UNIQUE constraint failed|PRIMARY KEY constraint failed|SQLITE_CONSTRAINT/i.test(
    message,
  );
}

export type AtomicWriteOptions = {
  /**
   * How long to wait on an attempt before starting another one alongside it.
   * The observed failure mode is a request that hangs for D1's full 30s
   * timeout; a healthy batch here takes single-digit milliseconds, so a few
   * seconds is already 1000x the normal case.
   */
  timeoutMs?: number;
  /** Total attempts, including the first. */
  attempts?: number;
  /**
   * Called when a later attempt fails with a UNIQUE / PRIMARY KEY violation,
   * to check whether it was an earlier attempt of this same batch that
   * committed (true: the write succeeded) or a genuine collision with a
   * pre-existing row (false: the write failed). Without it a later-attempt
   * violation is taken as success.
   */
  confirmCommitted?: () => Promise<boolean>;
};

/**
 * Run an idempotent atomic write, hedging against a hung D1 request.
 *
 * `run` is called once immediately. If it has not settled after `timeoutMs`
 * it is left running and `run` is called again, up to `attempts` times. The
 * first attempt to succeed wins. Because the batch is atomic and the ids are
 * fixed, a later attempt failing with a UNIQUE / PRIMARY KEY violation means an
 * earlier attempt committed (confirmed via `confirmCommitted` when given), so
 * that also counts as success. A violation on the very first attempt is a real
 * conflict that no retry can fix, so it is thrown as-is. Any other error only
 * propagates once every attempt has failed.
 *
 * Only ever pass a batch that is safe to run twice: same ids, same rows, all
 * inside one `db.batch()` call.
 */
export async function runAtomicWrite(
  run: () => Promise<unknown>,
  {
    timeoutMs = 5_000,
    attempts = 2,
    confirmCommitted,
  }: AtomicWriteOptions = {},
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    let settled = false;
    let started = 0;
    let failed = 0;
    let lastError: unknown;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      fn();
    };

    const onFailure = (attempt: number, err: unknown) => {
      if (isUniqueViolation(err)) {
        if (attempt === 1) {
          finish(() => reject(err));
          return;
        }
        if (!confirmCommitted) {
          finish(resolve);
          return;
        }
        confirmCommitted().then(
          (committed) =>
            committed ? finish(resolve) : finish(() => reject(err)),
          () => finish(() => reject(err)),
        );
        return;
      }
      failed++;
      lastError = err;
      if (failed >= attempts) {
        finish(() => reject(lastError));
        return;
      }
      // This attempt failed fast, before the hedge fired: start the next one
      // now rather than waiting out the timer.
      if (started < attempts) {
        if (timer) clearTimeout(timer);
        start();
      }
    };

    const start = () => {
      const attempt = ++started;
      let promise: Promise<unknown>;
      try {
        promise = Promise.resolve(run());
      } catch (err) {
        promise = Promise.reject(err);
      }
      promise.then(
        () => finish(resolve),
        (err) => onFailure(attempt, err),
      );
      if (started < attempts) {
        timer = setTimeout(start, timeoutMs);
      }
    };

    start();
  });
}

/**
 * The raw D1 binding for the current request. Only the create routes use it,
 * and only for `batch()`; every read goes through Prisma. Throws off Workers
 * with the same explanation src/lib/prisma.ts gives.
 */
export function d1(): D1BatchDatabase {
  const db = cfEnv()?.DB;
  if (!db) {
    throw new Error(
      "No D1 binding available. On Workers this means the DB binding is " +
        "missing from wrangler.jsonc; locally it means next.config.ts did " +
        "not run initOpenNextCloudflareForDev().",
    );
  }
  return db;
}
