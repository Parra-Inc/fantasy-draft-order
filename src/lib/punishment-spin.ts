import { fisherYatesShuffle, type Rng } from "@/lib/randomizer";
import { getRevealConfig, type RevealConfig } from "@/lib/reveal";

/**
 * Timing and running order for the punishment wheel.
 *
 * The wheel does not reveal its answer by announcing it. It eliminates: the
 * wheel spins, lands on an option, that option is struck out, and it spins
 * again until one is left standing. The survivor is the punishment, and the
 * last elimination lands at exactly `revealedAt`, the same instant
 * serializePunishmentState() is allowed to disclose `chosen`. The animation and
 * the disclosure rule are therefore the same event, not two things that have to
 * be kept in sync.
 *
 * Every timestamp here is derived from data that was written at create time
 * (scheduledFor, revealedAt, the option count), so every viewer computes the
 * identical schedule and sees the identical spin at the identical second. Same
 * property the draft reel has, for the same reason: no background jobs, the
 * passage of time is the trigger.
 */

export type PunishmentStatus = "SCHEDULED" | "SPINNING" | "COMPLETED";

/**
 * Bounds on one elimination spin. The target window (config.wheelSpinTargetMs)
 * is divided by the number of eliminations and then clamped, so a 3-option
 * wheel gets three unhurried spins rather than one blink, and a 24-option wheel
 * rattles through instead of running for half a minute.
 */
const MIN_SPIN_MS = 420;
const MAX_SPIN_MS = 1_500;

/**
 * How far ahead of a spin the server names the option that spin will kill.
 *
 * The wheel has to decelerate *into* its target, so the client needs the target
 * before the spin starts, plus enough slack to survive a poll interval. That
 * means the final elimination (and therefore the survivor) is knowable to
 * anyone reading the network tab this many ms plus one spin early. The draft
 * reel already makes exactly this trade (`currentSpin` names the next pick a
 * full spin ahead), and it costs nothing that matters: the threat this feature
 * defends against is a commissioner peeking *before the scheduled time* and
 * then not sharing the link. By now everyone is on the page watching.
 */
const DISCLOSURE_LEAD_MS = 1_200;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** How long a single elimination spin runs on a wheel of this size. */
export function wheelPerSpinMs(
  optionCount: number,
  config: RevealConfig = getRevealConfig(),
): number {
  const eliminations = Math.max(1, optionCount - 1);
  return Math.round(
    clamp(config.wheelSpinTargetMs / eliminations, MIN_SPIN_MS, MAX_SPIN_MS),
  );
}

/** How long the whole elimination sequence wants to run, unclamped by the schedule. */
export function wheelSpinWindowMs(
  optionCount: number,
  config: RevealConfig = getRevealConfig(),
): number {
  if (optionCount < 2) return 0;
  return wheelPerSpinMs(optionCount, config) * (optionCount - 1);
}

/**
 * When a wheel's single reveal lands, stored at create time.
 *
 * Reuses the draft's first-pick delay so a wheel scheduled for 8pm behaves like
 * a draft scheduled for 8pm: a beat of "everyone is here" before anything
 * moves, and then adds the full spin window, because the reveal is the *end*
 * of the spin, not the start of it.
 */
export function punishmentRevealedAt(
  scheduledFor: Date,
  optionCount: number,
  config: RevealConfig = getRevealConfig(),
): Date {
  return new Date(
    scheduledFor.getTime() +
      config.firstPickDelayMs +
      wheelSpinWindowMs(optionCount, config),
  );
}

export type WheelSpinPlan = {
  /** When the wheel starts turning. */
  startsAt: Date;
  /** Duration of one elimination spin. */
  perSpinMs: number;
  /** startsAt → revealedAt. */
  windowMs: number;
  /** Always optionCount - 1: everything but the survivor gets struck out. */
  eliminationCount: number;
};

/**
 * The spin window for an existing wheel, worked backwards from its stored
 * revealedAt.
 *
 * Clamped to the gap between scheduledFor and revealedAt so the wheel can never
 * start turning before the time the league was told. That clamp is what keeps
 * wheels created before this animation existed (revealedAt was scheduledFor +
 * firstPickDelayMs flat) sane: they simply spin faster.
 */
