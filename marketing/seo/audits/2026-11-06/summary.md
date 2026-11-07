# SEO + AEO Audit: fantasyfootballdraftorder.com (rank 5)

2026-11-06 - triage depth, read + persist only (no code changes, git, or deploys).

## Verdict

Clean technical and AEO foundation: 0 crawl errors, LCP 0.92s, strong JSON-LD, llms.txt/llms-full.txt, and robots/AI-crawler policy all pass, with no indexability contradiction anywhere. The entire opportunity is on-page: the `/league-id` cluster earns thousands of impressions a month at Google positions 8-10 (and a few at 5) but records **zero Google clicks**, while the identical pages convert fine on Bing at positions 3-5. Start by resolving the hub-vs-child ESPN cannibalization, then make the child pages answer-first; the hard ceiling is a near-empty backlink profile.

## Numbers

| Metric | Value |
| --- | --- |
| Crawl coverage | 38 / 38 pages |
| Crawl errors / warnings | 0 / 5 (all `page.orphan`, `/p/*` wheels) |
| GSC clicks / impressions (28d) | 63 / 12,145 (CTR 0.52%, avg pos 9.35) |
| Striking-distance query/page pairs | 50 (nearly all 0 clicks) |
| Low-CTR >=50 impr queries | 15, all 0 clicks |
| Cannibalization queries | 2 (`/league-id` vs `/league-id/espn`) |
| Worst LCP | 0.92s mobile lab (CrUX field empty) - not a constraint |
| Standard pass / partial / fail / n-a / manual | 25 / 4 / 5 / 6 / 6 |
| Backlinks | Bing TotalPages 0; GSC InLinks 3 (internal) |

## Standard (non-pass rows by section)

| Sec | ID | Status | Evidence |
| --- | --- | --- | --- |
| A | A4 | partial | Descriptions 150-160 on 10/12; min 123. 7 pages short (text-length.mjs). |
| B | B5 | manual | No HTML sitemap page (optional at 38 pages). |
| B | B9 | fail | No IndexNow step in deploy workflow; nightly indexnow-sync sweep only (by design). |
| C | C9 | manual | HowTo on `/league-id/espn` - genuine step-by-step, OK. |
| D | D1 | partial | og:image on 12/12 but only 2 distinct across 6 families; marketing pages share `/opengraph-image`. |
| E | E5 | partial | `/p/amber-tiger-69j9/card` linked + indexable but not in sitemap (share-image route). |
| F | F1/F2 | pass / n-a | lang=en on all; single-language, no hreflang. |
| G | G1 | fail | Homepage links 2/3 families, not `/p` (by design). |
| G | G2 | fail | 3/4 family pages link hub+sibling; thin on `/p` (by design). |
| H | H3 | manual | No `/authors`; Article has author but no author entity page. |
| H | H4 | manual | No `/about`, `/methodology`, `/editorial-policy` (methodology covered by /why-fair + /how-it-works). |
| I | I2 | partial | Hashed CSS served `max-age=0, must-revalidate`; HSTS + X-Content-Type-Options present. |
| J | J1/J4 | n-a / pass | No own iOS app (App Store links are cross-promo, carry ct). |
| K | K1 | pass | GA4 G-0T390QPZ9M on 12/12 with consent default. |
| L | L1 | manual | No prebuild SEO gate (`pnpm check` is the pre-push gate). |
| M | M1/M2 | fail | No docs/seo/growth-plan.md; 0 page plans. M4 pass (4 dated audits). |

## All findings

