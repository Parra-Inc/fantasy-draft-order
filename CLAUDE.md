@AGENTS.md

# Fantasy Football Draft Order

The product name is **Fantasy Football Draft Order** (domain: fantasyfootballdraftorder.com).
The repo, package, worker, and D1 database are still named `fantasy-draft-order` on
purpose: renaming them buys nothing and breaks GitHub links and Cloudflare resource
bindings. Only user-facing copy carries the product name.

Open-source website for transparent, scheduled fantasy football draft order randomization. League creates a draft, everyone watches the order drawn live at a pre-announced time. Code is public so the randomizer cannot be questioned.

## Principles

- **No auth, no editing.** Once a draft is scheduled it is immutable. The commissioner cannot tamper with it after the fact — that is the product.
- **Open source is the trust story.** The randomizer lives in `src/lib/randomizer.ts` and is linked at the exact commit SHA from every `/d/[slug]` results page.
- **Synchronized reveal.** All viewers poll the same state endpoint with SWR; picks are revealed server-side with staggered `revealedAt` timestamps so the animation is identical everywhere.
- **No background jobs.** The randomized order and per-pick `revealedAt` timestamps are written in the create-draft batch. The state endpoint just filters by `revealedAt <= now`. No queues, no schedulers — passage of time is the trigger.

## Stack

- Next.js 16 (App Router, Turbopack) + React 19 + TypeScript strict
- Tailwind CSS 4 + shadcn/ui + Lucide + Motion
- **Cloudflare Workers** via OpenNext (`@opennextjs/cloudflare`), deployed from GitHub Actions
- **Cloudflare D1** (SQLite) through Prisma 7 + `@prisma/adapter-d1`, multi-file schema, prefixed IDs (`drf_`, `tm_`, `pck_`, `fb_`)
- DNS / Web Analytics / WAF managed by Pulumi in [program/](program/) (see [docs/DEPLOY.md](docs/DEPLOY.md))
- SWR for client polling, Zod for validation

There is no Docker and no Postgres. There are also no runtime secrets: the database is a
binding, so nothing sensitive exists to store.

## Commands

```bash
pnpm dev              # Frees ports, migrates + seeds local D1, runs Next on :3042 in a TUI
pnpm dev:force        # Same, but deletes the local D1 database first and reseeds
pnpm dev --studio     # Also run Prisma Studio on :5564
pnpm db:migrate:new X # Generate prisma/migrations/NNNN_X.sql from the schema (REVIEW IT)
pnpm db:migrate:local # Apply pending migrations to the local D1
pnpm db:seed          # prisma/seed.ts (creates demo-league)
pnpm db:studio        # Prisma Studio on :5564, pointed at the local D1 file
pnpm test             # Vitest
pnpm build:cf         # Full OpenNext build (what CI runs)
pnpm preview          # Build + run the real worker in workerd
```

## Ports

- Web (Next.js): **3042**
- Prisma Studio: **5564**

## Structure

