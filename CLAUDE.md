@AGENTS.md

# Fantasy Draft Order

Open-source website for transparent, scheduled fantasy football draft order randomization. League creates a draft, everyone watches the order drawn live at a pre-announced time. Code is public so the randomizer cannot be questioned.

## Principles

- **No auth, no editing.** Once a draft is scheduled it is immutable. The commissioner cannot tamper with it after the fact — that is the product.
- **Open source is the trust story.** The randomizer lives in `src/lib/randomizer.ts` and is linked at the exact commit SHA from every `/d/[slug]` results page.
- **Synchronized reveal.** All viewers poll the same state endpoint with SWR; picks are revealed server-side with staggered `revealedAt` timestamps so the animation is identical everywhere.
- **No background jobs.** The randomized order and per-pick `revealedAt` timestamps are written in the create-draft transaction. The state endpoint just filters by `revealedAt <= now`. No queues, no schedulers — passage of time is the trigger.

## Stack

- Next.js 16 (App Router, Turbopack) + React 19 + TypeScript strict
- Tailwind CSS 4 + shadcn/ui + Lucide + Motion
- Prisma 7 with `@prisma/adapter-pg`, multi-file schema, prefixed IDs (`drf_`, `tm_`, `pck_`)
- Postgres 16 via Docker (port 5438)
- SWR for client polling, Zod for validation

## Commands

```bash
pnpm dev          # Orchestrated: frees ports, starts Postgres, syncs DB, runs Next on :3042 + infra logs in a TUI
pnpm dev:force    # Same as dev, but tears down volumes and re-seeds
pnpm up           # start docker services (Postgres)
pnpm down         # stop docker services
pnpm db:sync      # validate + generate + push schema
pnpm db:seed      # sync + run prisma/seed.ts (creates demo-league)
pnpm db:studio    # Prisma Studio on :5564
pnpm test         # Vitest
```

## Ports

- Web (Next.js): **3042**
- Postgres: **5438**
- Prisma Studio: **5564**

## Structure

```
src/
  app/
    (marketing)/        # Public landing, how-it-works, about
    d/[slug]/           # Public draft view (pre-draw + live + results)
    new/                # Create draft form
    api/
      drafts/           # POST create (writes order + reveal timestamps), GET state, GET importers
  lib/
    prisma.ts           # Singleton client with PrismaPg adapter
    randomizer.ts       # Fisher–Yates using node:crypto randomInt (PURE, TESTED)
    reveal.ts           # Reveal timing config + deriveStatus from picks
    slug.ts             # Memorable slug generator
    importers/          # sleeper / mfl / fleaflicker / espn
prisma/
  schema/               # Multi-file Prisma schema
  seed.ts
dev/
  docker-compose.yml    # Postgres :5438
```

## Conventions

- API routes under `app/api/` use Zod at the boundary, return `NextResponse.json(...)` with typed errors.
- IDs are prefixed and generated via `dbgenerated()` in Prisma — do not pass IDs from the app.
- Randomness comes only from `node:crypto`'s `randomInt`. Never `Math.random`.
- The randomizer is pure — it takes a `rng: () => number` so tests can inject a deterministic sequence.
- `revealedAt` timestamps stagger picks (default first-pick delay 5s, interval 7s, configurable via `DRAFT_FIRST_PICK_DELAY_MS` / `DRAFT_PICK_INTERVAL_MS`).
- Status is derived (never stored): `SCHEDULED` until first `revealedAt`, `DRAWING` while some picks remain hidden, `COMPLETED` once the last pick's time has passed.

## IndexNow

This project uses IndexNow to ping participating search engines (Bing, Yandex, Naver, Seznam, Yep) the moment a public URL changes. Google does not participate, so the sitemap still matters for it.

- Key: `INDEXNOW_KEY` in [src/lib/indexnow.ts](src/lib/indexnow.ts), key file at `public/0d280bb4c994c621118dcd0a691c7c8d.txt`. The key is public by design and committed on purpose; the file and the constant must stay byte-identical or every submission 403s. Never move it to env-only.
- Host: submissions go out on `PRODUCTION_SITE_URL` = `https://fantasy-draft-order.vercel.app`, the origin this app is actually served from and the only one that serves the key file. It must stay identical to the production `NEXT_PUBLIC_BASE_URL` behind canonicals, `robots.ts` and `sitemap.ts`. If a custom domain is attached to the Vercel project later, update the env var, `PRODUCTION_SITE_URL`, and the default in `scripts/indexnow-submit.mjs` together, and confirm `/<key>.txt` resolves on the new origin first. Note that `fantasydraftorder.com` is an unrelated site: never submit URLs on it.

When making changes that add, update, delete, or rename any publicly indexable page:

- Call `queueIndexNowSubmission(url)` in the code path that publishes the change. It wraps the ping in `after()` so the serverless invocation stays alive until the POST settles, and it never blocks or throws. (`submitToIndexNow(url)` is the awaitable form and returns whether the engines accepted it.)
- On slug renames, submit both the old and new URLs.
- On deletions, submit the deleted URL so engines drop it.
- Never submit unchanged URLs or the full sitemap; submissions count toward crawl quota.
- New page types (routes, models with public pages) must wire their publish/update/delete flows into the helper before shipping.

Already wired:

- `/d/<slug>` is `noindex` until the last pick is revealed, so nothing is submitted when a draft is created. `submitCompletedDraft(slug, completedAt)` handles the transition and is called from `GET /api/drafts/[slug]/state` (viewers polling the draw see it first) and from the `d/[slug]` page render (covers draws nobody watched live, which is why that route is `force-dynamic`). It dedupes per instance, releasing the slug again if the submission was not accepted so a later request retries, and skips drafts that completed more than 24h ago. Tradeoff of that window: a draft nobody polls or visits within 24h of finishing is never pinged and reaches engines through `sitemap.xml` instead. Closing that gap needs a cron, which this app does not have.
- Static pages (landing pages, guides, `/`, `/new`) ship with a deploy and have no runtime publish event. After deploying a new or rewritten one, submit it manually: `pnpm indexnow:submit /guides/my-new-guide`. The same script takes `--sitemap` for a one-time backfill and `--dry-run` to print the payload.

## Env

See [.env.example](.env.example).
