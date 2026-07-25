export type RevealConfig = {
  firstPickDelayMs: number;
  pickIntervalMs: number;
  spinDurationMs: number;
};

export function getRevealConfig(): RevealConfig {
  const firstPickDelayMs = Number(
    process.env.DRAFT_FIRST_PICK_DELAY_MS ?? 5000,
  );
  const pickIntervalMs = Number(process.env.DRAFT_PICK_INTERVAL_MS ?? 7000);
  const spinDurationMs = Number(process.env.DRAFT_SPIN_DURATION_MS ?? 4000);
  return {
    firstPickDelayMs: Number.isFinite(firstPickDelayMs)
      ? firstPickDelayMs
      : 5000,
    pickIntervalMs: Number.isFinite(pickIntervalMs) ? pickIntervalMs : 7000,
    spinDurationMs: Number.isFinite(spinDurationMs) ? spinDurationMs : 4000,
  };
}

export function pickRevealedAt(
  scheduledFor: Date,
  revealOrderIndex: number,
  config: RevealConfig = getRevealConfig(),
): Date {
  return new Date(
    scheduledFor.getTime() +
      config.firstPickDelayMs +
      revealOrderIndex * config.pickIntervalMs,
  );
}

export function pickSpinStartAt(
  revealedAt: Date,
  config: RevealConfig = getRevealConfig(),
): Date {
  return new Date(revealedAt.getTime() - config.spinDurationMs);
}

export type DerivedStatus = "SCHEDULED" | "DRAWING" | "COMPLETED";

export type PunishmentStatus = "SCHEDULED" | "SPINNING" | "COMPLETED";

/**
 * Status of a punishment wheel, which reveals exactly once.
 *
 * deriveStatus() below cannot be reused for this: with a single reveal its
 * first and last timestamps coincide, so it can only ever return SCHEDULED or
 * COMPLETED and the spin would never animate. The spin window is the same
 * spinDurationMs the draft reel uses, so both surfaces feel identical.
 */
export function derivePunishmentStatus(input: {
  now: Date;
  revealedAt: Date;
  config?: RevealConfig;
}): PunishmentStatus {
  const { now, revealedAt } = input;
  const config = input.config ?? getRevealConfig();
  if (now.getTime() >= revealedAt.getTime()) return "COMPLETED";
  if (now >= pickSpinStartAt(revealedAt, config)) return "SPINNING";
  return "SCHEDULED";
}

/**
 * When a wheel's single reveal lands. Reuses the draft's first-pick delay so a
 * wheel scheduled for 8pm behaves like a draft scheduled for 8pm: a beat of
 * "everyone is here" before anything happens.
 */
export function punishmentRevealedAt(
  scheduledFor: Date,
  config: RevealConfig = getRevealConfig(),
): Date {
  return new Date(scheduledFor.getTime() + config.firstPickDelayMs);
}

export function deriveStatus(input: {
  now: Date;
  picks: { revealedAt: Date }[];
}): DerivedStatus {
  const { now, picks } = input;
  if (picks.length === 0) return "SCHEDULED";
  let firstMs = Infinity;
  let lastMs = -Infinity;
  for (const p of picks) {
    const t = p.revealedAt.getTime();
    if (t < firstMs) firstMs = t;
    if (t > lastMs) lastMs = t;
  }
  if (now.getTime() < firstMs) return "SCHEDULED";
  if (now.getTime() >= lastMs) return "COMPLETED";
  return "DRAWING";
}