```
src/
  app/
    (marketing)/        # Public landing, how-it-works, about, ask-your-commissioner
    d/[slug]/           # Public draft view (pre-draw + live + results)
      card/             # Shareable result PNG (portrait by default, ?t= per team)
      draft.ics/        # The draw as a calendar invite
    new/                # Create draft form (?from= / ?src= attribution, ?clone= copies a roster)
    p/[slug]/           # Public punishment wheel (countdown + spin + sealed result)
      card/             # Shareable result PNG (square by default, ?format=story|wide)
    punishment/new/     # Create wheel form (?ideas= prefills from the ideas database)
    api/
      drafts/           # POST create (writes order + reveal timestamps), GET state, GET importers
        [slug]/presence # Heartbeat for the live viewer count (Durable Object)
      punishments/      # POST create (draws + seals the result), GET state
      punishment-ideas/ # POST a suggestion for the ideas database (lands PENDING)
  lib/
    prisma.ts           # Lazy per-request client over the D1 binding
    cloudflare/         # cfEnv() / cfCtx() binding accessors
    ids.ts              # newId("drf") — app-generated prefixed primary keys
    db-enums.ts         # Allowed values for the String columns that were enums
    og-logo.ts          # Loads public/ images for OG rendering via ASSETS
    punishment-state.ts # THE gate on disclosing a wheel's result (see below)
    punishment-spin.ts  # Wheel timing + seeded elimination order (PURE, TESTED)
    punishments.ts      # Reads/filters the approved punishment ideas database
    randomizer.ts       # Fisher–Yates using node:crypto randomInt (PURE, TESTED)
    reveal.ts           # Reveal timing config + deriveStatus from picks
    slug.ts             # Memorable slug generator
    importers/          # sleeper / mfl / fleaflicker / espn
prisma/
  schema/               # Multi-file Prisma schema (provider = sqlite)
  migrations/           # D1 migrations, applied by wrangler (not Prisma Migrate)
  seed.ts               # Seeds the LOCAL D1 file via better-sqlite3
program/                # Pulumi: Web Analytics, WAF scanner block, email routing
worker/                 # Modules for the worker entrypoint, NOT the Next bundle
                        # (they import "cloudflare:workers"); excluded from tsconfig
wrangler.jsonc          # Worker config and every binding
custom-worker.ts        # Worker entrypoint wrapping .open-next/worker.js
open-next.config.ts     # OpenNext config (static-assets incremental cache)
```

## Conventions

- API routes under `app/api/` use Zod at the boundary, return `NextResponse.json(...)` with typed errors.
- **IDs are prefixed and generated by the app** with `newId("drf")` from `src/lib/ids.ts`. Never `dbgenerated()`: D1 is SQLite and has no `gen_random_uuid()`, and knowing the ids before the write is what lets the create path commit atomically (below).
- **D1 has no interactive transactions.** `prisma.$transaction(async (tx) => …)` does not work. Compute everything first and pass an array — `prisma.$transaction([a, b, c])` — which the adapter sends as one atomic D1 batch. Statement order matters: D1 enforces foreign keys, so parents must precede children.
- **No enum columns.** SQLite has none, so those columns are `String`. Allowed values live in `src/lib/db-enums.ts`, the Zod schemas are built from those tuples, and reads are narrowed with the matching `to*()` helper.
- **Anything that touches the database must be `force-dynamic`.** The D1 binding only exists inside a request, so a prerender at build time has no database and fails the build.
- **Never read `public/` with `node:fs` in code that runs in the worker.** There is no filesystem there; `public/` is served by the ASSETS binding. Use `loadLogoDataUri()` in `src/lib/og-logo.ts`.
- Randomness comes only from `node:crypto`'s `randomInt`. Never `Math.random`. (`node:crypto` is fully supported under the `nodejs_compat` flag.)
- The randomizer is pure — it takes a `rng: () => number` so tests can inject a deterministic sequence.
- `revealedAt` timestamps stagger picks (default first-pick delay 5s, interval 7s, configurable via `DRAFT_FIRST_PICK_DELAY_MS` / `DRAFT_PICK_INTERVAL_MS`).
- Status is derived (never stored): `SCHEDULED` until first `revealedAt`, `DRAWING` while some picks remain hidden, `COMPLETED` once the last pick's time has passed.
- **`opennextjs-cloudflare preview` does not run `custom-worker.ts`.** It serves `.open-next/worker.js` directly, so the www redirect, the scanner block, and every Durable Object re-export are absent under `pnpm preview`. `wrangler deploy` (what CI runs) does use `main`, so those only exist in production and under a bare `pnpm exec wrangler dev`. Verify anything that lives in the entrypoint with `wrangler dev`, never with `preview`.
- **Satori needs an explicit `display` on any element with more than one child**, and counts adjacent text and expressions as separate children: `pick of {n}` is two children and fails the render with an opaque "failed to pipe response". Use a template string or a flex row. This applies to every `ImageResponse` (`opengraph-image.tsx`, `d/[slug]/card`).

## Viral loops

The draw is the distribution channel: it puts a whole league on one page at one
second. Four surfaces convert that attention, all on `/d/[slug]`:

