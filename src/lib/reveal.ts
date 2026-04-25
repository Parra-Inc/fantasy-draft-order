export type RevealConfig = {
  firstPickDelayMs: number;
  pickIntervalMs: number;
};

export function getRevealConfig(): RevealConfig {
  const firstPickDelayMs = Number(process.env.DRAFT_FIRST_PICK_DELAY_MS ?? 5000);
  const pickIntervalMs = Number(process.env.DRAFT_PICK_INTERVAL_MS ?? 7000);
  return {
    firstPickDelayMs: Number.isFinite(firstPickDelayMs) ? firstPickDelayMs : 5000,
    pickIntervalMs: Number.isFinite(pickIntervalMs) ? pickIntervalMs : 7000,
  };
}

export function pickRevealedAt(
  scheduledFor: Date,
  pickIndex: number,
  config: RevealConfig = getRevealConfig(),
): Date {
  return new Date(
    scheduledFor.getTime() +
      config.firstPickDelayMs +
      pickIndex * config.pickIntervalMs,
  );
}

export type DerivedStatus = "SCHEDULED" | "DRAWING" | "COMPLETED";

export function deriveStatus(input: {
  now: Date;
  picks: { revealedAt: Date }[];
}): DerivedStatus {
  const { now, picks } = input;
  if (picks.length === 0) return "SCHEDULED";
  const first = picks[0].revealedAt;
  const last = picks[picks.length - 1].revealedAt;
  if (now < first) return "SCHEDULED";
  if (now >= last) return "COMPLETED";
  return "DRAWING";
}
