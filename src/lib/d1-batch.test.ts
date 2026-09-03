import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  insertStatements,
  isUniqueViolation,
  runAtomicWrite,
  sqliteDateTime,
  type D1BatchDatabase,
  type D1Statement,
} from "./d1-batch";

type Recorded = { sql: string; values: unknown[] };

function fakeDb(): { db: D1BatchDatabase; recorded: Recorded[] } {
  const recorded: Recorded[] = [];
  const db: D1BatchDatabase = {
    prepare(sql) {
      const stmt: D1Statement & Recorded = {
        sql,
        values: [],
        bind(...values) {
          stmt.values = values;
          recorded.push(stmt);
          return stmt;
        },
      };
      return stmt;
    },
    batch: async () => [],
  };
  return { db, recorded };
}

describe("sqliteDateTime", () => {
  it("matches Prisma's SQLite DateTime storage format", () => {
    expect(sqliteDateTime(new Date("2026-09-03T04:25:00.000Z"))).toBe(
      "2026-09-03T04:25:00.000+00:00",
    );
    expect(sqliteDateTime(new Date("2026-09-03T03:34:31.685Z"))).toBe(
      "2026-09-03T03:34:31.685+00:00",
    );
  });
});

describe("insertStatements", () => {
  it("returns nothing for no rows", () => {
    const { db, recorded } = fakeDb();
    expect(insertStatements(db, "Team", ["id"], [])).toEqual([]);
    expect(recorded).toEqual([]);
  });

  it("writes one multi-row INSERT with values in column order", () => {
    const { db, recorded } = fakeDb();
    const stmts = insertStatements(
      db,
      "Team",
      ["id", "draftId", "position"],
      [
        { id: "tm_1", draftId: "drf_1", position: 0 },
        { id: "tm_2", draftId: "drf_1", position: 1 },
      ],
    );
    expect(stmts).toHaveLength(1);
    expect(recorded[0].sql).toBe(
      'INSERT INTO "Team" ("id", "draftId", "position") VALUES (?, ?, ?), (?, ?, ?)',
    );
    expect(recorded[0].values).toEqual(["tm_1", "drf_1", 0, "tm_2", "drf_1", 1]);
  });

  it("chunks so no statement binds more than 98 values", () => {
    const { db, recorded } = fakeDb();
    const columns = ["id", "draftId", "name", "ownerName", "avatarUrl", "sourceId", "position"] as const;
    const rows = Array.from({ length: 32 }, (_, i) => ({
      id: `tm_${i}`,
      draftId: "drf_1",
      name: `Team ${i}`,
      ownerName: null,
      avatarUrl: null,
      sourceId: null,
      position: i,
    }));
    const stmts = insertStatements(db, "Team", columns, rows);
    // 98 / 7 = 14 rows per statement: 14 + 14 + 4.
    expect(stmts).toHaveLength(3);
    expect(recorded.map((r) => r.values.length)).toEqual([98, 98, 28]);
    expect(recorded.flatMap((r) => r.values).filter((v) => typeof v === "string" && v.startsWith("tm_"))).toHaveLength(32);
  });
});

describe("isUniqueViolation", () => {
  it("recognises SQLite constraint errors, including wrapped ones", () => {
    expect(isUniqueViolation(new Error("D1_ERROR: UNIQUE constraint failed: Draft.id"))).toBe(true);
    expect(
      isUniqueViolation(new Error("query failed", { cause: new Error("SQLITE_CONSTRAINT_PRIMARYKEY") })),
    ).toBe(true);
    expect(isUniqueViolation(new Error("D1_ERROR: Network connection lost"))).toBe(false);
  });
});

describe("runAtomicWrite", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function deferred() {
    let resolve!: () => void;
    let reject!: (err: unknown) => void;
    const promise = new Promise<void>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  }

  it("resolves on a fast first attempt without a second call", async () => {
    const run = vi.fn(async () => {});
    await runAtomicWrite(run, { timeoutMs: 1000 });
    expect(run).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(5000);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("hedges with a second attempt when the first hangs, and takes its success", async () => {
    const first = deferred();
    const run = vi.fn().mockReturnValueOnce(first.promise).mockResolvedValueOnce(undefined);
    let done = false;
    const write = runAtomicWrite(run, { timeoutMs: 1000 }).then(() => {
      done = true;
    });
    await vi.advanceTimersByTimeAsync(999);
    expect(run).toHaveBeenCalledTimes(1);
    expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(run).toHaveBeenCalledTimes(2);
    await write;
    expect(done).toBe(true);
  });

  it("treats a later attempt's unique violation as success when the first attempt committed", async () => {
    const first = deferred();
    const run = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockRejectedValueOnce(new Error("D1_ERROR: UNIQUE constraint failed: Draft.id"));
    const confirmCommitted = vi.fn(async () => true);
    const write = runAtomicWrite(run, { timeoutMs: 1000, confirmCommitted });
    await vi.advanceTimersByTimeAsync(1000);
    await expect(write).resolves.toBeUndefined();
    expect(confirmCommitted).toHaveBeenCalledTimes(1);
  });

  it("rejects a later attempt's unique violation when nothing of ours was committed", async () => {
    const first = deferred();
    const err = new Error("D1_ERROR: UNIQUE constraint failed: Draft.slug");
    const run = vi.fn().mockReturnValueOnce(first.promise).mockRejectedValueOnce(err);
    const write = runAtomicWrite(run, {
      timeoutMs: 1000,
      confirmCommitted: async () => false,
    });
    write.catch(() => {});
    await vi.advanceTimersByTimeAsync(1000);
    await expect(write).rejects.toBe(err);
  });

  it("throws a first-attempt unique violation without retrying", async () => {
    const err = new Error("D1_ERROR: UNIQUE constraint failed: Draft.slug");
    const run = vi.fn().mockRejectedValue(err);
    await expect(runAtomicWrite(run, { timeoutMs: 1000 })).rejects.toBe(err);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("retries immediately after a fast non-constraint failure and throws when all attempts fail", async () => {
    const err1 = new Error("D1_ERROR: Network connection lost");
    const err2 = new Error("D1_ERROR: internal error");
    const run = vi.fn().mockRejectedValueOnce(err1).mockRejectedValueOnce(err2);
    const write = runAtomicWrite(run, { timeoutMs: 1000, attempts: 2 });
    write.catch(() => {});
    await vi.advanceTimersByTimeAsync(0);
    expect(run).toHaveBeenCalledTimes(2);
    await expect(write).rejects.toBe(err2);
  });

  it("keeps waiting on a hung first attempt when the hedge fails, and takes the first's late success", async () => {
    const first = deferred();
    const run = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockRejectedValueOnce(new Error("D1_ERROR: internal error"));
    let done = false;
    const write = runAtomicWrite(run, { timeoutMs: 1000 }).then(() => {
      done = true;
    });
    await vi.advanceTimersByTimeAsync(1000);
    expect(run).toHaveBeenCalledTimes(2);
    expect(done).toBe(false);
    first.resolve();
    await write;
    expect(done).toBe(true);
  });

  it("throws the hung first attempt's error once the hedge has also failed", async () => {
    const first = deferred();
    const err1 = new Error("D1_ERROR: timed out");
    const run = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockRejectedValueOnce(new Error("D1_ERROR: internal error"));
    const write = runAtomicWrite(run, { timeoutMs: 1000 });
    write.catch(() => {});
    await vi.advanceTimersByTimeAsync(1000);
    first.reject(err1);
    await expect(write).rejects.toBe(err1);
  });
});
