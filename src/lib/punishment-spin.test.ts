import { describe, expect, it } from "vitest";
import { getRevealConfig } from "./reveal";
import {
  derivePunishmentStatus,
  punishmentRevealedAt,
  seededRng,
  wheelEliminationOrder,
  wheelEliminationSchedule,
  wheelSpinPlan,
} from "./punishment-spin";

const config = getRevealConfig();
const SCHEDULED = new Date("2026-09-01T20:00:00.000Z");

function positions(count: number) {
  return Array.from({ length: count }, (_, i) => i);
}

function scheduleFor(optionCount: number, chosenPosition: number, seed = "s") {
  const revealedAt = punishmentRevealedAt(SCHEDULED, optionCount, config);
  return {
    revealedAt,
    entries: wheelEliminationSchedule({
      seed,
      positions: positions(optionCount),
      chosenPosition,
      scheduledFor: SCHEDULED,
      revealedAt,
      config,
    }),
  };
}

describe("wheelEliminationOrder", () => {
  it("knocks out every option except the chosen one, exactly once", () => {
    const order = wheelEliminationOrder("seed-a", positions(12), 7);
    expect(order).toHaveLength(11);
    expect(new Set(order).size).toBe(11);
    expect(order).not.toContain(7);
    expect([...order].sort((a, b) => a - b)).toEqual(
      positions(12).filter((p) => p !== 7),
    );
  });

  it("is identical for the same seed, so every viewer sees the same wheel", () => {
    const a = wheelEliminationOrder("same-seed", positions(10), 3);
    const b = wheelEliminationOrder("same-seed", positions(10), 3);
    expect(a).toEqual(b);
  });

  it("differs between seeds", () => {
    const a = wheelEliminationOrder("seed-a", positions(20), 0);
    const b = wheelEliminationOrder("seed-b", positions(20), 0);
    expect(a).not.toEqual(b);
  });

  it("is not simply ascending, which would leak the survivor at the first skip", () => {
    const order = wheelEliminationOrder("abc123", positions(16), 9);
    const ascending = positions(16).filter((p) => p !== 9);
    expect(order).not.toEqual(ascending);
  });
});

describe("seededRng", () => {
  it("stays inside the requested range", () => {
    const rng = seededRng("bounds");
    for (let max = 1; max <= 24; max++) {
      for (let i = 0; i < 50; i++) {
        const value = rng(max);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(max);
      }
    }
  });
});

describe("wheelSpinPlan", () => {
  it("ends the spin window exactly on revealedAt", () => {
    for (const count of [2, 3, 8, 12, 24]) {
      const revealedAt = punishmentRevealedAt(SCHEDULED, count, config);
      const plan = wheelSpinPlan({
        scheduledFor: SCHEDULED,
        revealedAt,
        optionCount: count,
        config,
      });
      expect(plan.eliminationCount).toBe(count - 1);
      expect(plan.startsAt.getTime() + plan.windowMs).toBe(
        revealedAt.getTime(),
      );
      expect(plan.startsAt.getTime()).toBeGreaterThanOrEqual(
        SCHEDULED.getTime(),
      );
    }
  });

  it("compresses rather than starting early on a wheel drawn before the spin existed", () => {
    // Legacy row: revealedAt was scheduledFor + firstPickDelayMs, flat.
    const revealedAt = new Date(SCHEDULED.getTime() + config.firstPickDelayMs);
    const plan = wheelSpinPlan({
      scheduledFor: SCHEDULED,
      revealedAt,
      optionCount: 24,
      config,
    });
    expect(plan.startsAt.getTime()).toBeGreaterThanOrEqual(SCHEDULED.getTime());
    expect(plan.windowMs).toBeLessThanOrEqual(config.firstPickDelayMs);
  });
});

describe("wheelEliminationSchedule", () => {
  it("lands its last elimination exactly on revealedAt, leaving one standing", () => {
    const { revealedAt, entries } = scheduleFor(9, 4);
    expect(entries).toHaveLength(8);
    expect(entries[entries.length - 1].eliminatedAt.getTime()).toBe(
      revealedAt.getTime(),
    );
    expect(entries.map((e) => e.position)).not.toContain(4);
  });

  it("runs strictly forwards, one spin per elimination", () => {
    const { entries } = scheduleFor(12, 0);
    for (let i = 1; i < entries.length; i++) {
      expect(entries[i].eliminatedAt.getTime()).toBeGreaterThan(
        entries[i - 1].eliminatedAt.getTime(),
      );
      // Each spin starts where the previous one landed: the wheel never idles.
      expect(entries[i].spinStartAt.getTime()).toBe(
        entries[i - 1].eliminatedAt.getTime(),
      );
    }
  });

  it("never discloses an elimination before its spin, nor before the draw", () => {
    const { entries } = scheduleFor(6, 2);
    for (const entry of entries) {
      expect(entry.discloseAt.getTime()).toBeLessThan(
        entry.spinStartAt.getTime(),
      );
    }
    // Nothing at all is knowable at the moment the wheel was scheduled.
    const atSchedule = entries.filter((e) => e.discloseAt <= SCHEDULED);
    expect(atSchedule).toHaveLength(0);
  });
});

describe("derivePunishmentStatus", () => {
  const optionCount = 8;
  const revealedAt = punishmentRevealedAt(SCHEDULED, optionCount, config);
  const plan = wheelSpinPlan({
    scheduledFor: SCHEDULED,
    revealedAt,
    optionCount,
    config,
  });
  const status = (now: Date) =>
    derivePunishmentStatus({
      now,
      scheduledFor: SCHEDULED,
      revealedAt,
      optionCount,
      config,
    });

  it("is SCHEDULED before the wheel starts turning", () => {
    expect(status(new Date(SCHEDULED.getTime() - 1))).toBe("SCHEDULED");
    expect(status(new Date(plan.startsAt.getTime() - 1))).toBe("SCHEDULED");
  });

  it("is SPINNING for the whole elimination sequence", () => {
    expect(status(plan.startsAt)).toBe("SPINNING");
    expect(status(new Date(revealedAt.getTime() - 1))).toBe("SPINNING");
  });

  it("is COMPLETED from the instant the last option is struck out", () => {
    expect(status(revealedAt)).toBe("COMPLETED");
  });
});
