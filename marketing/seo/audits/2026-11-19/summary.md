# SEO audit: fantasyfootballdraftorder.com
2026-11-19 · rank 5 · 38/38 pages audited (100% coverage, fresh recheck) · GSC window 2026-10-20 to 2026-11-16

## Verdict

Technically clean and fast: 0 crawl errors, no indexability contradictions,
LCP about 1 second on every template, Google and Bing sitemaps healthy. The
site is visible but unclicked: 87% of impressions are league ID and platform
how-to queries at positions 6 to 10 with near 0% CTR, while the product's own
terms ("draft order generator", 68 variants) average position 72 and
punishments average 61. The fixes that matter most are already merged but
**not deployed** (PRs #53 and #54); deploy first. The ESPN cannibalization
flagged on Nov 6 is resolving on its own after PR #49.

## Numbers

| | Value | vs last audit (2026-11-06) |
| --- | --- | --- |
| Crawl errors / warnings | 0 / 5 | unchanged |
| Crawl notices | 38 (36 heading.skip, 2 content.thin) | first count recorded |
| Clicks / impressions (28d, Google) | 31 / 9,193 (CTR 0.34%, pos 9.73) | 63 / 12,145: -51% clicks, seasonal |
| Striking-distance pairs (tool cap 50) | 50, all 0 clicks | unchanged |
| Low-CTR queries (>= 50 impr) | 16, all 0 clicks | +1 |
| Cannibalization queries | 3 (ESPN, hub vs guide) | +1, but share is shifting (below) |
| Lost queries | 0 | unchanged |
| Worst LCP (mobile lab) | 4.63s `/p/amber-tiger-69j9` (median of 3); marketing worst 1.79s `/yahoo` | 0.92s (wheels not sampled then) |
| Standard (pass / partial / fail) | 25 / 3 / 6 before fixes | 25 / 4 / 5 |
| Bing inbound links | 0 | unchanged |

## Standard

| Section | Result | Gaps |
| --- | --- | --- |
| A. Site foundation | fail | A4 fail: 8 marketing descriptions 123 to 148 (sitewide text-length.mjs, 12/38 outside incl. 4 user-generated `/p/*`). **Fixed in this PR.** |
| B. Crawl and index | fail | B9 fail (no IndexNow deploy step; by design, nightly indexnow-sync); B5 manual (no HTML sitemap) |
| C. Structured data | pass | C9 manual (HowTo on `/league-id/espn` is a real procedure; now also on `/sleeper` via PR #54) |
| D. Social | partial | D1 partial (2 distinct OG images across 6 families) |
| E. Coverage | partial | E5 partial (`/p/.../card` PNG route linked but not in sitemap; correct) |
| F. Language | pass | single language |
| G. Internal linking | fail | G1/G2 fail only on `/p` (by design) |
| H. Trust | manual | H3/H4: no `/about`, no author page |
| I. Headers | partial | I2 partial (hashed CSS `max-age=0, must-revalidate`) |
| J. App | n/a | no own app |
| K. Analytics | pass | |
| L. Gates | manual | L1 no prebuild gate (`pnpm check` covers lengths via `metadata-length.test.ts`) |
| M. Operating loop | fail | M1 fail (**growth plan added in this PR**: `docs/seo/growth-plan-2026-11.md`); M2 fail (no page plans) |
| N. Off-site | manual | not started; 0 inbound links |

## All findings

| Finding | Pages | Sources | Verified live | Bucket |
| --- | --- | --- | --- | --- |
| PRs #53 and #54 merged but not deployed (old titles live, `/fantasy-football-punishments/database` 404) | 4 + 1 new | `gh run list`, curl | yes | Fix now |
| League ID / platform cluster at pos 6-10, 0% CTR | `/league-id/*`, `/sleeper` | GSC striking, low_ctr, low_hanging | yes | Fix now (= deploy #54) |
| Head term "draft order generator" pos 72; 3 pages share the target | `/`, `/fantasy-football`, `/new` | gap report section 2, page titles/H1 | yes | Propose (growth plan cat. 4) |
| Punishments pos 61 across 163 queries | `/fantasy-football-punishments` | gap report, Bing kw | yes | Propose (deploy #53, tag pages) |
| 8 marketing descriptions < 150 | listed in A4 | standard A4, text-length.mjs (all 38 URLs) | yes | **Fixed (this PR)** |
| heading.skip on 36/38 pages (footer h4 after h2; commissioner h1 -> h3) | 36 | crawl notice | yes | **Fixed (this PR)** |
| No growth plan (M1) | repo | standard M1 | yes | **Fixed (this PR)** |
| ESPN hub vs guide cannibalization | `/league-id`, `/league-id/espn` | GSC cannibalization + date split | yes | Watch: guide share 18% -> 40% after #49 |
| Wheel page `/p/*` LCP 4.63s (median of 3), score 82 | `/p/*` | lighthouse x3 | yes | Batch (UX; 1 search impression in 16 months) |
| Hashed CSS not immutable | sitewide assets | standard I2 | yes | Batch |
| One shared OG card | marketing pages | standard D1 | yes | Batch |
| No page plans (M2) | repo | standard M2 | yes | Batch |
| 0 inbound links | sitewide | Bing link counts | yes | Batch (off-site, growth plan) |
| 5 orphan `/p/*` wheels | 5 | crawl page.orphan, G1/G2 | yes | Skipped (by design) |
| 4 short `/p/*` descriptions | 4 | text-length.mjs | yes | Skipped (user-generated) |
| content.thin on `/new`, `/punishment/new` | 2 | crawl notice | yes | Skipped (forms) |

## Fix now

1. **Deploy main.** PRs #53 and #54 (and this one once merged) are not live:
   the last Deploy run was 2026-11-18 from `feat/newsletter`. Live
   `/league-id/sleeper` still has the old title and
   `/fantasy-football-punishments/database` returns 404. Nothing in the
   striking-distance plan can move until this ships.
   - Repo: `.github/workflows/deploy.yml` (manual Deploy workflow)
   - Evidence: `gh run list`, curl of both URLs on 2026-11-19
2. **Meta descriptions** (done in this PR): `src/lib/seo/landing-pages.ts`,
   `src/lib/seo/league-id-guides.ts`, `src/lib/seo/guides.ts`,
   `src/app/(marketing)/league-id/page.tsx`. `/league-id/sleeper` (12,092
   impressions in 16 months) and `/league-id` (7,446) were both short.
   - Evidence: `text-length.json`, `standard.json` A4
3. **Heading levels** (done in this PR): `src/app/(marketing)/layout.tsx`
   footer, `src/app/(marketing)/ask-your-commissioner/page.tsx`. Verified 0
   skips on all 34 marketing pages locally.

## Batch

- Wheel page LCP 4.63s: `src/app/p/[slug]/page.tsx` + `wheel-live.tsx`; find the LCP element and render it server-side before the spin client hydrates.
- Immutable caching for `/_next/static/*` (`open-next.config.ts` /
  `custom-worker.ts`; verify with `wrangler dev`), standard I2.
- Per-family OG images (`src/app/opengraph-image.tsx` + family roots), D1.
- Page plans for the tool pages (`docs/seo/page-plans/`), M2.
- Off-site and content roadmap: `docs/seo/growth-plan-2026-11.md`.

## Deliberately skipped

- `page.orphan`, G1, G2 on `/p/*`: user-generated wheels, sitemap-only by design.
- B9: runtime IndexNow removed after 490 x 429s; nightly indexnow-sync covers it.
- E5 `/p/.../card`: a PNG share route, correctly not in the sitemap.
- Short `/p/*` descriptions: derived from each wheel's options.
- content.thin on `/new` and `/punishment/new`: form pages.
- Changing the `/league-id` hub again: the split is moving after #49; wait four weeks.
- Merging the Sleeper randomize guide into `/sleeper`: #49 gave it a separate angle on purpose.
- Brand segment pos 46: 24 impressions, generic phrasing overlaps the brand.
- Page speed on marketing templates: 21 of 22 sampled pages score 98-100, LCP 0.9-1.8s, CLS 0.

## Coverage gaps

- Live site is pre-#53/#54, so the crawl and standard graded old titles and no database page.
- Bing `get_rank_and_traffic_stats` failed (MCP output validation bug, same as Nov 6).
- Google API has no Page Indexing / Enhancements lists; `sitemaps_list` "indexed 0" is a deprecated field.
- CrUX field data unavailable (low traffic); speed is lab only.
- Keyword volumes are Bing-only and relative; no Google volume source connected.
- Bing per-page weekly stats were read but stored as a summary (`bing.json` notes).

## Topic categories

See `docs/seo/growth-plan-2026-11.md` for the full table. In short: own
**league ID lookup** and **platform draft order how-to** (87% of impressions,
already page one); grow **punishments** and **draft formats** with tools
(database, tag pages, pick-order grid); treat the **draft order generator**
head term as a links problem; maintain **draft lottery** and **other sports**;
expand into **league names** first, then a **commissioner toolkit**.

## Outcome

Fixes committed on `seo/audit-2026-11-19` (8 descriptions, heading levels,
growth plan). Verified locally: 0 heading skips on 34 marketing pages, all 8
descriptions 150 to 160, `metadata-length.test.ts` passing. **Not verified
live**: needs deploy, then `recheck` and `seo-standard.mjs` (expect A4 and M1
to pass, heading.skip to clear).
