# SEO audit: fantasyfootballdraftorder.com

2026-10-25 · rank 5 · 38/38 pages audited (100% coverage) · GSC window 2026-09-25 to 2026-10-22

## Verdict

The site is technically clean and its trajectory is up: impressions 6,872 → 11,658 and
average position 11.5 → 9.56 across the last three audits, with no real crawl defects and
no indexability contradictions. The one thing wrong is the one thing that matters: it
ranks on **page 1** for a large cluster of "how to find [ESPN/Sleeper] league id" queries
and takes **almost no clicks**. 74 clicks on 11,658 impressions is a 0.63% CTR at average
position 9.56. `/league-id/sleeper` sits at **position 5** for "how to find sleeper league
id" (172 impressions) and "where to find sleeper league id" (101 impressions) and has **0
clicks** on both, where the benchmark CTR at that position is 4%.

Do two things. First, **deploy** — production is 5 merged PRs and 6 days stale, and the
pending deploy clears the only standard violation (meta keywords) for free. Second, treat
the league-id CTR as a **content/SERP problem, not a metadata problem**: the pages already
have strong, answer-shaped titles and HowTo + FAQ schema, so the lever is winning the
SERP feature that is eating the click, or deciding these informational queries are low
value for a tool and investing the page-1 authority elsewhere.

## Numbers

| | Value | vs last audit (2026-10-10) |
| --- | --- | --- |
| Errors / warnings (crawl) | 0 / 16 | 0 / -5 |
| Real crawl defects (after verification) | 0 | unchanged |
| Clicks (28d, Google) | 74 | +33 (was 41) |
| Impressions (28d, Google) | 11,658 | +~4,800 |
| Avg position (28d, Google) | 9.56 | +1.9 (was 11.5) |
| CTR (28d, Google) | 0.63% | down |
| Pages in striking distance (pos 8-12) | ~49 query/page rows | n/a (not tracked before) |
| Worst LCP (mobile, median of 3) | 2.66s /league-id/sleeper | better (was 3.06s /new) |
| Standard (pass / partial / fail) | 20 / 6 / 8 | n/a (first standard run) |

## Standard

Script grade is live-page only; the Result column folds in auditor manual grades and
reclassifications (full rationale in `standard.json` notes).

