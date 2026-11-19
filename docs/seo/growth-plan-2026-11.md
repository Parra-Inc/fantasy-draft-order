# SEO growth plan, November 2026

Written 2026-11-19 alongside the audit in
`marketing/seo/audits/2026-11-19/`. Every number below comes from that
directory: `search-console.json` (Google, 28 days to 2026-11-16),
`gsc-export/Queries.csv` (16 months of named queries), `keyword-research.json`
(Bing weekly US volumes) and `bing.json`.

## Diagnosis

- **The site is visible but not clicked.** 9,193 Google impressions and 31
  clicks in the last 28 days, average position 9.7. 87% of impressions come
  from league ID and platform how-to queries that rank 6 to 10 with close to
  0% CTR.
- **The product's own search terms do not rank.** "Draft order generator",
  "draft order randomizer" and 66 variants average position 72. Punishments
  average 61, draft formats 59, draft lottery 50.
- **There is no off-site authority.** Bing reports 0 inbound links. The pages
  that win the head terms belong to Pro Football Network, Fantasy Alarm,
  FantasyPros and SI. On-page work alone will not close that gap.
- **The demand is seasonal.** In the Bing weekly data, draft topics peak from
  late July to mid September and punishments from late August to mid
  September, then fall to a quarter of that by November. Changes shipped now
  are judged in July 2027, not this winter.
- **Technically the site is healthy.** 0 crawl errors, LCP about 1 second on
  every template, sitemap and robots clean on Google and Bing.

## Topic categories

The categories the site should own, each defined by a piece of functionality
plus the content cluster around it. Ordered by what to work on, not by size.

Demand columns: **GSC** is 16 months of named Google queries for that topic
(impressions, average position). **Bing** is the peak week of exact-match US
impressions for the head term, useful only for comparing categories.

| # | Category | Functionality | Pages today | GSC demand | Bing peak/wk | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | League ID lookup | Paste a league ID or URL and import the teams | `/league-id` + 5 platform guides | 8,728 impr, pos 8.5 (62%) | n/a | **Own it.** Already page one; the job is CTR and moving into the top 5 |
| 2 | Platform draft order how-to | Native steps per platform, then a public draw | `/sleeper`, `/espn`, `/yahoo`, `/mfl`, `/fleaflicker`, 3 guides | 3,575 impr, pos 7.5 (25%) | n/a | **Own it.** Add the missing platforms |
| 3 | Fantasy football punishments | Searchable punishments database (188 ideas, tags) and the punishment wheel | `/fantasy-football-punishments`, `/database` (merged, not deployed), `/punishment/new` | 726 impr, pos 61, 163 queries | 68 (327 broad) | **Grow it.** Biggest gap between demand and rank |
| 4 | Draft order generator (core tool) | Scheduled, sealed, live draft order draw | `/`, `/fantasy-football`, `/new`, 3 sport pages | 278 impr, pos 72, 68 queries | 254 | **The prize, long-term.** Needs links, not more pages |
| 5 | Draft formats and pick order | Snake, linear, third-round reversal; who picks when | `/guides/snake-vs-straight-draft-order` | 214 impr, pos 59 | 93 (557 broad, "snake draft") | **Grow with a tool** (pick-order grid) |
| 6 | Draft lottery | Weighted or random lottery for the order | `/draft-lottery`, weighted vs random guide | 107 impr, pos 50 | none recorded | **Maintain.** Low demand |
| 7 | Other sports | Same draw for basketball, baseball, hockey | 3 sport pages | 113 impr, pos 11 | n/a | **Maintain.** Already ranks; low effort |
| 8 | League names (new) | League and team name generator | none | none (no page) | 160 (292 broad) | **First expansion.** Results are weak listicles and spam |
| 9 | Commissioner toolkit (new) | Trophy, rules/constitution template, dues | none | none (no page) | trophy 197, rules 35 | **Later.** Trophy demand is real but commercial |

### 1. League ID lookup

Queries: "how to find sleeper league id", "espn league id", "where to find
league id espn fantasy". This is 62% of all impressions.

