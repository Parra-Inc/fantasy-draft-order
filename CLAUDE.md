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

## Env

See [.env.example](.env.example).