- **`AnotherLeagueCta`** (`share.tsx`) runs in two variants. After the draw it fires on `isDone`, below the order, with a re-draw branch via `/new?clone=<slug>`. Before it, the same ask sits above the roster (`src=PRE_DRAW`) with no re-draw branch: offering to re-run a league whose first draw has not happened is an invitation to shop for a result. Never in the header.
- **Share panels** — `PreDrawShare` before the draw and `ResultShare` after it, both wrapping one `ShareMenu` (image with the link in the message text / share link / copy / download). The OG image becomes the podium once complete, so a re-paste carries the result, and `card/` is the portrait PNG people post: entrants before the draw, the order after.
- **Calendar invite** (`draft.ics/`) puts the link in a dozen calendars and raises live attendance, which is the input to everything above.
- **Live viewer count** (`presence.tsx` + the Durable Object in `worker/`).

There is no "which team are you" claim and no per-team card: it was localStorage
personalization that earned nothing, and `card/?t=<teamId>` existed only to serve
it. An old `?t=` URL now renders the full order.

`Draft.referrerSlug` and `Draft.entrySource` record where each creator came
from. Every link into `/new` carries its own `?src=` from `ENTRY_SOURCES` in
`src/lib/db-enums.ts`; adding a new entry point means adding a value there, or
the draft silently records `DIRECT`. Attribution is what makes any of this
tunable, so keep it wired.

## IndexNow

This project uses IndexNow to ping participating search engines (Bing, Yandex, Naver, Seznam, Yep) the moment a public URL changes. Google does not participate, so the sitemap still matters for it.

- Key: `INDEXNOW_KEY` in [src/lib/indexnow.ts](src/lib/indexnow.ts), key file at `public/0d280bb4c994c621118dcd0a691c7c8d.txt`. The key is public by design and committed on purpose; the file and the constant must stay byte-identical or every submission 403s. Never move it to env-only.
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

## Punishment wheel

The second draw on the site (VIRAL-LOOPS Tier 2): last place gets one randomized
punishment, sealed at create time and revealed publicly at a scheduled moment. Same
mechanic and same trust argument as a draft order, different noun — and deliberately the
same `fisherYatesShuffle` from `src/lib/randomizer.ts`, so the "here is the code that drew
this, at this commit" link on the results page means something. Position 0 of the shuffle
is the result; the rest of the permutation is discarded. The league watches that result
arrive as an elimination round, not as an announcement (see below).

- **`src/lib/punishment-state.ts` is the only place a wheel's result may be disclosed.**
  The state endpoint, the `/p/[slug]` render, the OG image and the share card all go
  through `serializePunishmentState()`, which returns `chosen: null` until `revealedAt` has
  passed. Never read `chosenPosition` directly in a route — a commissioner who can see the
  answer early can decide not to share the link, and then the whole feature is theatre.
- The candidate options **are** public before the draw, on purpose: seeing the list up
  front is what proves nothing was added, removed or reworded once the answer was known.
- **The wheel eliminates; it never announces.** `src/lib/punishment-spin.ts` owns the
  running order and every timestamp. The wheel physically spins, lands on an option, that
  option is struck out, and it goes again until one is left standing. The survivor is the
  result and the **last elimination lands exactly on `revealedAt`**, so the animation
  finishing and the disclosure rule opening are the same event rather than two things kept
  in sync. Consequences worth knowing before touching any of it:
  - `punishmentRevealedAt(scheduledFor, optionCount)` now needs the option count, because
    `revealedAt = scheduledFor + firstPickDelayMs + spinWindow`. The reveal is the end of
    the spin, not the start. Changing the spin window changes stored reveal times for new
    wheels only, which is the point of storing it.
  - Per-spin duration is `wheelSpinTargetMs` (12s, `PUNISHMENT_SPIN_WINDOW_MS`) split
    across `optionCount - 1` eliminations and clamped to 420..1500ms, so a 3-option wheel
    is unhurried and a 24-option one rattles.
  - Wheels created before this existed have `revealedAt = scheduledFor + 5s`, so
    `wheelSpinPlan` clamps the window to the gap actually available. They spin fast rather
    than starting before the announced time. Never remove that clamp.
  - The running order is **derived, not stored**: a mulberry32 seeded off the public
    `Punishment.seed` shuffles the losing positions. It decides nothing (the result came
    from `crypto.randomInt` at create time) and exists so every viewer sees the same wheel
    land on the same segments, and so the order is checkable afterwards from the seed.
  - Eliminations are filtered by `discloseAt`, so an option the wheel has not reached is
    not in the payload at all. The one deliberate leak is `DISCLOSURE_LEAD_MS` (1.2s) plus
    one spin, which the wheel needs to decelerate into its target. The draft reel already
    makes the same trade with `currentSpin`.
  - The client re-derives the survivor locally once every elimination has landed, gated on
    the same `revealedAt`. That only covers the gap to the next poll; the server is still
    the authority and still the only thing that can say `chosen`.
