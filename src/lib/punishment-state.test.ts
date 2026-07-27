import { describe, expect, it } from "vitest";
import { serializePunishmentState } from "./punishment-state";
import { punishmentRevealedAt, wheelSpinPlan } from "./punishment-spin";
import { getRevealConfig } from "./reveal";

const config = getRevealConfig();
const SCHEDULED = new Date("2026-09-01T20:00:00.000Z");
const OPTION_COUNT = 10;
const CHOSEN = 6;

const REVEALED = punishmentRevealedAt(SCHEDULED, OPTION_COUNT, config);
const PLAN = wheelSpinPlan({
  scheduledFor: SCHEDULED,
  revealedAt: REVEALED,
  optionCount: OPTION_COUNT,
  config,
});

const punishment = {
  slug: "ivory-otter-5tcp",
  leagueName: "The League",
  loserName: "Dave",
  creatorName: "Sam",
  scheduledFor: SCHEDULED,
  revealedAt: REVEALED,
  chosenPosition: CHOSEN,
  seed: "8f2c1d9ab4e6075311aa22bb33cc44dd",
  commitSha: null,
  createdAt: new Date("2026-08-25T12:00:00.000Z"),
  options: Array.from({ length: OPTION_COUNT }, (_, position) => ({
    label: `punishment ${position}`,
    position,
  })),
};

const at = (now: Date) => serializePunishmentState(punishment, now);

describe("serializePunishmentState", () => {
  it("discloses nothing about the result before the wheel starts turning", () => {
    const state = at(new Date(SCHEDULED.getTime() - 60_000));
    expect(state.status).toBe("SCHEDULED");
    expect(state.chosen).toBeNull();
    expect(state.eliminations).toHaveLength(0);
    // The options themselves ARE public, and have to be: seeing the list up
    // front is what proves nothing was reworded once the answer was known.
    // What must not leak is which one it is, and nothing here singles one out.
    expect(state.options).toHaveLength(OPTION_COUNT);
    expect(new Set(Object.keys(state.options[CHOSEN]))).toEqual(
      new Set(Object.keys(state.options[0])),
    );
  });

  it("never names the chosen option among the eliminations, at any moment", () => {
    for (
      let t = SCHEDULED.getTime();
      t <= REVEALED.getTime() + 5_000;
      t += 100
    ) {
      const state = at(new Date(t));
      expect(state.eliminations.map((e) => e.position)).not.toContain(CHOSEN);
    }
  });

  it("withholds the result until revealedAt, then hands it over", () => {
    expect(at(new Date(REVEALED.getTime() - 1)).chosen).toBeNull();
    expect(at(REVEALED).chosen).toEqual({
      label: `punishment ${CHOSEN}`,
      position: CHOSEN,
    });
  });

  it("leaks at most the spin currently in flight", () => {
    // Mid-sequence, the wheel cannot already know its whole running order:
    // an option that has not been spun for yet is simply absent.
    const midway = new Date(PLAN.startsAt.getTime() + PLAN.windowMs / 2);
    const state = at(midway);
    expect(state.status).toBe("SPINNING");
    expect(state.eliminations.length).toBeGreaterThan(0);
    expect(state.eliminations.length).toBeLessThan(OPTION_COUNT - 1);
  });

  it("has struck out everything but the survivor once the wheel stops", () => {
    const state = at(REVEALED);
    expect(state.status).toBe("COMPLETED");
    expect(state.eliminations).toHaveLength(OPTION_COUNT - 1);
    const survivors = state.options.filter(
      (o) => !state.eliminations.some((e) => e.position === o.position),
    );
    expect(survivors).toEqual([state.chosen]);
  });

  it("puts the spin window before revealedAt, not after", () => {
    const state = at(SCHEDULED);
    expect(new Date(state.spinStartAt).getTime()).toBeGreaterThanOrEqual(
      SCHEDULED.getTime(),
    );
    expect(new Date(state.spinStartAt).getTime()).toBeLessThan(
      new Date(state.revealedAt).getTime(),
    );
    expect(state.spinDurationMs).toBeGreaterThan(0);
  });
});
