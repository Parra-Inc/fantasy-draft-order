# Viral loops: what else to build

Product ideas adjacent to Fantasy Football Draft Order, filtered by the four things that
actually made this one work. Nothing here is committed to; this is the shortlist and the
reasoning, so a future decision does not start from scratch.

## The filter

Any candidate has to clear all four bars, not just one:

1. **One creates, eleven visit.** Distribution is built in because the commissioner drops
   a link in the league group chat. No paid acquisition, no invite mechanics to design.
2. **No auth, no state to maintain, no background jobs.** The whole app is a create form,
   an immutable record, and a timed read. That is why it costs nothing to run.
3. **Trust is the feature.** Immutability plus a public randomizer at a pinned commit is
   the reason it beats a spreadsheet. If a tool does not have someone who could be accused
   of cheating, it does not get this advantage.
4. **High-intent seasonal search.** People type "fantasy draft order randomizer" with
   their credit card already out, metaphorically. Peaks Jul to Sep.

An idea that fails bar 3 is just a utility. An idea that fails bar 1 needs a marketing
budget. Both are worse businesses than this one.

## Tier 1: Super Bowl squares

The strongest candidate. Identical mechanic (randomize, reveal at an announced time, prove
you did not rig it) against roughly 100x the audience.

- A squares grid is precisely the artifact people accuse the host of rigging, so bar 3 is
  satisfied harder here than in the draft-order case.
- The incumbent options are a printed PDF or a sketchy app with an account wall.
- Same shape as today: create, share link, numbers drawn publicly at kickoff minus 30.
- **Seasonality is complementary.** Squares peaks Jan/Feb, draft order peaks Jul to Sep.
  Together they fill the year instead of leaving six dead months.

Reuses `src/lib/randomizer.ts` and `src/lib/reveal.ts` essentially unchanged. The only new
domain concept is a 10x10 grid with two axes of digits instead of a 1..N permutation.

**Ship as its own domain.** Different audience (casual fans at a party, not commissioners),
different season, different search terms. Sharing a domain would muddy both.

## Tier 1: sealed keeper declarations

Every keeper league has the same problem: everyone must declare keepers by a date, and
nobody should see anyone else's until the deadline passes. That is a sealed-bid mechanic,
and it needs exactly what is already built here: immutable submissions plus a timed reveal.

This is the highest-value commissioner pain that a no-auth immutable-record tool solves
better than Sleeper or ESPN do, because the platforms let the commissioner see everything
early and there is no way to prove they did not.

Same mechanic, same code path, different noun:

- Sealed-bid auction budgets.
- Offseason rule-change votes: anonymous ballots, unsealed at a deadline, commissioner
  cannot peek.
- Trade vetoes: anonymous league vote with a hard deadline.

## Tier 2: league dues tracker

Boring and beloved. A public ledger of who has paid, no accounts, one link in the group
chat. Commissioners currently do this with a Venmo screenshot and passive aggression.

- Weak SEO, strong word of mouth.
- Note this one bends the immutability rule: the commissioner has to be able to mark
  someone paid. That is a real design question, not a blocker (append-only log, public
  edit history), but it is the only idea here that needs mutable state.

## Tier 2: punishment wheel

Last place gets a randomized punishment from a league-submitted list, drawn publicly.
There is an entire culture around league punishments and the Reddit threads are enormous.

- Trivial to build on the existing randomizer.
- Extremely shareable, and it generates content people post on their own.
- Pure fun rather than pure utility, which is a different kind of durability.

## Tier 2: permanent league history page

One URL that accrues champions, records, and trophies year over year.

- Emotional hook, durable link, and it compounds SEO instead of expiring after draft
  season the way a single draft page does.
- Pairs naturally with a **league constitution page**: fill a form, get a permanent
  versioned public rules URL. Commissioners want this and it is pure SEO surface.

## Just pages on this site, not products

Same audience, same mechanic, not enough surface to stand alone. These belong under the
existing domain.

- Waiver order randomizer (literally the same engine, different noun).
- Playoff seeding reveal.
- Toilet bowl / consolation bracket generator.
- Draft pick trade ledger.
- Fantasy team name generator (low value per visit, high traffic, cheap SEO).

## Considered and parked

- **Survivor / knockout pools.** Pick one team a week, no reuse. No-auth is awkward but
  solvable with per-player links. Reconsider if squares works.
- **Pick'em and confidence pools.** Crowded, though nothing good exists that is both free
  and account-free.
- **Bowl game and March Madness pools.** Crowded, and off-brand for a football site.
- **Super Bowl prop bet sheets.** Printable party game, zero backend, very seasonal. Fine
  as an add-on to a squares site, not a product.
- **Start/sit polls.** Reddit already owns this behavior.

## Skip

Trade analyzers, rankings, rest-of-season schedule strength, start/sit advice. All need
live data feeds or accounts, all are crowded by ESPN, Sleeper, and FantasyPros, and none
of them have a trust angle, which is the only thing this project is actually good at.

## Recommended sequence

Two moves, not ten:

1. **Fold the commissioner tools into this site.** Keeper declarations, dues, punishment
   wheel, league history. Same audience, same domain authority, cross-linked from a
   product they already trust. Cheapest possible expansion.
2. **Ship squares as its own domain for the winter.** Reuse the randomizer and reveal
   engine wholesale. Closest thing to a copy-paste of what already exists, aimed at the
   biggest single-day audience in American sports.

Anything new that ships a public page has to be wired into IndexNow before launch. See the
IndexNow section in [CLAUDE.md](../CLAUDE.md).
