import { after } from "next/server";
import { env } from "@/lib/env";

const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

/**
 * Public by design: served at /<key>.txt so search engines can verify domain
 * ownership. Committed on purpose (not env-only) because a missing production
 * variable would silently disable indexing, and this constant must stay
 * byte-identical to public/0d280bb4c994c621118dcd0a691c7c8d.txt: any mismatch
 * makes every submission return 403.
 */
export const INDEXNOW_KEY = "0d280bb4c994c621118dcd0a691c7c8d";

/**
 * The origin this app is actually served from, and therefore the only origin
 * that serves /<key>.txt. This is the Cloudflare Worker's custom domain
 * (wrangler.jsonc `routes`), which OpenNext serves public/ from through the
 * ASSETS binding.
 *
 * The old origin, fantasy-draft-order.vercel.app, still exists but only as a
 * permanent redirect to this host (see the redirect in next.config.ts). Never
 * submit it again. Note also that fantasydraftorder.com (no "football") is an
 * unrelated site by a different author: never submit URLs on it either.
 *
 * Keep this identical to the production NEXT_PUBLIC_BASE_URL, which drives
 * canonicals, robots.ts and sitemap.ts. If the domain ever changes again,
 * update the wrangler var, this constant, and the default in
 * scripts/indexnow-submit.mjs together, after confirming the key file is
 * reachable on the new origin.
 */
const PRODUCTION_SITE_URL = "https://fantasyfootballdraftorder.com";

/**
 * The app's canonical URL is NEXT_PUBLIC_BASE_URL (same source as sitemap.ts,
 * robots.ts and seo/metadata.ts), but it points at localhost in dev, so fall
 * back to the production origin rather than submitting a host IndexNow rejects.
 */
const siteUrl = (
  env.NEXT_PUBLIC_BASE_URL.startsWith("https://")
    ? env.NEXT_PUBLIC_BASE_URL
    : PRODUCTION_SITE_URL
).replace(/\/$/, "");

const MAX_URLS_PER_SUBMISSION = 10_000;

/**
 * Cooldown after a 429, widening with each consecutive strike: 5m, 15m, 45m,
 * 2h, 4h.
 *
 * IndexNow rate-limits the SUBMITTER, not the host, and it limits the shared
 * Cloudflare Workers egress addresses that every request from this app leaves
 * through. Retrying a throttled endpoint therefore does nothing except deepen
 * the throttle for us and for every other worker sharing that egress, which is
 * how 490 "IndexNow submission failed: 429" errors were logged in a week, and
 * how the indexnow-sync worker started seeing 429s on the same host. Any
 * rejection has to buy silence, not another attempt.
 */
const BACKOFF_MS = [5, 15, 45, 120, 240].map((minutes) => minutes * 60_000);
const MAX_COOLDOWN_MS = BACKOFF_MS[BACKOFF_MS.length - 1];

let cooldownUntil = 0;
let strikes = 0;

/** Milliseconds still to wait, or 0 when clear to submit. */
function cooldownRemainingMs(): number {
  const remaining = cooldownUntil - Date.now();
  return remaining > 0 ? remaining : 0;
}

/**
 * Records a rejection and opens the cooldown. A `Retry-After` wins over the
 * backoff schedule when the endpoint sends one: a server saying when to come
 * back beats any guess.
 */
function startCooldown(retryAfterHeader: string | null): number {
  strikes = Math.min(strikes + 1, BACKOFF_MS.length);
  const retryAfterSeconds = Number(retryAfterHeader);
  const backoff =
    Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
      ? Math.min(retryAfterSeconds * 1_000, MAX_COOLDOWN_MS)
      : BACKOFF_MS[strikes - 1];
  cooldownUntil = Date.now() + backoff;
  return backoff;
}

