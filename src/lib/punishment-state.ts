import {
  derivePunishmentStatus,
  getRevealConfig,
  pickSpinStartAt,
  type PunishmentStatus,
} from "@/lib/reveal";

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

export type PunishmentStateView = {
  slug: string;
  leagueName: string;
  loserName: string;
  creatorName: string;
  scheduledFor: string;
  revealedAt: string;
  spinStartAt: string;
  spinDurationMs: number;
  status: PunishmentStatus;
  seed: string;
  commitSha: string | null;
  createdAt: string;
  options: PunishmentOptionView[];
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
  const status = derivePunishmentStatus({
    now,
    revealedAt: punishment.revealedAt,
    config,
  });

  const options = [...punishment.options]
    .sort((a, b) => a.position - b.position)
    .map((o) => ({ label: o.label, position: o.position }));

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
    spinStartAt: pickSpinStartAt(punishment.revealedAt, config).toISOString(),
    spinDurationMs: config.spinDurationMs,
    status,
    seed: punishment.seed,
    commitSha: punishment.commitSha,
    createdAt: punishment.createdAt.toISOString(),
    options,
    chosen,
    serverTime: now.toISOString(),
  };
}
