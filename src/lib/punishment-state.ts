import {
  derivePunishmentStatus,
  wheelEliminationSchedule,
  wheelSpinPlan,
  type PunishmentStatus,
} from "@/lib/punishment-spin";
import { getRevealConfig } from "@/lib/reveal";

/**
 * The single place a punishment wheel is turned into something a client sees.
 *
 * Both the state endpoint and the server render of /p/[slug] go through here,
 * on purpose. The one rule this feature rests on is that **the result is not
 * disclosed before revealedAt** — a commissioner who can read the answer early
 * can decide not to share the link, and the whole trust story collapses. Two
 * hand-written serializers would eventually disagree about that; one cannot.
 *
 * The candidate options ARE public from the moment the wheel is created. That
 * is deliberate: seeing the list beforehand is what proves nothing was added,
 * removed or reworded once the result was known.
 */

export type PunishmentOptionView = {
  label: string;
  position: number;
};

/**
 * One option the wheel has landed on, or is about to. Sent slightly ahead of
 * `spinStartAt` so the wheel has something to decelerate into; see
 * DISCLOSURE_LEAD_MS in src/lib/punishment-spin.ts for why that is safe and
 * what it costs.
 */
export type PunishmentEliminationView = {
  position: number;
  spinStartAt: string;
  eliminatedAt: string;
};

export type PunishmentStateView = {
  slug: string;
  leagueName: string;
  loserName: string;
  creatorName: string;
  scheduledFor: string;
  revealedAt: string;
  /** When the wheel starts turning, which is before revealedAt, not after. */
  spinStartAt: string;
  /** Duration of one elimination spin. */
  spinDurationMs: number;
  status: PunishmentStatus;
  seed: string;
  commitSha: string | null;
  createdAt: string;
  options: PunishmentOptionView[];
  /**
   * The options the wheel has already knocked out, oldest first, filtered to
   * those whose moment has come. Never contains the chosen option: it is the
   * one left standing.
   */
  eliminations: PunishmentEliminationView[];
  /** Null until the reveal has actually happened. Never populated early. */
  chosen: PunishmentOptionView | null;
  serverTime: string;
};

type PunishmentRow = {
  slug: string;
  leagueName: string;
  loserName: string;
  creatorName: string;
  scheduledFor: Date;
  revealedAt: Date;
  chosenPosition: number;
  seed: string;
  commitSha: string | null;
  createdAt: Date;
  options: { label: string; position: number }[];
};

export function serializePunishmentState(
  punishment: PunishmentRow,
  now: Date = new Date(),
): PunishmentStateView {
  const config = getRevealConfig();

  const options = [...punishment.options]
    .sort((a, b) => a.position - b.position)
    .map((o) => ({ label: o.label, position: o.position }));

  const status = derivePunishmentStatus({
    now,
    scheduledFor: punishment.scheduledFor,
    revealedAt: punishment.revealedAt,
    optionCount: options.length,
    config,
  });
  const plan = wheelSpinPlan({
    scheduledFor: punishment.scheduledFor,
    revealedAt: punishment.revealedAt,
    optionCount: options.length,
    config,
  });

  // The running order is derived, not stored, and it names only losing options.
  // Filtering it by discloseAt is what keeps the spin honest: an option the
  // wheel has not reached yet is not in the payload at all, so the sequence
  // cannot be read ahead beyond the one spin currently in flight.
  const eliminations = wheelEliminationSchedule({
    seed: punishment.seed,
    positions: options.map((o) => o.position),
    chosenPosition: punishment.chosenPosition,
    scheduledFor: punishment.scheduledFor,
    revealedAt: punishment.revealedAt,
    config,
  })
    .filter((e) => e.discloseAt <= now)
    .map((e) => ({
      position: e.position,
      spinStartAt: e.spinStartAt.toISOString(),
      eliminatedAt: e.eliminatedAt.toISOString(),
    }));

  // The only place the result is allowed to escape. Keyed off the status, not
  // off a caller-supplied flag, so there is no "just this once" override.
  const chosen =
    status === "COMPLETED"
      ? (options.find((o) => o.position === punishment.chosenPosition) ?? null)
      : null;

  return {
    slug: punishment.slug,
    leagueName: punishment.leagueName,
    loserName: punishment.loserName,
    creatorName: punishment.creatorName,
    scheduledFor: punishment.scheduledFor.toISOString(),
    revealedAt: punishment.revealedAt.toISOString(),
    spinStartAt: plan.startsAt.toISOString(),
    spinDurationMs: plan.perSpinMs,
    status,
    seed: punishment.seed,
    commitSha: punishment.commitSha,
    createdAt: punishment.createdAt.toISOString(),
    options,
    eliminations,
    chosen,
    serverTime: now.toISOString(),
  };
}