/**
 * Notify IndexNow-participating search engines (Bing, Yandex, Naver, Seznam,
 * Yep) that URLs were added, updated, or deleted. Accepts absolute URLs or
 * site-relative paths, and sends the whole list as ONE request: the protocol
 * takes up to 10,000 URLs per submission and one request per URL is what gets
 * a submitter throttled. No-ops outside production so dev and test never ping
 * live engines, and never throws: indexing is best-effort.
 *
 * Returns true only when the engines accepted the submission, so callers can
 * tell a delivered ping from a dropped one. Prefer queueIndexNowSubmission()
 * inside request handlers: it keeps the serverless invocation alive and
 * coalesces everything queued in the same invocation into a single request.
 *
 * Call this ONLY from a code path that publishes a genuine content change.
 * Never from a page render or a polled API route: those fire on every visitor
 * and every poll, which is orders of magnitude more often than the content
 * actually changes.
 */
export async function submitToIndexNow(
  urls: string | string[],
): Promise<boolean> {
  if (env.NODE_ENV !== "production") return false;

  const urlList = (Array.isArray(urls) ? urls : [urls])
    .map((u) => (u.startsWith("http") ? u : `${siteUrl}${u}`))
    .slice(0, MAX_URLS_PER_SUBMISSION);
  if (urlList.length === 0) return false;

  const waitMs = cooldownRemainingMs();
  if (waitMs > 0) {
    console.warn(
      `IndexNow: holding ${urlList.length} URL(s), rate limited for another ${Math.ceil(waitMs / 1_000)}s`,
    );
    return false;
  }

  try {
    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: new URL(siteUrl).host,
        key: INDEXNOW_KEY,
        urlList,
      }),
    });

    // A throttle is a "come back later", not a fault: warn, back off, and let
    // the caller (and sitemap.xml, which every engine still reads) carry it.
    if (res.status === 429) {
      const backoff = startCooldown(res.headers.get("retry-after"));
      console.warn(
        `IndexNow: rate limited (429) submitting ${urlList.length} URL(s); pausing submissions for ${Math.round(backoff / 1_000)}s`,
      );
      return false;
    }

    if (!res.ok && res.status !== 202) {
      // 403/422 are configuration faults (key file, host mismatch) and stay at
      // error level, but they must not be retried in a loop either.
      startCooldown(null);
      console.error(`IndexNow submission failed: ${res.status}`);
      return false;
    }

    strikes = 0;
    cooldownUntil = 0;
    return true;
  } catch (error) {
    // Never let an indexing ping break the request that triggered it
    startCooldown(null);
    console.error("IndexNow submission error:", error);
    return false;
  }
}

/**
 * Run best-effort work without blocking the response. after() keeps the
 * serverless invocation alive until it settles; a bare unawaited fetch can be
 * dropped the moment the response is returned, because the instance may be
 * frozen or torn down. Falls back to plain fire-and-forget when there is no
 * request scope (a script importing this module), and never throws.
 */
function runAfterResponse(work: () => Promise<void>): void {
  try {
    after(work);
  } catch {
    void work();
  }
}

/**
 * URLs queued but not yet sent, so several publishes in one invocation (or
 * while a cooldown is open) leave as one request instead of one each.
 */
const pendingUrls = new Set<string>();
let flushScheduled = false;

/**
 * Fire-and-forget submission for request handlers and server components: safe
 * to call without awaiting, never blocks, never throws.
 *
 * Batches: every URL queued before the flush runs goes out in a single POST,
 * and a batch held back by the cooldown stays queued for the next publish
 * rather than being retried immediately.
 */
export function queueIndexNowSubmission(urls: string | string[]): void {
  for (const url of Array.isArray(urls) ? urls : [urls]) {
    if (pendingUrls.size >= MAX_URLS_PER_SUBMISSION) break;
    pendingUrls.add(url);
  }
  if (flushScheduled || pendingUrls.size === 0) return;

  flushScheduled = true;
  runAfterResponse(async () => {
    flushScheduled = false;
    // Still throttled: keep the URLs queued so the next publish sends them
    // together, instead of spending a request to be rejected again.
    if (cooldownRemainingMs() > 0 || pendingUrls.size === 0) return;

    const batch = [...pendingUrls];
    pendingUrls.clear();
    const submitted = await submitToIndexNow(batch);
    // Best-effort: a dropped batch is picked up by sitemap.xml, which the
    // indexnow-sync worker sweeps daily for this host.
    if (!submitted) {
      for (const url of batch) {
        if (pendingUrls.size >= MAX_URLS_PER_SUBMISSION) break;
        pendingUrls.add(url);
      }
    }
  });
}