- The share card (`p/[slug]/card`) is **square** by default, unlike the draft card's
  portrait. A wheel carries one fact, and the destination is a message thread where the
  image is scaled to the bubble width: a tall canvas spent its height on background and
  shrank the punishment to nothing at that size. The punishment is sized off the room
  actually left inside the card, so a two-word result renders as a poster instead of a
  caption floating in a frame. `?format=story` and `?format=wide` are still there for a
  story post and for landscape.

### Punishment ideas database

`/fantasy-football-punishments` reads `PunishmentIdea` where `status = 'APPROVED'`. Every
idea lives in D1, including the ~40 curated ones seeded by `0003_punishment_wheel.sql`, so
that page is **force-dynamic** — unlike every other marketing page. Do not make it static
without first moving the ideas back into git.

Anyone can submit through the modal on that page; submissions land `PENDING` and are never
rendered. Approval is manual SQL, so this app still has no auth and no secrets:

```bash
# Pending queue
pnpm exec wrangler d1 execute fantasy-draft-order-db-production --remote \
  --command "SELECT id, category, label FROM PunishmentIdea WHERE status='PENDING' ORDER BY createdAt"

# Approve — live immediately, the page is dynamic, nothing to redeploy
pnpm exec wrangler d1 execute fantasy-draft-order-db-production --remote \
  --command "UPDATE PunishmentIdea SET status='APPROVED', approvedAt=strftime('%Y-%m-%dT%H:%M:%f','now')||'+00:00' WHERE id='pid_...'"

# Reject
pnpm exec wrangler d1 execute fantasy-draft-order-db-production --remote \
  --command "UPDATE PunishmentIdea SET status='REJECTED' WHERE id='pid_...'"
```

Drop `--remote` for the local database. **Note the timestamp expression**: Prisma stores
SQLite DateTime as RFC3339 text with an explicit `+00:00`, so a plain `CURRENT_TIMESTAMP`
writes a value Prisma cannot read back.

Curated ids (`pid_seed_*`) are hand-written and stable because they travel in
`/punishment/new?ideas=<id>,<id>` links. Add new curated ideas in a **new** migration;
never edit the rows in `0003`, which is already applied.

## Database changes

Prisma Migrate does not drive D1. The two tools split the job:

1. Edit `prisma/schema/*.prisma`.
2. `pnpm db:migrate:new add_my_column` — Prisma diffs the local D1 against the schema and writes `prisma/migrations/NNNN_add_my_column.sql`.
3. **Read the SQL.** SQLite's `ALTER TABLE` is limited, so anything beyond adding a nullable-or-defaulted column comes out as a create-copy-drop-rename table rebuild. That is correct but heavy; on a populated table, hand-write a plain `ALTER TABLE ... ADD COLUMN` instead (see `0002_draft_attribution.sql`).
4. `pnpm db:migrate:local`, then re-run the app.
5. Commit the SQL. The deploy workflow runs `wrangler d1 migrations apply --remote` **before** `wrangler deploy`, so the schema is always ahead of the code that needs it.

## Deploying

Push to `main`. [.github/workflows/deploy.yml](.github/workflows/deploy.yml) runs Pulumi,
builds with OpenNext, provisions/looks up D1, migrates, then deploys the worker. One-time
setup and the manual post-deploy steps are in [docs/DEPLOY.md](docs/DEPLOY.md).

## Env

See [.env.example](.env.example). There is no `DATABASE_URL` and no secrets.
