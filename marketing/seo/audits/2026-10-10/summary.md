# SEO audit: fantasyfootballdraftorder.com
2026-10-10 · rank 5 · 38/38 pages audited (100% coverage) · GSC window 2026-09-10 to 2026-10-07

## Verdict
Technically clean: 0 errors, no indexability contradictions, all inspected pages indexed with matching canonicals. The real loss is CTR on the league-id guides: about 600 impressions/28d at positions 6 to 10 earn 1 click, and ESPN queries land on the /league-id hub instead of /league-id/espn. Off-season decay (clicks down 31% week over week, 7-day) is expected for fantasy football and is not a site defect. Fix the league-id snippets first.

## Numbers
| | Value | vs last audit (2026-08-17) |
| --- | --- | --- |
| Errors / warnings (crawler) | 0 / 21 | 0 / +5 (crawler stale, see below) |
| Clicks (28d, Google) | 41 (8139 impr, pos 10.4) | was 82 |
| Striking-distance rows | 50 | |
| Worst LCP (mobile, median of 3) | 3.06s /new | was 4.24s /draft-lottery |

## Fix now
1. **League-id snippets earn 0 clicks at positions 6 to 10** (low_ctr: "how to find sleeper league id" 189 impr pos 6.4, "where to find sleeper league id" 126 impr pos 7.4, "how to find league id on sleeper" 80 impr, 0 clicks each)
   - Repo: `src/lib/seo/league-id-guides.ts`
   - Fix: lead the Sleeper title and description with the query wording ("How to find your Sleeper league ID") and the answer in the first clause.
   - Evidence: `search-console.json` low_ctr / low_hanging_fruit
2. **ESPN league-id queries rank the hub, not the ESPN page** (/league-id: "how to find espn league id" 103 impr pos 9.8, plus ~15 ESPN variants, 0 clicks; /league-id/espn returns 200 and is in the sitemap)
   - Repo: `src/app/(marketing)/league-id/page.tsx` (title is 61 chars and generic) plus `src/lib/seo/league-id-guides.ts`
   - Fix: shorten the hub title, give the hub a prominent ESPN answer with an "ESPN league ID" anchor to /league-id/espn, strengthen the ESPN guide title.
   - Evidence: striking_distance rows
3. **Lost query "sleeper randomize draft order"** on /sleeper (9 clicks, 245 impr, pos 4.9 to 0 impressions)
   - Repo: `src/lib/seo/landing-pages.ts` (slug "sleeper")
   - Fix: check whether the recent title rewrite ("Sleeper Draft Order Randomizer: Drawn Live, Free (2026)") dropped the "randomize" phrasing; restore it in H1 / description. Could also be season decay, verify with analytics_compare before editing.
   - Evidence: `search-console.json` lost_queries
4. **title.too.long, 6 pages still over 60 (live verified)**
   - Repo: `src/lib/seo/guides.ts` (snake-vs-straight 66, weighted-vs-random 64, commissioner guide 63), `src/app/(marketing)/fantasy-football-punishments/page.tsx` (66), `src/app/punishment/new/page.tsx` (63), `src/app/(marketing)/league-id/page.tsx` (61)
   - Fix: trim each under 60.
   - Evidence: `crawl.json` title.too.long plus live curl

## Batch
- Breadcrumb JSON-LD items show as "Unnamed item" in URL Inspection on /sleeper, /league-id, /league-id/sleeper. Unlocated (breadcrumb component not traced); add `name` to each ListItem.
- Register the sitemap in Bing Webmaster (Bing sitemaps_list empty; Bing still indexes 43 pages).

## Deliberately skipped
- 6 of 12 title.too.long findings are stale: those pages were already shortened (recheck had not landed at read time).
- link.broken.external (4): all HTTP 429 from apps.apple.com rate limiting, not dead links.
- page.orphan (5): /p/<slug> user draw results; intentionally unlinked, zero impressions.
- Page speed: median-of-3 puts every sampled page under 2.5s except /new (3.06s, the app create page, not a ranked page). Single-run 5s+ readings were cold starts. PSI mobile lab LCP 3.8s /league-id and 4.7s / with no CrUX field data; not the constraint.
- Sitemap "indexed: 0" in GSC: contradicted by URL Inspection (all inspected pages indexed).
- 63 notices not pulled.

## Outcome
Verified 2026-10-10 after PR #17 deployed (recheck landed 16:18Z, live curl of all 38 sitemap URLs).

- title.too.long: 12 to 1. The one left is /fantasy-football ("Free &amp; Open Source"): the crawler counts the encoded `&amp;` (62), the rendered title is 58. All six PR targets cleared.
- description.too.long: 22 to 7. Still flagged: /league-id/sleeper 164, /fleaflicker 163, /guides/is-your-draft-order-actually-random 161, /guides/weighted-vs-random-draft-lottery 165 (all raw, with `&#x27;` counted as 6 chars; each is <= 160 decoded), plus /p/ result pages (user content, out of scope). The repo length guard measures decoded text, so it passes while the crawler does not. Follow-up: trim those four by a few chars, or count apostrophes and ampersands as encoded in `metadata-length.test.ts`.
- Fix now 1 to 3 (Sleeper CTR, ESPN hub vs guide, lost "sleeper randomize draft order"): shipped and live, but the outcome depends on Search Console. Re-read in 2 to 4 weeks.
- Unchanged by design: link.broken.external (apps.apple.com 429, now 10 on 5 /p/ pages), page.orphan 5.
- All 38 URLs return 200, and the sampled canonicals are self-referencing. Speed was not part of this PR, so Lighthouse was not re-run.

Details: `verify.json`.