| Finding | Pages | Sources | Verified live | Bucket |
| --- | --- | --- | --- | --- |
| ESPN query cannibalization (hub + child) | /league-id, /league-id/espn | GSC cannibalization/striking/low_ctr + repo read | Yes | Fix now |
| Pos-5-to-10 league-id cluster, 0 Google clicks | /league-id/*, /fantasy-basketball | GSC striking/low_ctr/low_hanging + Bing page_stats | Yes | Fix now |
| No /about maker + author trust entity | (new) /about | standard H3/H4 + ai-search.md | Yes | Fix now |
| Near-zero backlinks cap the cluster | sitewide | Bing link_counts + GSC inspection + M1/M2 | Yes | Batch |
| 7 meta descriptions < 150 chars | mfl, fantasy-football, how-it-works, why-fair, league-id/fleaflicker, commissioner-guide | standard A4 + text-length.mjs | Yes | Batch |
| Shared OG image across marketing pages | all marketing | standard D1 | Yes | Batch |
| Hashed assets not immutably cached | sitewide assets | standard I2 | Yes | Batch |
| 5 orphan `/p/*` wheel pages | /p/* | crawl page.orphan + G1/G2 | Yes | Skipped (by design) |

## Fix now

1. **Kill the ESPN cannibalization** - `src/app/(marketing)/league-id/page.tsx`. Demote the hub hero's ESPN answer (lines 62-73) to a generic one-liner that links to `/league-id/espn`, and strip ESPN specifics from `HUB_FAQS`, so one page concentrates the signal. Evidence: GSC cannibalization 242 + 183 impr, 0 clicks across two ESPN queries.
2. **Answer-first child pages** - `src/lib/seo/league-id-guides.ts` (+ `src/components/marketing/league-id-guide.tsx`). Open each child intro with the literal answer and ID shape so Google can lift a snippet; keep exact-query titles. Evidence: `/league-id/sleeper` pos 5.29 / 162 impr / 0 clicks on Google but earns clicks on Bing at pos 3-5.
3. **Add `/about` trust entity** - `src/app/(marketing)/about/page.tsx` (new) + `src/lib/seo/jsonld.ts`. Answer-first page naming the maintainer and linking the randomizer at its commit SHA, with Organization/Person JSON-LD. Evidence: standard H3/H4.

## Batch

- **Backlink/growth plan** - `docs/seo/growth-plan.md` + `docs/seo/page-plans/` (clears M1/M2). Not code: Reddit/platform-help outreach that cites the league-id pages. This is the ceiling on ranks 1-2 paying off (Bing TotalPages 0, GSC InLinks 3).
- **7 short meta descriptions to 150-160** - `src/lib/seo/league-id-guides.ts` and the `/mfl`, `/fantasy-football`, `/how-it-works`, `/why-fair` page files (standard A4).
- **Immutable caching on `/_next/static/*`** - `open-next.config.ts` / `custom-worker.ts`; verify with `wrangler dev` (standard I2).
- **Per-route OG images** - `src/app/opengraph-image.tsx` + family roots; mind the Satori multi-child `display` gotcha (standard D1).

## Deliberately skipped

- **`page.orphan` + G1/G2 on 5 `/p/*` wheels** - by design; user-generated, noindex until the result lands, intentionally sitemap-only (per CLAUDE.md the product is per-league, not a directory). count 5 == pages 5 = 5 distinct user pages, not a template bug.
- **B9 (no IndexNow deploy step)** - by design; runtime IndexNow was removed after 490 x 429 errors; relies on the registered nightly indexnow-sync sweep (B11 pass) + manual `pnpm indexnow:submit`.
- **E5 (`/p/.../card` not in sitemap)** - share-image (PNG) route, correctly excluded.
- **Brand position 39.5** - "fantasy football draft order" is a generic head term conflated with the brand label, not an indexing problem.
- **site_health "critical" -50% WoW clicks** - noise at 6-vs-12 clicks / an Oct-20 spike; 28d position steady.
- **Page speed** - LCP 0.92s, CLS 0, TBT 11ms, perf 100.
- **AEO measurement loop, third-party listing claims, Skimmer/Open-Assets name disambiguation** - user-punted per task.
- **Accessibility 95 (lab)** - not an SEO ranking factor; out of scope.

## Coverage gaps

CrUX field CWV empty (low traffic, lab-only); Bing `get_rank_and_traffic_stats` failed on an MCP output-validation bug (no site-level Bing totals via the wrapper); Bing-via-search-console failed because the GSC property is `sc-domain` (covered instead by the bing-webmaster MCP, which returned no crawl issues); no Google SERP-feature inspection available to see exactly what captures the click above the pos-5 Sleeper result; the standard graded a 12-of-38 page sample while the crawler audited all 38.
