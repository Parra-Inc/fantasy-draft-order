@AGENTS.md

# Fantasy Draft Order

Open-source website for transparent, scheduled fantasy football draft order randomization. League creates a draft, everyone watches the order drawn live at a pre-announced time. Code is public so the randomizer cannot be questioned.

## Principles

- **No auth, no editing.** Once a draft is scheduled it is immutable. The commissioner cannot tamper with it after the fact — that is the product.
- **Open source is the trust story.** The randomizer lives in `src/lib/randomizer.ts` and is linked at the exact commit SHA from every `/d/[slug]` results page.
- **Synchronized reveal.** All viewers poll the same state endpoint with SWR; picks are revealed server-side with staggered `revealedAt` timestamps so the animation is identical everywhere.

## Stack

- Next.js 16 (App Router, Turbopack) + React 19 + TypeScript strict
- Tailwind CSS 4 + shadcn/ui + Lucide + Motion
- Prisma 7 with `@prisma/adapter-pg`, multi-file schema, prefixed IDs (`drf_`, `tm_`, `pck_`)
- Postgres 16 via Docker (port 5438)
- Upstash QStash for one-shot delayed draft fires
- SWR for client polling, Zod for validation

## Commands

```bash
pnpm docker:up    # start docker services (Postgres)
pnpm docker:down  # stop docker services
pnpm db:sync      # validate + generate + push schema
pnpm db:seed      # sync + run prisma/seed.ts (creates demo-league)
pnpm db:studio    # Prisma Studio
pnpm dev          # Next.js dev on :3000
pnpm test         # Vitest
```

## Structure

```
src/
  app/
    (marketing)/        # Public landing, how-it-works, about
    d/[slug]/           # Public draft view (pre-draw + live + results)
    new/                # Create draft form
    api/
      drafts/           # POST create, GET state, GET importers
      jobs/run-draft/   # QStash webhook — runs the randomizer
  lib/
    prisma.ts           # Singleton client with PrismaPg adapter
    qstash.ts           # QStash client + scheduleDraft(draftId, fireAt)
    randomizer.ts       # Fisher–Yates using node:crypto randomInt (PURE, TESTED)
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
- `runDraft` must be idempotent: if status ≠ SCHEDULED, return 200 no-op.
- Randomness comes only from `node:crypto`'s `randomInt`. Never `Math.random`.
- The randomizer is pure — it takes a `rng: () => number` so tests can inject a deterministic sequence.
- `revealedAt` timestamps stagger picks by ~1s so clients can animate the reveal without coordination.

## Env

See [.env.example](.env.example). For local QStash webhook testing, expose localhost via ngrok and set `NEXT_PUBLIC_BASE_URL` to the tunnel URL.
