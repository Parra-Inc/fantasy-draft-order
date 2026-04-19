import { randomInt } from "node:crypto";

export type Rng = (maxExclusive: number) => number;

export const cryptoRng: Rng = (maxExclusive) => randomInt(0, maxExclusive);

export function fisherYatesShuffle<T>(items: readonly T[], rng: Rng = cryptoRng): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = rng(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export type DraftOrderInput = { teamId: string };
export type DraftOrderPick = { teamId: string; pickNumber: number };

export function generateDraftOrder(
  teams: readonly DraftOrderInput[],
  rng: Rng = cryptoRng,
): DraftOrderPick[] {
  const shuffled = fisherYatesShuffle(teams, rng);
  return shuffled.map((team, idx) => ({
    teamId: team.teamId,
    pickNumber: idx + 1,
  }));
}
