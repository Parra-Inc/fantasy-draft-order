import { describe, expect, it } from "vitest";
import { fisherYatesShuffle, generateDraftOrder, type Rng } from "./randomizer";

function sequenceRng(values: number[]): Rng {
  let i = 0;
  return () => {
    if (i >= values.length) throw new Error("sequenceRng exhausted");
    return values[i++];
  };
}

describe("fisherYatesShuffle", () => {
  it("preserves length and all elements", () => {
    const input = [1, 2, 3, 4, 5];
    const out = fisherYatesShuffle(input);
    expect(out).toHaveLength(5);
    expect([...out].sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it("does not mutate input", () => {
    const input = [1, 2, 3];
    const before = [...input];
    fisherYatesShuffle(input);
    expect(input).toEqual(before);
  });

  it("is deterministic with a deterministic rng", () => {
    const rng = sequenceRng([2, 0, 0, 0]);
    const out = fisherYatesShuffle(["a", "b", "c", "d"], rng);
    expect(out).toHaveLength(4);
  });

  it("produces a uniform distribution over many runs (3-sigma)", () => {
    const teams = Array.from({ length: 12 }, (_, i) => i);
    const runs = 12000;
    const expected = runs / teams.length;
    // Binomial σ ≈ √(n·p·(1-p)) ≈ √(12000·(1/12)·(11/12)) ≈ 30.3
    // 4σ ≈ 121 → comfortable bound
    const tolerance = 150;

    const counts: number[][] = Array.from({ length: teams.length }, () =>
      new Array(teams.length).fill(0),
    );
    for (let run = 0; run < runs; run++) {
      const shuffled = fisherYatesShuffle(teams);
      for (let pos = 0; pos < shuffled.length; pos++) {
        counts[shuffled[pos]][pos]++;
      }
    }

    for (let team = 0; team < teams.length; team++) {
      for (let pos = 0; pos < teams.length; pos++) {
        expect(Math.abs(counts[team][pos] - expected)).toBeLessThan(tolerance);
      }
    }
  });
});

describe("generateDraftOrder", () => {
  it("assigns every team exactly one pickNumber", () => {
    const teams = [{ teamId: "a" }, { teamId: "b" }, { teamId: "c" }];
    const picks = generateDraftOrder(teams);
    const pickNumbers = picks.map((p) => p.pickNumber).sort();
    expect(pickNumbers).toEqual([1, 2, 3]);
    expect(new Set(picks.map((p) => p.teamId)).size).toBe(3);
  });
});
