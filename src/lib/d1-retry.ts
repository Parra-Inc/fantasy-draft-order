/**
 * Retry an idempotent D1 read a few times before giving up.
 *
 * The D1 binding's session layer (D1DatabaseSessionAlwaysPrimary) throws on any
 * non-OK response from the primary, and @prisma/adapter-d1 does not retry, so a
 * single transient blip becomes a user-facing 500. On /d/[slug] and its polled
 * state endpoint that blip is amplified: every viewer of a live draw polls the
 * same read twice a second, so one D1 hiccup during a popular draw turns into a
 * cluster of simultaneous 500s (observed as several "Error in performIO" throws
 * across different slugs inside the same few milliseconds). The reads succeed on
 * their own the rest of the time, so the fix is resilience, not a query change.
 *
 * Safe here because these are pure SELECTs: re-running one returns the same rows
 * and writes nothing. Never wrap a write in this. The create path hands
 * prisma.$transaction([...]) an array, but @prisma/adapter-d1 runs those
 * statements individually (D1 has no interactive transactions), so a retry after
 * a partial write could duplicate rows.
 */
export async function withD1Retry<T>(
  read: () => Promise<T>,
  { attempts = 3, baseDelayMs = 25 }: { attempts?: number; baseDelayMs?: number } = {},
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await read();
    } catch (err) {
      lastError = err;
      if (attempt === attempts) break;
      // Linear backoff, kept well under the 500ms client poll interval so a
      // retried request still returns before the viewer fires its next poll.
      await new Promise((resolve) => setTimeout(resolve, baseDelayMs * attempt));
    }
  }
  throw lastError;
}
