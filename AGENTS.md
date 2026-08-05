<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# This does not run on Node, and the database is not Postgres

The app is a **Cloudflare Worker** (OpenNext) backed by **Cloudflare D1** (SQLite). Two
consequences bite constantly, so check them before writing anything that touches data or
files:

- **No interactive transactions.** `prisma.$transaction(async (tx) => …)` silently is not
  a thing on D1. Compute everything up front and pass an array —
  `prisma.$transaction([a, b, c])` — which becomes one atomic batch. Parents before
  children: D1 enforces foreign keys.
- **No filesystem.** `node:fs` against `public/` throws in the worker. `public/` is served
  by the ASSETS binding; use `loadLogoDataUri()` in `src/lib/og-logo.ts`.

Also: the D1 binding only exists inside a request, so every route that reads the database
must be `force-dynamic`; SQLite has no enums (see `src/lib/db-enums.ts`) and no
`gen_random_uuid()` (see `src/lib/ids.ts`). Full detail in CLAUDE.md.

## IndexNow

This project uses IndexNow to ping participating search engines (Bing, Yandex, Naver, Seznam, Yep) the moment a public URL changes. Google does not participate, so the sitemap still matters for it.

- Key: `INDEXNOW_KEY` in `src/lib/indexnow.ts`, key file at `public/0d280bb4c994c621118dcd0a691c7c8d.txt`. The key is public by design and committed on purpose; the file and the constant must stay byte-identical or every submission 403s. Never move it to env-only.
- Host: submissions go out on `PRODUCTION_SITE_URL` = `https://fantasyfootballdraftorder.com`, the Cloudflare Worker's custom domain and the only origin that serves the key file (OpenNext serves `public/` through the ASSETS binding). It must stay identical to the production `NEXT_PUBLIC_BASE_URL` behind canonicals, `robots.ts` and `sitemap.ts`. The old `fantasy-draft-order.vercel.app` origin is now only a permanent redirect to this host: never submit it again. If the domain ever changes, update the wrangler var, `PRODUCTION_SITE_URL` in `src/lib/indexnow.ts`, and the default in `scripts/indexnow-submit.mjs` together, and confirm `/<key>.txt` resolves on the new origin before submitting anything. Note that `fantasydraftorder.com` (no "football") is an unrelated site by a different author: never submit URLs on it.

When making changes that add, update, delete, or rename any publicly indexable page:

- Call `queueIndexNowSubmission(url)` in the code path that publishes the change. It wraps the ping in `after()` so the serverless invocation stays alive until the POST settles, and it never blocks or throws. (`submitToIndexNow(url)` is the awaitable form and returns whether the engines accepted it.)
- On slug renames, submit both the old and new URLs.
- On deletions, submit the deleted URL so engines drop it.
- Never submit unchanged URLs or the full sitemap; submissions count toward crawl quota.
- New page types (routes, models with public pages) must wire their publish/update/delete flows into the helper before shipping.

Already wired:

- **Draw pages are NOT pinged at runtime, on purpose.** `/d/<slug>` and `/p/<slug>` are `noindex` until the result lands, and the transition to indexable is driven by the passage of time, not by a publish request. There used to be a `submitCompletedDraft` / `submitCompletedWheel` ping on `GET /api/drafts/[slug]/state`, `GET /api/punishments/[slug]/state` and both page renders, deduped by a module-level `Set`. That `Set` lives in one Worker isolate, of which there are many and which are recycled constantly, and it released the path again whenever a submission failed, so 500ms polling from every viewer re-fired the same single-URL POST until the submitter was rate limited: 490 logged `IndexNow submission failed: 429` errors in a week, with a 0% success rate (IndexNow throttles the shared Cloudflare Workers egress, so it was never going to work from here). Completed draws now reach engines through `sitemap.xml`, which lists every one with its real `lastModified`, and through the `indexnow-sync` worker, which has `fantasyfootballdraftorder-com` registered and sweeps that sitemap daily with batching, pacing and service-wide backoff. **Never reintroduce a submission on a read path.**
- Static pages (landing pages, guides, `/`, `/new`) ship with a deploy and have no runtime publish event. After deploying a new or rewritten one, submit it manually: `pnpm indexnow:submit /guides/my-new-guide`. The same script takes `--sitemap` for a one-time backfill and `--dry-run` to print the payload.
