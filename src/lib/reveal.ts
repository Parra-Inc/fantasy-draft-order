export type RevealConfig = {
  firstPickDelayMs: number;
  pickIntervalMs: number;
  spinDurationMs: number;
  /**
   * How long the punishment wheel's whole elimination sequence should run,
   * before it is divided by the number of eliminations and clamped. See
   * src/lib/punishment-spin.ts.
   */
  wheelSpinTargetMs: number;
};

export function getRevealConfig(): RevealConfig {
  const firstPickDelayMs = Number(
    process.env.DRAFT_FIRST_PICK_DELAY_MS ?? 5000,
  );
  const pickIntervalMs = Number(process.env.DRAFT_PICK_INTERVAL_MS ?? 7000);
  const spinDurationMs = Number(process.env.DRAFT_SPIN_DURATION_MS ?? 4000);
  const wheelSpinTargetMs = Number(
    process.env.PUNISHMENT_SPIN_WINDOW_MS ?? 12000,
  );
  return {
    firstPickDelayMs: Number.isFinite(firstPickDelayMs)
      ? firstPickDelayMs
      : 5000,
    pickIntervalMs: Number.isFinite(pickIntervalMs) ? pickIntervalMs : 7000,
    spinDurationMs: Number.isFinite(spinDurationMs) ? spinDurationMs : 4000,
    wheelSpinTargetMs: Number.isFinite(wheelSpinTargetMs)
      ? wheelSpinTargetMs
      : 12000,
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

// Punishment wheel timing (status, reveal time, elimination running order)
// lives in src/lib/punishment-spin.ts. It cannot live here: it needs the option
// count and the seeded running order, and this module is the draft's.

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
