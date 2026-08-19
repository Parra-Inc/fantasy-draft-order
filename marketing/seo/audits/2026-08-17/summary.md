# SEO audit: fantasyfootballdraftorder.com

2026-08-17 · rank 5 · 34/34 pages audited (100% coverage) · GSC window 2026-07-19 to 2026-08-15

## Verdict

Technically this site is clean: zero errors, zero indexability contradictions, zero
broken internal links, an empty Bing crawl-issue list, empty lost-queries, and empty
cannibalization across two programmatic families. The one real problem is demand-side
and the crawler cannot see it: the `/league-id/[platform]` family took 2,376 impressions
in 28 days at positions 5.9 to 8.2 and converted 11 clicks (0.46%), while the sibling
pages `/sleeper` and `/guides/how-to-randomize-draft-order-on-sleeper` sit at the *same*
positions and convert at 1.4%. Draft season is peaking now, so the highest-value work
this week is snippet-facing copy on that family plus the mobile LCP regression that
puts 18 of 21 sampled pages over 2.5s.

## Numbers

| | Value | vs last audit |
| --- | --- | --- |
| Errors / warnings (before recheck) | 0 / 15 | |
| Errors / warnings (after recheck) | 0 / 16 | |
| Clicks (28d, Google) | 82 | |
| Impressions (28d, Google) | 6,872 | |
| Avg position (28d, Google) | 11.5 | |
| Clicks (28d, Bing) | 13 | |
| Pages in striking distance (pos 8-15) | 25 query rows, 0 with clicks | |
| Pages in quick-win band (pos 11-20) | 0 | |
| Worst LCP (mobile, median of 3) | 4.24s /draft-lottery | |

No prior audit directory exists for this site, so the comparison column is
deliberately blank rather than baselined against a guess.

**Recheck delta: zero.** `recheck` queued all 34 pages; `audit_report` returned
byte-identical results before and after. Unlike the larger fleet repos, none of this
site's findings were archaeology. The warning count moved 15 to 16 only because
`link.broken.external` first appeared on 2026-08-17, and live verification then
disproved it (below).

## Fix now

1. **`/league-id/[platform]` converts at one third the site's own rate at identical
   positions** (5 pages, 2,376 impressions / 11 clicks in 28 days)
   - Repo: `src/lib/seo/league-id-guides.ts` (titles and descriptions), `src/app/(marketing)/league-id/[platform]/page.tsx`
   - Evidence: `search-console.json` -> `derived.leagueIdFamilyCtrGap`, and the
     `low_ctr` rows: "how to find sleeper league id" 115 impressions at position 7.69
     with **0 clicks** against a 1.5% benchmark. Three of the four low-CTR rows point
     at `/league-id/sleeper`.
   - Fix: the titles and descriptions are well written but they *describe* the answer
     instead of *being* it. These are one-fact informational queries that a snippet or
     AI Overview can satisfy without a click. Lead the title and the first sentence of
     the description with the literal answer and a reason the page is still worth
     opening: the 18-digit format, the exact URL segment, and the "last season's ID
     fails" caveat that a snippet will not carry.
   - Honesty note: the mechanism here is inferred from the CTR gap, not proven by any
     crawler finding. The five pages are technically clean. Treat this as the highest-
     value experiment on the site, not as a defect with a known fix. Re-measure the
     family CTR in the next audit.

2. **Title truncated on the one guide with real impressions and a real ranking**
   (1 page)
   - Repo: `src/lib/seo/guides.ts` line 216
   - Current: `"Snake draft vs straight draft: which order should your league use?"`
     (66 chars, verified against live HTML)
   - Evidence: `/guides/snake-vs-straight-draft-order` took 339 impressions at
     position 15.70 for 1 click (0.29% CTR), the worst impressions-to-clicks ratio of
     any page over 300 impressions. `crawl.json` -> `title.too.long`.
   - Fix: shorten under 60 so the distinguishing half survives truncation, e.g.
     "Snake vs straight draft order: which should you use?" (52).

3. **Mobile LCP over threshold on the templates that serve every ranked page**
   (18 of 21 sampled pages)
   - Repo: `src/app/layout.tsx`
   - Evidence: `pagespeed.json`. `/draft-lottery` 4.24s, `/league-id` 3.20s,
     `/sleeper` 3.36s, homepage 3.37s, all medians of 3 runs. TTFB is 0.04 to 0.06s
     everywhere, so Workers and origin are not the cause; the only Lighthouse
     opportunity surfaced is Reduce unused JavaScript (150 to 610ms).
   - Fix: the root layout loads three Google font families (Space Grotesk, Inter,
     DM Mono at two weights, four preloaded woff2 files) and mounts `Toaster` from
     `sonner` plus `FeedbackButton` on every page including pure content pages. Drop
     to two families or subset the weights, and move the two client components below
     the marketing tree so static pages stop shipping their JS.
   - Caveat: lab data only, no CrUX field confirmation was pulled. Do not quote these
     as real-user numbers.

