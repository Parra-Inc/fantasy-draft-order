export type RevealConfig = {
  firstPickDelayMs: number;
  pickIntervalMs: number;
  spinDurationMs: number;
};

export function getRevealConfig(): RevealConfig {
  const firstPickDelayMs = Number(process.env.DRAFT_FIRST_PICK_DELAY_MS ?? 5000);
  const pickIntervalMs = Number(process.env.DRAFT_PICK_INTERVAL_MS ?? 7000);
  const spinDurationMs = Number(process.env.DRAFT_SPIN_DURATION_MS ?? 4000);
  return {
    firstPickDelayMs: Number.isFinite(firstPickDelayMs) ? firstPickDelayMs : 5000,
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