export function wheelSpinPlan(input: {
  scheduledFor: Date;
  revealedAt: Date;
  optionCount: number;
  config?: RevealConfig;
}): WheelSpinPlan {
  const { scheduledFor, revealedAt, optionCount } = input;
  const config = input.config ?? getRevealConfig();
  const eliminationCount = Math.max(0, optionCount - 1);
  if (eliminationCount === 0) {
    return {
      startsAt: revealedAt,
      perSpinMs: 0,
      windowMs: 0,
      eliminationCount: 0,
    };
  }

  const available = Math.max(0, revealedAt.getTime() - scheduledFor.getTime());
  const ideal = wheelSpinWindowMs(optionCount, config);
  // floor, not round: rounding up could push startsAt a few ms in front of
  // scheduledFor, and the wheel must never move before the announced time.
  const perSpinMs = Math.max(
    1,
    Math.floor(Math.min(ideal, available) / eliminationCount),
  );
  const windowMs = perSpinMs * eliminationCount;

  return {
    startsAt: new Date(revealedAt.getTime() - windowMs),
    perSpinMs,
    windowMs,
    eliminationCount,
  };
}

export function derivePunishmentStatus(input: {
  now: Date;
  scheduledFor: Date;
  revealedAt: Date;
  optionCount: number;
  config?: RevealConfig;
}): PunishmentStatus {
  const { now, revealedAt } = input;
  if (now.getTime() >= revealedAt.getTime()) return "COMPLETED";
  return now.getTime() >= wheelSpinPlan(input).startsAt.getTime()
    ? "SPINNING"
    : "SCHEDULED";
}

/**
 * A deterministic RNG over the wheel's public seed.
 *
 * This picks nothing. The result was drawn at create time by the audited
 * Fisher-Yates in randomizer.ts using crypto.randomInt, and lives in
 * Punishment.chosenPosition; all this decides is the order in which the *losing*
 * options get struck out on the way there. It is seeded rather than random so
 * every viewer sees the same wheel land on the same segments, and so the
 * running order is checkable after the fact from the seed printed in the audit
 * trail instead of being something the server could have picked to suit itself.
 *
 * mulberry32 over an FNV-1a hash of the seed: small, deterministic across
 * engines, and used for presentation only, so its statistical quality is not
 * load-bearing.
 */
export function seededRng(seed: string): Rng {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 0x01000193);
  }
  let state = h >>> 0;
  return (maxExclusive: number) => {
    if (maxExclusive <= 1) return 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    const unit = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    return Math.min(maxExclusive - 1, Math.floor(unit * maxExclusive));
  };
}

/** Every position except the winner, in the order the wheel will knock them out. */
export function wheelEliminationOrder(
  seed: string,
  positions: readonly number[],
  chosenPosition: number,
): number[] {
  const losers = positions.filter((p) => p !== chosenPosition);
  return fisherYatesShuffle(losers, seededRng(seed));
}

export type ScheduledElimination = {
  position: number;
  /** The wheel starts turning towards this option. */
  spinStartAt: Date;
  /** It lands, and the option is struck out. */
  eliminatedAt: Date;
  /** Earliest moment this may be sent to a client (see DISCLOSURE_LEAD_MS). */
  discloseAt: Date;
};

/**
 * The full running order with timings. The last entry always lands exactly on
 * revealedAt, leaving the chosen option as the only one still standing.
 */
export function wheelEliminationSchedule(input: {
  seed: string;
  positions: readonly number[];
  chosenPosition: number;
  scheduledFor: Date;
  revealedAt: Date;
  config?: RevealConfig;
}): ScheduledElimination[] {
  const plan = wheelSpinPlan({
    scheduledFor: input.scheduledFor,
    revealedAt: input.revealedAt,
    optionCount: input.positions.length,
    config: input.config,
  });
  if (plan.eliminationCount === 0) return [];

  const order = wheelEliminationOrder(
    input.seed,
    input.positions,
    input.chosenPosition,
  );
  const lastIndex = order.length - 1;

  return order.map((position, index) => {
    const eliminatedAt = new Date(
      input.revealedAt.getTime() - (lastIndex - index) * plan.perSpinMs,
    );
    const spinStartAt = new Date(eliminatedAt.getTime() - plan.perSpinMs);
    return {
      position,
      spinStartAt,
      eliminatedAt,
      discloseAt: new Date(spinStartAt.getTime() - DISCLOSURE_LEAD_MS),
    };
  });
}