| Section | Result | Gaps / notes |
| --- | --- | --- |
| A. Site foundation | partial | A4 partial (2/12 descriptions under 150 chars); A5 partial **but already fixed in #29, pending deploy** |
| B. Crawl and index | mostly pass | B7 **fail (llms-full.txt 404, real)**; B9 fail is a **by-design deviation** (manual submit + nightly indexnow-sync, documented); B1 partial (missing OAI-AdsBot, an ads bot, likely off-intent) |
| C. Structured data | pass | Rich coverage: Organization, WebSite, SoftwareApplication, FAQPage, HowTo, BreadcrumbList, Article all present and valid |
| D. Social cards | partial | D1 partial (2 distinct OG images across 6 families; no per-route cards) |
| E. Internal linking | partial | E5 partial (1 indexable /p/*/card page not in sitemap) |
| F. Language | pass | lang=en on all; single-language site |
| G. Hub/sibling links | fail → n/a | G1/G2 are the /p UGC result pages, orphaned by design |
| H. Trust pages | manual | No about/methodology/editorial; trust story is open-source + commit-SHA randomizer, low priority |
| I. Caching/security | partial | I2 partial (one CSS served max-age=0; HSTS + x-content-type-options present) |
| J. App deep-linking | fail | J1 (no Smart App Banner) + J6 (AASA 404) real but low-impact for a web tool; defer |
| K. Analytics | pass | GA4 with Consent Mode default on every page |
| L. Prebuild gates | manual | None; metadata length covered by a unit test instead |
| M. SEO docs | fail | M1/M2 (no docs/seo growth-plan or page-plans); process docs, low priority |
| N. Off-site | manual | not assessed |

## Fix now

1. **Deploy production — it is 5 PRs / 6 days stale.** (clears A5 on 11 pages, ships merged backlog)
   - Last deploy: 2026-10-19 19:06 (workflow_dispatch). HEAD: `56324dd`, 2026-10-24.
   - Undeployed merged PRs: #29 (remove meta keywords → clears standard A5), #24 (skip GA
     on datacenter networks + app-store click tracking → GA data quality), #25 (Grafana
     OTLP observability), #26/#27/#28 (local deploy.sh sync, no prod effect).
   - Action: run the **Deploy** workflow (`workflow_dispatch` on main). Auto-deploy on push
     is disabled by design; CLAUDE.md's "push to main" line is stale vs the workflow.
   - Evidence: live pages serve `<meta name="keywords">` that `56324dd` already removed in
     code; `src/lib/seo/metadata.ts` `buildMetadata` emits no keywords.

2. **The league-id CTR problem is the real work, and it is content/SERP, not metadata.**
   (~1,500 impressions/month across the cluster, ~0 clicks; GSC estimates ~145 clicks if moved to top 3)
   - Repo: `src/app/(marketing)/league-id/page.tsx`, `src/app/(marketing)/league-id/[platform]/page.tsx`, `src/lib/seo/league-id-guides.ts`
   - This is a **propose, do not start unprompted** item. The pages already rank page 1 and
     already carry strong titles + HowTo/FAQ schema, so the zero CTR is almost certainly a
     SERP feature (featured snippet / People-Also-Ask / video) owning the top of the result
     for "how to find [platform] league id." Options, in order of leverage:
     a. Instrument the actual SERP for the top 5 queries (what feature sits above us?) before
        committing effort. I could not see Google's live SERP from here.
     b. If a featured snippet is in play, structure the first on-page answer for snippet
        capture (a one-sentence definitional answer + a tight numbered list, which the
        descriptions already imply but the page body should lead with).
     c. If the SERP is simply answer-complete (user gets the ID without clicking), accept
        these as low-value-for-a-tool and redirect the internal-link equity toward the
        transactional pages (`/sleeper`, `/espn`, `/new`) that actually convert to a draw.

## Batch (cheap in bulk, not urgent)

- **B7 llms-full.txt** (real standard gap; serves the AI-crawler strategy in `robots.ts`).
  New route `src/app/llms-full.txt/route.ts`, modeled on the existing `src/app/llms.txt/route.ts`
  but inlining page bodies. Non-trivial; offer to build.
- **A4**: 2 of 12 sampled meta descriptions are under 150 chars. Low value (Google does not
  penalize a 140-char description). `src/lib/seo/*.ts` data files.
- **Homepage LCP 2.61s / 600ms unused JS** — marginal (0.1s over threshold). Only worth it
  if a homepage bundle trim is cheap. `src/app/(marketing)/page.tsx` and its client components.
- **D1 per-route OG cards** — 2 distinct images across 6 families. `opengraph-image.tsx`.
- **B1 OAI-AdsBot** in `src/app/robots.ts` — optional; it is an ads crawler, arguably off the
  "welcome for citations" intent of that list.

## Deliberately skipped (seen, judged not worth doing)

- `link.broken.external` (10 links / 5 pages): false positive. All are `apps.apple.com`
  "also built by me" links returning 429 (Apple throttling the crawler). Links are valid.
- `title.too.long` on `/fantasy-football`: false positive. Rendered title is 58 chars; the
  62 count treats `&amp;` as 5 characters.
- `page.orphan` (5 `/p/*` pages) + G1/G2: by design. User-generated punishment-wheel result
  pages, discoverable by their creator's link and entering the sitemap only after the result
  lands (CLAUDE.md).
- **B9 IndexNow-on-deploy**: by-design deviation, not a gap. Runtime submission was removed
  after 490×429 failures from Workers egress; the site relies on the registered nightly
  `indexnow-sync` sweep + manual `pnpm indexnow:submit`. Do not add a CI step without the
  maintainer's call.
- **J1/J6 app banner + AASA**: real but deferred; low impact for a web tool ranking on
  informational queries. Revisit when the native app is the priority.
- **Page speed generally**: LCP ~2.6s mobile with perfect CLS and tiny TBT. Not the constraint.
- **M1/M2 SEO docs, H3/H4 trust pages, B5 HTML sitemap**: low priority for a 38-page
  open-source tool whose trust story is the public randomizer.

## Coverage gaps (the honest limits of this run)

- Could not see Google's live SERP for the league-id queries, so the exact cause of the
  zero CTR (which feature or competitor owns the click) is inferred, not confirmed.
- No CrUX field data on any page (traffic too low for a distribution); all CWV numbers are
  lab-only.
- GSC API does not expose the UI's Page Indexing, Manual Actions, Security, or Enhancements
  lists; none were pulled.
- Bing's health/sitemaps/feeds endpoints reject the `sc-domain:` identifier; Bing was read
  via crawl_issues/crawl_stats on the `https://` property instead (crawl clean, 44 in index).

## Outcome

- **Deployed `main`** (Deploy run 40265332723, workflow_dispatch, success). Cleared the
  6-day / 5-PR production backlog. **A5 verified cleared live**: meta keywords are now gone
  from `/`, `/league-id/sleeper`, and `/sleeper`. Also shipped #24 (GA datacenter skip +
  app-store click tracking) and #25 (Grafana OTLP observability). See `verify.json`.
- **B7 llms-full.txt**: route built and verified locally (`pnpm build:cf` green on Node 22
  with the CI env; renders 63.9 KB of valid markdown, 0 em dashes, in the Worker output).
  Shipped in **PR #30** together with this audit directory. The agent was blocked from
  merging by the auto-mode classifier, so **#30 awaits a human merge**; `/llms-full.txt`
  (404 today) clears on the redeploy that merge triggers.

### SERP investigation (the league-id CTR problem)

The Claude-in-Chrome extension was not connected, so the live Google SERP could not be
driven; WebSearch on the top zero-click queries was used instead (advisory, not a live
SERP read). Both the search landscape and the GSC position/CTR data point the same way:

- These are **answer-complete informational queries**. "How to find your [platform] league
  id" is answered in one sentence (it is the number in your league URL), so a featured
  snippet / inline answer satisfies the searcher without a click. That is why a position-5
  organic result takes ~0 clicks. It is not a weak title.
- **ESPN**: an official `support.espn.com` League-ID page exists and almost certainly owns
  the featured snippet. Our pages rank ~9-10, below it. **Low ROI to chase.**
- **Sleeper**: **no official help article exists** (top results are third-party dev/API
  docs). This is the one league-id family we can own. `/league-id/sleeper` already ranks
  top-5 with HowTo + FAQ schema; leading the page body with a crisp, snippet-extractable
  answer (one-sentence definition + the exact 18-digit example + a 2-3 step list directly
  under the H1) is the highest-leverage content fix in the cluster. Repo:
  `src/lib/seo/league-id-guides.ts` (the `sleeper` entry) and
  `src/app/(marketing)/league-id/[platform]/page.tsx`.
- **The real growth lever is the transactional cluster, not league-id.** The league-id
  pages are high-impression, answer-complete, and low-intent for a draft tool, so they will
  always convert poorly to clicks and worse to the product goal (creating a draw). The
  queries worth winning are `[platform] draft order randomizer/generator` and
  `how to randomize draft order on [platform]` sitting at positions 6-13 (e.g. `/sleeper`
  at pos 6.15 for "how to randomize draft order sleeper", 0 clicks), where a click is a
  likely product user. `guides.ts`'s `metaTitle` comment already names this tension; the
  next content pass should target those landing pages (`/sleeper`, `/espn`, `/yahoo`) and
  their walkthrough guides rather than more league-id surface.
