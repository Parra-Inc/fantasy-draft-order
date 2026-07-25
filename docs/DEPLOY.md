# Deploying

`fantasyfootballdraftorder.com` runs as a Cloudflare Worker built by OpenNext, backed by
Cloudflare D1. Pushing to `main` runs
[.github/workflows/deploy.yml](../.github/workflows/deploy.yml), which:

1. Runs the Pulumi program in [program/](../program) (Web Analytics, WAF scanner block,
   email routing) so the zone is configured before the app ships.
2. Runs the unit tests. The randomizer is the product's trust story, so the deploy is
   gated on it.
3. Builds with `turbo run build:cf`.
4. Resolves the D1 database to an explicit id, creating it only if missing.
5. Replays every migration into an empty local database and fails the deploy if the
   result does not match `prisma/schema`. Catches a hand-written migration that drifted
   before it reaches production, rather than half-applying it there.
6. Applies pending migrations with `wrangler d1 migrations apply --remote`, **before**
   the deploy, so new code never meets a table that does not exist yet.
7. `wrangler deploy`.

Migrations are steps of this pipeline, not a workflow of their own. The one exception is
the very first migration of a brand new database, which has to happen before there is a
deploy to hang it off (see [Moving the Neon data into D1](#moving-the-neon-data-into-d1)).

There is no secret-push step. The database is a binding, so there is no `DATABASE_URL`,
and the app has no third-party API keys. Every non-secret value is committed in
[wrangler.jsonc](../wrangler.jsonc).

## One-time setup

### 1. Repo secrets and variables

Parra-Inc is on GitHub Free, where private repos cannot read org-level secrets, so these
are set per-repo. The `cloudflare-env` skill fans the Cloudflare ones out.

| Secret | Purpose |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Worker deploys, D1, and the Pulumi Cloudflare provider |
| `CLOUDFLARE_S3_ACCESS_KEY_ID` / `CLOUDFLARE_S3_SECRET_ACCESS_KEY` | R2 key used as the `AWS_*` creds for the Pulumi state backend |
| `PULUMI_CONFIG_PASSPHRASE` | Encrypts Pulumi secret config/state. Losing it means losing state decryption |
| `INFRA_INSTALL_TOKEN` | PAT with read access to Parra-Inc repos, so npm can install the private `@parra/cloudflare-pulumi` package |

| Variable | Value |
| --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | `b428f294c89acfbe189aa1556f15cc07` |
| `PULUMI_STATE_BUCKET` | `pulumi-state` |
| `R2_ENDPOINT_HOST` | `b428f294c89acfbe189aa1556f15cc07.r2.cloudflarestorage.com` |

The API token needs **Workers Scripts:Edit**, **D1:Edit**, **Workers R2 Storage:Edit**,
and **Zone:Edit**. D1:Edit is the one the other repos' tokens may not have yet: without
it, the provision and migrate steps fail.

Check what is already set:

```bash
gh secret list   --repo Parra-Inc/fantasy-draft-order
gh variable list --repo Parra-Inc/fantasy-draft-order
```

### 2. GitHub environment

The deploy job targets the `production` environment. It holds no secrets here, but the
environment must exist (Settings -> Environments -> New environment -> `production`), and
it is the right place to add a required reviewer if you ever want deploys gated.

### 3. Commit the D1 id

Whichever step first creates `fantasy-draft-order-db-production` (the deploy, the
migrations workflow, or the cutover below) substitutes its id into `wrangler.jsonc` at
build time. Grab it afterwards and commit it, so every later run skips the lookup:

```bash
pnpm exec wrangler d1 info fantasy-draft-order-db-production --json | jq -r '.uuid'
# paste over REPLACE_WITH_D1_ID in wrangler.jsonc
```

If there is Neon data to bring over, do that **before** the first deploy: see
[Moving the Neon data into D1](#moving-the-neon-data-into-d1).

## Moving the Neon data into D1

The Vercel-era database still holds every draft created before the move. Migrate it
**before** the first deploy, not after: the worker owns the custom domain the moment it
ships, and a live site with an empty database is a site where every existing `/d/<slug>`
404s and the five scheduled draws never happen.

That means the database has to exist and be migrated ahead of the deploy that would
normally create it. Migrations are a step of the deploy pipeline, not a workflow you can
run on their own, so this first one is done from a laptop:

```bash
# 1. Create the database and apply the schema, without deploying anything.
pnpm exec wrangler d1 create fantasy-draft-order-db-production
pnpm exec wrangler d1 info fantasy-draft-order-db-production --json | jq -r '.uuid'
# paste over REPLACE_WITH_D1_ID in wrangler.jsonc and commit it
pnpm db:migrate:remote

# 2. Export from Neon. Reads DATABASE_URL from .env.production, writes
#    prisma/data/neon-export.sql. Touches neither database.
pnpm neon:export

# 3. Rehearse against the local D1 and open the app against it.
pnpm dev:force        # fresh local database
pnpm neon:import:local
pnpm dev              # spot-check a few /d/<slug> pages and the upcoming draws

# 4. Load production, then verify.
pnpm neon:import:remote
pnpm exec wrangler d1 execute fantasy-draft-order-db-production --remote \
  --command="select count(*) from Draft"
```

Then deploy (push to `main`) and re-check the scheduled draws on the real domain.

Notes on what the export does and does not carry, all of it enforced in
[scripts/migrate-neon-to-d1.mjs](../scripts/migrate-neon-to-d1.mjs):

- **`prisma/data/` is gitignored and must stay that way.** The export contains real
  creator email addresses and this repo is public. That is why the data load is a laptop
  step rather than a committed migration CI applies: the one part of the deploy that is
  deliberately manual.
- **Timestamps are formatted by Postgres, not by JavaScript.** The columns are
  `timestamp without time zone` holding UTC, and node-postgres parses those in the local
  zone: letting a JS `Date` into that path shifts every draft time by the exporting
  machine's UTC offset, silently and uniformly. Prisma's SQLite DateTime is RFC3339 text
  with an explicit `+00:00`, and the script asserts that shape on every value.
- **Dropped:** `Draft.status`, `startedAt`, `completedAt` (all derived from the picks now,
  see [src/lib/reveal.ts](../src/lib/reveal.ts)) and `qstashMessageId` (died with the
  QStash scheduler).
- **Defaulted:** `referrerSlug` is NULL and `entrySource` is `DIRECT` for every migrated
  draft. Neither column existed in Postgres, so there is nothing to attribute
  retroactively; expect the attribution numbers to only mean anything post-cutover.
- **Skipped:** two launch-day drafts (`indigo-mustang-mn39`, `jade-kraken-ab77`) that have
  no seed and no picks, so they never drew an order and would import as permanently
  SCHEDULED pages for a date in April. Their URLs 404 after the cutover; they were never
  indexed, because `/d/<slug>` is `noindex` until the last pick reveals. `pnpm neon:export
  --include-orphans` keeps them instead.
- **`Feedback` has no Postgres counterpart** and is empty on both sides.

Once production is verified, `pg` and `scripts/migrate-neon-to-d1.mjs` can be deleted:
nothing else in the app talks to Postgres.

## After the first deploy

1. **Custom domains.** Confirm `fantasyfootballdraftorder.com` and
   `www.fantasyfootballdraftorder.com` both resolve. Cloudflare creates the DNS records
   and certificates automatically from the `routes` block; `www` is 301'd to the apex in
   [custom-worker.ts](../custom-worker.ts).
2. **Verify the IndexNow key file** before submitting anything:
   ```bash
   curl -s https://fantasyfootballdraftorder.com/0d280bb4c994c621118dcd0a691c7c8d.txt
   ```
   It must return the key verbatim. Every submission 403s until it does.
3. **Backfill IndexNow once.** Every URL is new on this origin, so this is the one time
   the whole sitemap is the right payload:
   ```bash
   pnpm indexnow:submit --sitemap
   ```
   After that, only submit URLs that actually changed.
4. **Google Search Console.** Add the new property and submit
   `https://fantasyfootballdraftorder.com/sitemap.xml`. Google does not participate in
   IndexNow, so the sitemap is the only channel for it.
5. **Confirm the Pulumi resources** exist on the zone: Web Analytics is collecting, the
   WAF scanner rule is present, and the email destination is verified (Cloudflare emails
   a confirmation link the first time).
6. **Run a real draft** end to end and watch the reveal.

## Rolling back

```bash
pnpm exec wrangler rollback
```

Rollback reverts the worker code only. It does **not** revert D1 migrations, which is why
migrations must stay additive: a rollback puts old code in front of a newer schema, and
that only stays safe if the new schema is backwards compatible.

## Local equivalents

```bash
pnpm build:cf                 # exactly what CI builds
pnpm exec wrangler deploy --dry-run --outdir /tmp/dry   # validates bindings and config
pnpm preview                  # build + run the real worker in workerd, against local D1
```

`pnpm preview` runs with `NODE_ENV=production`, which means IndexNow submissions are
**not** stubbed out. Completing a draft in preview will fire a real ping for a URL that
does not exist publicly. Harmless (the engines just fail to fetch it) but worth knowing
before you wonder where a submission came from.

If a local build fails Zod validation on `NEXT_PUBLIC_BASE_URL`, check `.env.production`:
`next build` loads it, and a stale one from the Vercel era will override your shell.

## The Vercel deployment

`fantasy-draft-order.vercel.app` still exists and still builds this repo, but only as a
permanent redirect to the canonical host (see the `redirects()` block in
[next.config.ts](../next.config.ts)). It must keep building, which is why nothing in the
app throws at import time when there is no D1 binding and no `DATABASE_URL`.

Its Neon Postgres database is read-only history once the cutover above is done. Leave it
up until a full draft cycle has run on D1, then delete the Neon project and drop
`DATABASE_URL` from `.env.production`.