- Already done: answer-first pages and query-first titles (PR #54, merged
  2026-11-19, **not deployed**); hub de-cannibalized (PR #49). The ESPN guide's
  share of ESPN-query impressions went from 18% (Nov 1 to 11) to 40% (Nov 13
  to 17).
- Next: annotated app screenshots and a 30-second video per platform (the
  results pages have video rows); league ID guides for NFL.com and CBS; a
  short "Sleeper user ID vs league ID vs draft ID" section (10 impressions for
  "how to find sleeper user id" at pos 9 with no page).

### 2. Platform draft order how-to

Queries: "how to randomize draft order in sleeper", "when does yahoo randomize
draft order", "how to set draft order in sleeper". Bing loves the Yahoo guide:
105 clicks in its peak week at position 4.

- Next: NFL.com and CBS draft order pages (both platforms are absent from the
  site); a keepers section on `/sleeper` ("how to make custom draft order in
  sleeper, like taking out certain picks due to keepers", 22 impressions at
  pos 9).

### 3. Fantasy football punishments

Queries: "fantasy football punishments", "best fantasy football punishments",
"free fantasy football punishments", plus the synonyms people actually type:
"fantasy football challenges" (81 impressions), forfeits, penalties, dares.

Who wins: listicles from FantasyPros, SI, Pro Football Network and Yahoo. We
can't out-authority them; we can out-utility them. None of them has a
searchable, filterable database or a fair way to pick one.

- Deploy PR #53 (database + 146 new ideas).
- Indexable tag pages, one per high-intent tag, for example
  `/fantasy-football-punishments/free`, `/cheap`, `/remote` (for leagues that
  live apart), `/food`. Each renders the filtered table server-side with its
  own title and intro. Today the filters are `?tag=` query strings, which
  Google treats as the same page.
- Use the synonyms in copy and FAQs: "challenges", "forfeits", "penalties",
  "dares".
- A seasonal refresh in late August with the visible year in the title.

### 4. Draft order generator (core tool)

Queries: "draft order generator", "fantasy football draft order generator",
"draft order randomizer", "random draft order generator". The homepage ranks
for most of them at position 60 to 80.

Who wins: tool pages from Pro Football Network, Fantasy Alarm, Rototrade and
Easy Office Pools. The page type matches ours, so this is an authority and
focus problem.

- Pick one owner. Today three pages target the phrase: `/` (title says
  "Randomizer"), `/fantasy-football` (title says "Draft Order Generator") and
  `/new` (first line says "generator"). Recommendation: the homepage owns
  "fantasy football draft order generator / randomizer" with both words in its
  title and H1; `/fantasy-football` keeps the football-specific long tail and
  links up to the homepage with that anchor; `/new` stays the form.
- Alternative pages for each named competitor, per the fleet rule of one
  alternative page per competitor. People already search competitors by name
  next to our pages ("fantasy nerds random draft order").
- Links: see "Off-site" below. This category will not move without them.

### 5. Draft formats and pick order

Queries: "snake vs straight draft", "serpentine draft" (32 impressions),
"third round reversal", "is the nfl draft a snake draft".

- Build a pick-order grid tool: enter team count and format, see who picks at
  every slot (3.07 and so on). It is the functionality that matches the
  intent, and it links straight into the live draw.
- Expand the snake vs straight guide to cover serpentine (same thing), third
  round reversal and auction, each with a heading.

### 8. League names (first expansion)

No page today, so Search Console can't see the demand. Bing shows 160 exact
(292 broad) impressions in the peak week, close to the generator itself, and
the top results include low-quality filler pages. A name generator plus a
curated list fits the commissioner audience and links naturally into the draw.

## Numbered fixes from the 2026-11-19 audit

1. Deploy main (PRs #53, #54 and this audit's PR). Nothing below can be
   measured until it is live.
2. Eight meta descriptions brought to 150 to 160 characters (this PR).
3. Footer headings and `/ask-your-commissioner` cards no longer skip heading
   levels (this PR; was on 36 of 38 pages).
4. One owner page for "draft order generator" (category 4).
5. Indexable punishment tag pages (category 3).
6. Immutable caching on `/_next/static/*` (standard I2, open since Oct).
7. Per-family OG images (standard D1, open since Oct).

## Content roadmap

| When | Page | Category |
| --- | --- | --- |
| Dec 2026 | Punishment tag pages (free, cheap, remote, food, wardrobe) | 3 |
| Dec 2026 | Homepage head-term focus, `/fantasy-football` re-scope | 4 |
| Jan 2027 | NFL.com and CBS draft order + league ID pages | 1, 2 |
| Feb 2027 | Pick-order grid tool, snake guide expansion | 5 |
| Mar 2027 | League name generator + list | 8 |
| Apr 2027 | Competitor alternative pages (Pro Football Network, Fantasy Alarm, Fantasy Nerds, Rototrade, Easy Office Pools) | 4 |
| Jun 2027 | Screenshots and videos for the league ID and Sleeper pages, 2027 refresh of every dated title | 1, 2 |
| Aug 2027 | Punishments seasonal refresh | 3 |

## 30 / 60 / 90 days

- **30 days (to 2026-12-19):** deploy; confirm the new titles and the database
  are live and indexed (`inspection_inspect`); re-check the ESPN hub/guide
  split; ship punishment tag pages.
- **60 days (to 2027-01-18):** head-term owner change; NFL.com and CBS pages;
  start the off-site list below.
- **90 days (to 2027-02-17):** pick-order grid; re-run `/audit seo` and compare
  category positions against this plan's table.

## Off-site

The ceiling on categories 3 and 4 is links. In order:

1. Answer recurring Reddit threads (r/fantasyfootball, r/SleeperApp) on
   "how do I randomize the draft order" and "last place punishment ideas" with
   the real answer and a link.
2. List the tool on AlternativeTo and Product Hunt (open source is the hook).
3. Pitch the punishments database and the sealed draw to fantasy newsletters
   and podcasts in July, before draft season.
4. Cross-promote from the fleet's other sites where it fits.

## Stop doing

- Do not add pages that compete with an existing owner (the `/league-id` hub
  vs `/league-id/espn` lesson).
- Do not re-tune titles or merge pages on less than four weeks of data after a
  change; the ESPN split took that long to move.
- Do not submit IndexNow pings from read paths (see CLAUDE.md).
- Do not chase description length on `/p/*` wheel pages; they are
  user-generated and their descriptions come from each wheel's own options.
- Do not judge any of this on winter traffic.
