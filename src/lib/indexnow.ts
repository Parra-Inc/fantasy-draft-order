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
 * that serves /<key>.txt. The Vercel project (fantasy-draft-order, team
 * parraio) has no custom domain: its only aliases are this one plus the
 * per-branch previews, and the live robots.txt / sitemap.xml both emit this
 * host. fantasydraftorder.com is a different site by a different author, so
 * submitting URLs on it would 403 (no key file) or 422 (host mismatch).
 *
 * Keep this identical to the production NEXT_PUBLIC_BASE_URL, which drives
 * canonicals, robots.ts and sitemap.ts. If a custom domain is ever attached to
 * the project, change the Vercel env var and this constant together, and make
 * sure the key file is reachable on the new origin before submitting.
 */
const PRODUCTION_SITE_URL = "https://fantasy-draft-order.vercel.app";

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
 * Notify IndexNow-participating search engines (Bing, Yandex, Naver, Seznam,
 * Yep) that URLs were added, updated, or deleted. Accepts absolute URLs or
 * site-relative paths. No-ops outside production so dev and test never ping
 * live engines, and never throws: indexing is best-effort.
 *
 * Returns true only when the engines accepted the submission, so callers can
 * tell a delivered ping from a dropped one. Prefer queueIndexNowSubmission()
 * inside request handlers: it keeps the serverless invocation alive.
 */
export async function submitToIndexNow(
  urls: string | string[],
): Promise<boolean> {
  if (env.NODE_ENV !== "production") return false;

  const urlList = (Array.isArray(urls) ? urls : [urls])
    .map((u) => (u.startsWith("http") ? u : `${siteUrl}${u}`))
    .slice(0, MAX_URLS_PER_SUBMISSION);
  if (urlList.length === 0) return false;

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

    if (!res.ok && res.status !== 202) {
      console.error(`IndexNow submission failed: ${res.status}`);
      return false;
    }
    return true;
  } catch (error) {
    // Never let an indexing ping break the request that triggered it
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
 * Fire-and-forget submission for request handlers and server components: safe
 * to call without awaiting, never blocks, never throws.
 */
export function queueIndexNowSubmission(urls: string | string[]): void {
  runAfterResponse(async () => {
    await submitToIndexNow(urls);
  });
}

/**
 * A draft page is noindex until its last pick is revealed, and there are no
 * background jobs here (passage of time is the trigger), so the first server
 * code to observe the transition is whatever renders or serves the draft. Both
 * of those paths call this, so it dedupes per instance and ignores drafts that
 * finished long ago; only a freshly indexable URL is worth a submission.
 *
 * Known tradeoff: a draft that completes with nobody polling and no visitor
 * within RECENTLY_COMPLETED_WINDOW_MS never gets submitted at all, and reaches
 * engines only through sitemap.xml (which lists every completed draft). Closing
 * that gap needs a cron submitting drafts whose last pick was revealed since
 * the previous run; this app has no cron today, so the window is the tradeoff.
 */
const RECENTLY_COMPLETED_WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_TRACKED_SLUGS = 5_000;
const submittedDraftSlugs = new Set<string>();

export function submitCompletedDraft(slug: string, completedAt: Date): void {
  // Same guard as submitToIndexNow, repeated here so dev and test never queue
  // after() work on every poll.
  if (env.NODE_ENV !== "production") return;
  if (Date.now() - completedAt.getTime() > RECENTLY_COMPLETED_WINDOW_MS) return;
  if (submittedDraftSlugs.has(slug)) return;
  if (submittedDraftSlugs.size >= MAX_TRACKED_SLUGS) {
    submittedDraftSlugs.clear();
  }

  // Claimed before the request goes out so 500ms polling cannot open a second
  // submission for the same draft, then released again if the submission was
  // not accepted, so the next observer of this draft retries it.
  submittedDraftSlugs.add(slug);

  runAfterResponse(async () => {
    const submitted = await submitToIndexNow(`/d/${slug}`);
    if (!submitted) submittedDraftSlugs.delete(slug);
  });
}