## Batch

Cheap in bulk, not urgent. Do these in one commit with item 2.

- **Ten more titles over 60 chars.** Repo: `src/lib/seo/guides.ts`,
  `src/app/(marketing)/{draft-lottery,fantasy-football-punishments,mfl,fantasy-football,fantasy-baseball,fantasy-basketball,league-id}/page.tsx`,
  `src/app/punishment/new/page.tsx`. Full measured list with decoded lengths is in
  `crawl.json` -> `liveVerification.title.too.long`. `/league-id` at 61 chars is one
  character over and carries 408 impressions, so it is the only one of the ten worth
  touching for its own sake.
- **`/punishment/new` orphan.** Repo: `src/app/(marketing)/layout.tsx`, `PRODUCT_LINKS`.
  Add `{ href: "/punishment/new", label: "Punishment wheel" }`. Note the page is
  already linked from `/fantasy-football-punishments` and `/p/[slug]` as
  `/punishment/new?src=...`, so the crawler flags it purely because of the query
  string. Real cost is near zero (3 impressions in 28 days); do it because it is a
  one-line edit, not because it is costing traffic.

## Deliberately skipped

- **`link.broken.external`, 2 instances on `/p/violet-otter-v5cs`. FALSE POSITIVE.**
  Whole condition tested: the `apps.apple.com` hrefs are still on the page **and**
  both targets return HTTP 200 with a browser User-Agent. The crawler's 429 is Apple
  rate-limiting the crawler. No repo change. Expect this to reappear in future crawls.
- **`/p/violet-otter-v5cs` orphan.** User-generated draw-result page, orphan by design.
- **Eight of the eleven over-long titles** (`/draft-lottery`, `/fantasy-football`,
  `/fantasy-baseball`, `/fantasy-basketball`, `/mfl`, `/punishment/new`,
  `/guides/weighted-vs-random-draft-lottery`,
  `/guides/commissioner-guide-running-a-fair-draft-order-reveal`). Between 3 and 49
  impressions each, and `/fantasy-football-punishments` sits at position 49.9 where
  the title is not what is stopping the click. Batched, not prioritised.
- **The other fantasy sports pages** (`/fantasy-baseball`, `/fantasy-basketball`,
  `/fantasy-hockey`) are out of season in August. Any metadata work there is better
  spent in February and October respectively.
- **60 notices.** Not pulled. `min_severity: "warning"` per the skill; on a 34-page
  site the notices would outnumber the real findings four to one.
- **`analytics_anomalies` / `analytics_compare`.** Conditional in the skill and the
  condition did not fire: `site_health_check` returned `status: healthy`,
  `issues: []`, `anomalies: []`.
- **`inspection_inspect`.** Nothing to inspect. Zero indexability contradictions in
  Phase 1 and no call named a broken or not-indexed URL.
- **Sitemap `indexed: 0`.** Not a finding. That field is dead in the GSC API; the
  same property returned 6,872 impressions across 34 distinct URLs in the window,
  which is only possible if the pages are indexed.
- **7-day +47% clicks / +56% impressions.** Real but seasonal. August is peak draft
  season for this niche. Not attributable to any site change and not a trend to bank.

## Coverage gaps

- **No CrUX field data.** Phase 3 ran the local Lighthouse runner only. Every LCP
  number here is lab data from one machine. A single PSI call on `/league-id/sleeper`
  would confirm whether real users see the same thing.
- **`/league-id/[platform]` pages were not individually speed-tested.** The sweep
  sampled `/league-id` (3.20s) as the family representative. The pages carrying the
  most impressions on the site were never measured directly.
- **The three green pages in the speed sweep (`/yahoo` 1.56s, `/fantasy-football`
  1.71s) are single samples**, not medians of 3. They may be warmed-cache artifacts
  rather than a genuinely faster template. Do not build a fix theory on the contrast
  until they are re-run with `--runs=3`.
- **GSC UI reports were not pulled and are not claimed.** Google's public API does
  not expose Page Indexing, Enhancements, Experience, Manual Actions, or Security
  Issues.
- **Bing data is thin.** Bing has 8 of 34 pages in its index and reports 3 inbound
  links. Only 2 of the 4 weeks in the window returned rows, in Friday-dated weekly
  buckets. 13 clicks total is too few to draw any conclusion from.
- **The `brand_vs_nonbrand` segment totals (11 clicks) do not reconcile** to the
  82-click 28-day total, so that tool is querying a narrower slice than requested.
  The brand/non-brand *ratio* is directional only.
- **Phase 5 was not run.** No fixes applied, nothing deployed, nothing verified.
  Every item above is a recommendation, not a completed change.
