import { z } from "zod";

/** Every placement passes its own source so signups can be attributed. */
export const NEWSLETTER_SOURCES = ["footer", "home"] as const;
export type NewsletterSource = (typeof NEWSLETTER_SOURCES)[number];

export const subscribeBodySchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  source: z.string().trim().max(60).optional(),
  // Honeypot: real visitors never see this field, so any value means a bot.
  website: z.string().max(500).optional(),
});

export const unsubscribeBodySchema = z.object({
  token: z.string().trim().min(1).max(64),
});

/**
 * Per-isolate speed bump. Workers spread traffic over many isolates, so the
 * real limit is the zone WAF rule in program/index.ts.
 */
const hits = new Map<string, { count: number; resetAt: number }>();

export function allowRequest(key: string, limit = 5, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.resetAt <= now) {
    if (hits.size > 5_000) hits.clear();
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count += 1;
  return entry.count <= limit;
}
