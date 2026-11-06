# Outreach drafts (not sent)

Status: DRAFTS ONLY. Nothing here has been sent, posted or submitted. A person reviews,
finds the right contact, and sends by hand.

## Why

The 2026-10-30 AI-search audit (`marketing/seo/audits/2026-10-30/aeo/fantasy-draft-order.json`)
ran the prompt "fun ways to determine fantasy football draft order". We were not mentioned
or cited. The cited sources were editorial roundups: rotoballer.com, rotostreetjournal.com,
fantasypros.com, actionnetwork.com, nfl.com, thefantasyfootballers.com, footballguys.com and
si.com. The ask is a one-line mention of a verifiable randomizer as a "fair backup" method,
linking https://fantasyfootballdraftorder.com/why-fair.

## Facts used (all from this repo)

- Free, no accounts, open source: https://github.com/Parra-Inc/fantasy-draft-order
- The draw is scheduled at a pre-announced time and runs server-side; every viewer sees the
  same live reveal (`src/app/d/[slug]`, `src/lib/reveal.ts`).
- Shuffle is Fisher-Yates using Node `crypto.randomInt` (`src/lib/randomizer.ts`).
- Each results page links the randomizer source at the exact commit used.
- Once scheduled, a draft cannot be edited, including by the commissioner.

Not claimed (unverifiable): user counts, league counts, ratings, testimonials.

## Targets

Exact article URLs and editor contacts were not verified for this draft. Before sending,
find the current "fun ways to set / determine draft order" article on each site, confirm it
still exists, and use the author's listed contact or the site's contact or tips form.

| Site | Where | Status |
|---|---|---|
| RotoBaller (rotoballer.com) | draft order ideas roundup, author contact | not sent |
| Rotostreet Journal (rotostreetjournal.com) | draft order ideas roundup, author contact | not sent |
| FantasyPros (fantasypros.com) | draft order ideas article, editorial contact | not sent |
| Sports Illustrated (si.com) | fantasy draft order ideas article, author contact | not sent |

## Proposed email (same body, swap name and article)

Subject: A fair "backup" method for your draft order roundup

Hi [author name],

I enjoyed your piece on fun ways to set fantasy draft order ([article title]). Most of
the methods end with someone saying "fine, just randomize it", and that step is usually
the one the league argues about.

Disclosure up front: I work on Fantasy Football Draft Order (fantasyfootballdraftorder.com),
so I am not neutral. It is a free, open source tool for exactly that step. The commissioner
schedules the draw for a public time, nobody can edit it afterwards, and the whole league
watches the same live reveal. The shuffle code is public on GitHub and every results page
links the exact commit that ran.

If you ever update the article, it might fit as a "fair fallback" option. Here is how it
works: https://fantasyfootballdraftorder.com/why-fair

No pressure either way, and thanks for the article.

[name]
Fantasy Football Draft Order (made by Parra)

## Per-site note

- RotoBaller, Rotostreet Journal: roundup lists, so a one-line "fair fallback" entry is the
  natural fit.
- FantasyPros: their own randomizer exists (see the why-fair FAQ), so frame it as a scheduled,
  verifiable alternative, not a replacement. Lower odds.
- SI: high authority, lowest odds; send only after the others.
