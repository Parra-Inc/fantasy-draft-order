#!/usr/bin/env node
/**
 * Manual IndexNow submitter.
 *
 * The marketing pages, guides and landing pages in this repo are static: they
 * ship with a deploy and there is no runtime publish event to hook, so when you
 * add or meaningfully rewrite one, ping it from here after the deploy is live.
 * Draft and punishment pages (/d/<slug>, /p/<slug>) need nothing manual and are
 * deliberately NOT pinged from the app: they become indexable through the
 * passage of time rather than a publish request, so they reach engines through
 * sitemap.xml and the indexnow-sync worker that sweeps it. See the IndexNow
 * section of CLAUDE.md.
 *
 * This runs on Node from a laptop or CI, not inside the Cloudflare Worker,
 * which matters: IndexNow rate limits the submitter, and the shared Workers
 * egress addresses are throttled by api.indexnow.org.
 *
 * Usage:
 *   node scripts/indexnow-submit.mjs /guides/my-new-guide /fantasy-football
 *   node scripts/indexnow-submit.mjs --sitemap        # every URL in sitemap.xml
 *   node scripts/indexnow-submit.mjs --dry-run /guides/my-new-guide
 *   node scripts/indexnow-submit.mjs --site=https://staging.example.com /x
 *
 * Only submit URLs that actually changed. Submissions count against crawl
 * quota, so --sitemap is for a one-time backfill, not for every deploy.
 *
 * Before sending, the script confirms <site>/<key>.txt returns the key and
 * refuses to submit otherwise, since a wrong host makes every submission 403.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
// Must match INDEXNOW_KEY in src/lib/indexnow.ts and public/<key>.txt.
const INDEXNOW_KEY = "0d280bb4c994c621118dcd0a691c7c8d";
// The origin this app is actually served from (see PRODUCTION_SITE_URL in
// src/lib/indexnow.ts). Node does not read .env files, so this default is what
// every plain `pnpm indexnow:submit <path>` uses; it has to be the real host.
const PRODUCTION_SITE_URL = "https://fantasyfootballdraftorder.com";
const MAX_URLS_PER_SUBMISSION = 10_000;

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

function fail(message) {
  console.error(message);
  process.exit(1);
}

function assertKeyFileMatches() {
  const keyFile = join(repoRoot, "public", `${INDEXNOW_KEY}.txt`);
  let contents;
  try {
    contents = readFileSync(keyFile, "utf8");
  } catch {
    fail(`Missing key file: ${keyFile}`);
  }
  if (contents !== INDEXNOW_KEY) {
    fail(
      `Key file ${keyFile} does not match INDEXNOW_KEY exactly. ` +
        "Every submission would 403 until they are byte-identical.",
    );
  }
}

/**
 * The engines fetch <site>/<key>.txt to authorize a submission, so if that does
 * not return the key, every URL in the payload is wasted (403) and the host is
 * almost certainly wrong. Check it before sending anything.
 */
async function assertKeyServedAt(site, { hardFail }) {
  const keyUrl = `${site}/${INDEXNOW_KEY}.txt`;
  let problem;
  try {
    const res = await fetch(keyUrl);
    if (!res.ok) {
      problem = `${keyUrl} returned ${res.status}`;
    } else {
      const body = (await res.text()).trim();
      if (body !== INDEXNOW_KEY) {
        problem = `${keyUrl} did not return the key`;
      }
    }
  } catch (error) {
    problem = `could not fetch ${keyUrl}: ${error.message}`;
  }

  if (!problem) return;
  const message =
    `${problem}. IndexNow would reject this submission with 403. ` +
    `Deploy the key file to ${site} first, or pass --site=<origin> for the ` +
    "origin that actually serves this app.";
  if (hardFail) fail(message);
  console.warn(`[warning] ${message}`);
}

async function urlsFromSitemap(site) {
  const res = await fetch(`${site}/sitemap.xml`);
  if (!res.ok) fail(`Could not fetch ${site}/sitemap.xml: ${res.status}`);
  const xml = await res.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const useSitemap = args.includes("--sitemap");
  const siteArg = args.find((a) => a.startsWith("--site="));
  const site = (
    siteArg?.slice("--site=".length) ||
    (process.env.NEXT_PUBLIC_BASE_URL?.startsWith("https://")
      ? process.env.NEXT_PUBLIC_BASE_URL
      : PRODUCTION_SITE_URL)
  ).replace(/\/$/, "");

  assertKeyFileMatches();
  // Hard failure for a real submission; a warning under --dry-run so the
  // payload can still be inspected before the key file is deployed.
  await assertKeyServedAt(site, { hardFail: !dryRun });

  const positional = args.filter((a) => !a.startsWith("--"));
  const urlList = (useSitemap ? await urlsFromSitemap(site) : positional)
    .map((u) =>
      u.startsWith("http") ? u : `${site}${u.startsWith("/") ? "" : "/"}${u}`,
    )
    .slice(0, MAX_URLS_PER_SUBMISSION);

  if (urlList.length === 0) {
    fail("Nothing to submit. Pass URLs or paths, or use --sitemap.");
  }

  const body = {
    host: new URL(site).host,
    key: INDEXNOW_KEY,
    urlList,
  };

  if (dryRun) {
    console.log(`[dry-run] POST ${INDEXNOW_ENDPOINT}`);
    console.log(JSON.stringify(body, null, 2));
    return;
  }

  const res = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  });

  console.log(`IndexNow responded ${res.status} for ${urlList.length} URL(s)`);
  if (!res.ok && res.status !== 202) {
    fail(await res.text().catch(() => "submission failed"));
  }
}

await main();
