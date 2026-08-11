#!/usr/bin/env bash
#
# Local equivalent of .github/workflows/deploy.yml, for when GitHub Actions is
# unavailable. Deploys this project to Cloudflare production.
#
# ── THIS FILE IS FLEET-SHARED ────────────────────────────────────────────────
#
# Byte-identical in every Cloudflare repo. It has no project-specific values in
# it and must not gain any: everything it needs is either detected from the repo
# or read from an optional `scripts/deploy.config.sh`. Fix a bug here and copy
# the whole file to the other repos rather than patching them individually.
#
# Derived from the hand-written scripts in revenue-hog and tax-days, which
# predate it and are the source of every hard-won rule below.
#
# ── WHAT IT DETECTS ──────────────────────────────────────────────────────────
#
#   app directory   the directory holding wrangler.json/jsonc/toml
#   package manager pnpm / npm / bun, from the lockfile
#   build script    build:cf, else build, else none
#   infra           a top-level program/ directory means Pulumi
#   migrations      prisma/schema.prisma, or migrations/ plus a d1_databases
#                   binding in the wrangler config
#   indexnow        an "indexnow" script in the app's package.json
#
# Run `bash scripts/deploy.sh --detect` to print what it found and exit. Do that
# first in a repo that has never used this script.
#
# ── WHY THIS IS PARANOID ─────────────────────────────────────────────────────
#
# CI only ever deploys what is committed on the default branch, one run at a
# time, from a clean checkout. None of that is true of a laptop, so the
# preflight re-imposes it and every irreversible step asks first.
#
# The genuinely irreversible steps are a Pulumi update (it can delete live DNS),
# a migration (it rewrites production data), and a secret rotation (the old
# value stops working immediately). Deploying the Worker itself is NOT
# irreversible: it is versioned, and redeploying the previous commit rolls back.
#
# ── CONFIG ───────────────────────────────────────────────────────────────────
#
# Optional `scripts/deploy.config.sh`, sourced if present. Every value optional:
#
#   APP_DIR="apps/web"                  override the detected app directory
#   BUILD_CMD="pnpm exec turbo run build:cf --filter=my-web"
#   SITE_URL="https://example.com"      exported as NEXT_PUBLIC_SITE_URL
#   REQUIRED_SECRETS=(NAME:ENV_VAR)     prompted for if absent everywhere
#   OPTIONAL_SECRETS=(NAME:ENV_VAR)     skipped with a warning if absent
#   MIGRATE_BY_DEFAULT=1                migrate on every deploy, as CI does
#                                       (default is opt-in: --migrate only)
#
# Credentials:
#   ~/Developer/Repos/.env.prod   fleet-wide Cloudflare / Pulumi / R2. Exported
#                                 by ~/.zshrc, so an interactive shell has them
#                                 already; read here only as a fallback.
#   ./.env.prod / ./.env.prod.local   this repo's own runtime secrets, optional.
#
# Usage:
#   bash scripts/deploy.sh                   full deploy, prompting each step
#   bash scripts/deploy.sh --detect          print detection and exit
#   bash scripts/deploy.sh --preview         Pulumi diff only, changes nothing
#   bash scripts/deploy.sh --skip-infra      app only (zone already active)
#   bash scripts/deploy.sh --infra-only      Pulumi only
#   bash scripts/deploy.sh --install         install dependencies first
#   bash scripts/deploy.sh --migrate         run pending migrations (opt-in)
#   bash scripts/deploy.sh --skip-migrate    never touch the database
#   bash scripts/deploy.sh --skip-secrets    don't touch worker secrets
#   bash scripts/deploy.sh --rotate-secrets  re-push every configured secret
#   bash scripts/deploy.sh --skip-indexnow   deploy without pinging IndexNow
#   bash scripts/deploy.sh --yes             answer every prompt with yes
#   bash scripts/deploy.sh --allow-dirty     deploy despite uncommitted changes
#   bash scripts/deploy.sh --allow-branch    deploy from a non-default branch

set -euo pipefail

cd "$(dirname "$0")/.."
ROOT=$(pwd)

FLEET_ENV="$HOME/Developer/Repos/.env.prod"
LAST_DEPLOY="$ROOT/.last-deploy-sha"

SKIP_INFRA=0
INFRA_ONLY=0
PREVIEW=0
DO_INSTALL=0
DO_MIGRATE=-1        # -1 = decide from detection, 0 = never, 1 = yes
SKIP_SECRETS=0
ROTATE_SECRETS=0
SKIP_INDEXNOW=0
ASSUME_YES=0
ALLOW_DIRTY=0
ALLOW_BRANCH=0
DETECT_ONLY=0

for arg in "$@"; do
  case "$arg" in
    --detect)         DETECT_ONLY=1 ;;
    --skip-infra)     SKIP_INFRA=1 ;;
    --infra-only)     INFRA_ONLY=1 ;;
    --preview)        PREVIEW=1; INFRA_ONLY=1 ;;
    --install)        DO_INSTALL=1 ;;
    --migrate)        DO_MIGRATE=1 ;;
    --skip-migrate)   DO_MIGRATE=0 ;;
    --skip-secrets)   SKIP_SECRETS=1 ;;
    --rotate-secrets) ROTATE_SECRETS=1 ;;
    --skip-indexnow)  SKIP_INDEXNOW=1 ;;
    --yes|-y)         ASSUME_YES=1 ;;
    --allow-dirty)    ALLOW_DIRTY=1 ;;
    --allow-branch)   ALLOW_BRANCH=1 ;;
    *) echo "Unknown flag: $arg" >&2; exit 2 ;;
  esac
done

step() { printf '\n\033[1;36m==> %s\033[0m\n' "$1"; }
warn() { printf '\033[1;33m  ! %s\033[0m\n' "$1" >&2; }
die()  { printf '\033[1;31m  x %s\033[0m\n' "$1" >&2; exit 1; }

# `[ -r /dev/tty ]` reports readable even with no controlling terminal, then the
# open fails. Actually opening it is the only reliable test.
have_tty() { { : > /dev/tty; } 2>/dev/null; }

confirm() {
  if [ "$ASSUME_YES" -eq 1 ]; then
    printf '  [--yes] %s\n' "$1"
    return 0
  fi
  have_tty || die "$1 -- no terminal to confirm on. Re-run with --yes if this is intentional."
  printf '\n\033[1;33m  %s\033[0m [y/N] ' "$1" > /dev/tty
  local reply=""
  read -r reply < /dev/tty
  case "$reply" in
    [yY]|[yY][eE][sS]) return 0 ;;
    *) die "Aborted." ;;
  esac
}

# Dotenv files, NOT shell scripts. Never `source` them: a value containing
# spaces (a PEM, a webhook URL with options) is legal dotenv but would be
# executed as a command. Parsing keeps every value as data.
load_env_file() {
  local file="$1" line k v
  [ -r "$file" ] || return 0
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in ''|'#'*) continue ;; esac
    case "$line" in [A-Za-z_]*=*) ;; *) continue ;; esac
    k="${line%%=*}"; v="${line#*=}"
    case "$v" in
      \"*\") v="${v#\"}"; v="${v%\"}" ;;
      \'*\') v="${v#\'}"; v="${v%\'}" ;;
    esac
    export "$k=$v"
  done < "$file"
}

# ── Detection ─────────────────────────────────────────────────────────────────
REQUIRED_SECRETS=()
OPTIONAL_SECRETS=()
APP_DIR=""
BUILD_CMD=""
SITE_URL=""
MIGRATE_BY_DEFAULT=0

# Our own committed file, so sourcing is correct here (unlike the dotenvs above).
# shellcheck source=/dev/null
[ -r "$ROOT/scripts/deploy.config.sh" ] && . "$ROOT/scripts/deploy.config.sh"

find_app_dir() {
  local c
  for c in apps/web web app .; do
    for f in wrangler.jsonc wrangler.json wrangler.toml; do
      [ -f "$ROOT/$c/$f" ] && { echo "${c#./}"; return; }
    done
  done
  # Fall back to a search, excluding node_modules and build output.
  c=$(find "$ROOT" -maxdepth 3 \( -name wrangler.jsonc -o -name wrangler.json -o -name wrangler.toml \) \
        -not -path '*/node_modules/*' -not -path '*/.next/*' -not -path '*/.open-next/*' 2>/dev/null | head -1)
  [ -n "$c" ] && dirname "${c#"$ROOT"/}" || echo ""
}

[ -n "$APP_DIR" ] || APP_DIR=$(find_app_dir)
[ -n "$APP_DIR" ] || die "No wrangler config found. This does not look like a Cloudflare Workers repo."
APP="$ROOT/$APP_DIR"
[ "$APP_DIR" = "." ] && APP="$ROOT"

WRANGLER_CFG=""
for f in wrangler.jsonc wrangler.json wrangler.toml; do
  [ -f "$APP/$f" ] && { WRANGLER_CFG="$APP/$f"; break; }
done

if   [ -f "$ROOT/pnpm-lock.yaml" ];   then PM=pnpm
elif [ -f "$ROOT/bun.lockb" ];        then PM=bun
elif [ -f "$ROOT/package-lock.json" ];then PM=npm
else PM=npm
fi

pkg_has_script() {
  [ -f "$APP/package.json" ] || return 1
  node -e "const s=require('$APP/package.json').scripts||{};process.exit(s['$1']?0:1)" 2>/dev/null
}

if [ -z "$BUILD_CMD" ]; then
  if   pkg_has_script build:cf; then BUILD_CMD="$PM run build:cf"
  elif pkg_has_script build;    then BUILD_CMD="$PM run build"
  else BUILD_CMD=""
  fi
fi

HAS_PULUMI=0
if [ -d "$ROOT/program" ]; then HAS_PULUMI=1; fi
HAS_INDEXNOW=0
if pkg_has_script indexnow; then HAS_INDEXNOW=1; fi

MIGRATE_KIND=none
if compgen -G "$ROOT/prisma/schema.prisma" >/dev/null 2>&1 \
  || compgen -G "$ROOT/prisma/schema/*.prisma" >/dev/null 2>&1 \
  || compgen -G "$APP/prisma/schema.prisma" >/dev/null 2>&1 \
  || compgen -G "$APP/prisma/schema/*.prisma" >/dev/null 2>&1; then
  MIGRATE_KIND=prisma
elif [ -d "$ROOT/migrations" ] && grep -q 'd1_databases' "$WRANGLER_CFG" 2>/dev/null; then
  MIGRATE_KIND=d1
fi

# Migrations rewrite production data, so they are OPT-IN: this script is shared
# across repos whose databases it has never seen, and a generic script guessing
# at someone's production data is how you lose it. Pass --migrate, or set
# MIGRATE_BY_DEFAULT=1 in scripts/deploy.config.sh once a repo has established
# that migrating on every deploy is right for it (that is what CI does).
if [ "$DO_MIGRATE" -eq -1 ]; then
  if [ "$MIGRATE_KIND" != none ] && [ "$MIGRATE_BY_DEFAULT" -eq 1 ]; then DO_MIGRATE=1; else DO_MIGRATE=0; fi
fi

WORKER=""
if [ -n "$WRANGLER_CFG" ]; then
  case "$WRANGLER_CFG" in
    *.toml) WORKER=$(grep -oE '^[[:space:]]*name[[:space:]]*=[[:space:]]*"[^"]+"' "$WRANGLER_CFG" 2>/dev/null | head -1 | sed 's/.*"\([^"]*\)"$/\1/' || true) ;;
    *)      WORKER=$(grep -oE '"name"[[:space:]]*:[[:space:]]*"[^"]+"' "$WRANGLER_CFG" 2>/dev/null | head -1 | sed 's/.*"\([^"]*\)"$/\1/' || true) ;;
  esac
fi

if [ -z "$SITE_URL" ] && [ -n "$WRANGLER_CFG" ]; then
  SITE_URL=$(grep -oE '"NEXT_PUBLIC_SITE_URL"[[:space:]]*:[[:space:]]*"[^"]+"' "$WRANGLER_CFG" 2>/dev/null | head -1 | sed 's/.*"\([^"]*\)"$/\1/' || true)
fi
if [ -n "$SITE_URL" ]; then export NEXT_PUBLIC_SITE_URL="$SITE_URL"; fi

if [ "$DETECT_ONLY" -eq 1 ]; then
  echo "Detected for $(basename "$ROOT"):"
  echo "  app dir     : $APP_DIR"
  echo "  wrangler    : ${WRANGLER_CFG#"$ROOT"/}"
  echo "  worker      : ${WORKER:-unknown}"
  echo "  pkg manager : $PM"
  echo "  build       : ${BUILD_CMD:-<none, deploying without a build>}"
  echo "  site url    : ${SITE_URL:-<not set>}"
  echo "  infra       : $([ "$HAS_PULUMI" -eq 1 ] && echo 'Pulumi (program/)' || echo none)"
  echo "  migrations  : $MIGRATE_KIND"
  echo "  indexnow    : $([ "$HAS_INDEXNOW" -eq 1 ] && echo yes || echo no)"
  echo "  secrets     : ${#REQUIRED_SECRETS[@]} required, ${#OPTIONAL_SECRETS[@]} optional"
  exit 0
fi

# ── Credentials ───────────────────────────────────────────────────────────────
if [ -z "${CLOUDFLARE_API_TOKEN:-}" ] || [ -z "${CLOUDFLARE_ACCOUNT_ID:-}" ]; then
  load_env_file "$FLEET_ENV"
fi
load_env_file "$ROOT/.env.prod"
load_env_file "$ROOT/.env.prod.local"

for required in CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID; do
  [ -n "${!required:-}" ] || die "$required is not set. Open a new shell (.zshrc exports it) or check $FLEET_ENV."
done

SECRETS_FILE=""
cleanup() {
  [ -n "$SECRETS_FILE" ] && rm -f "$SECRETS_FILE" "$SECRETS_FILE.tmp"
  return 0
}
trap cleanup EXIT INT TERM

# ── Preflight ─────────────────────────────────────────────────────────────────
step "Preflight"

git rev-parse --git-dir >/dev/null 2>&1 || die "Not a git repository."

BRANCH=$(git rev-parse --abbrev-ref HEAD)
SHA=$(git rev-parse --short HEAD)
FULL_SHA=$(git rev-parse HEAD)
SUBJECT=$(git log -1 --pretty=%s)

DEFAULT_BRANCH=$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null | sed 's|^origin/||')
: "${DEFAULT_BRANCH:=main}"

if [ -n "$(git status --porcelain)" ]; then
  echo "  Uncommitted changes:"
  git status --short | sed 's/^/    /'
  if [ "$ALLOW_DIRTY" -eq 0 ]; then
    die "Working tree is not clean. Commit or stash first, or pass --allow-dirty."
  fi
  warn "Deploying a dirty tree (--allow-dirty). What ships will not match any commit."
fi

if [ "$BRANCH" != "$DEFAULT_BRANCH" ]; then
  if [ "$ALLOW_BRANCH" -eq 0 ]; then
    die "On '$BRANCH', not '$DEFAULT_BRANCH'. Merge first, or pass --allow-branch."
  fi
  warn "Deploying from '$BRANCH' instead of '$DEFAULT_BRANCH' (--allow-branch)."
fi

SYNC="no upstream"
if git rev-parse --abbrev-ref --symbolic-full-name '@{u}' >/dev/null 2>&1; then
  if git fetch --quiet origin "$BRANCH" 2>/dev/null; then
    counts=$(git rev-list --left-right --count "@{u}...HEAD" 2>/dev/null || printf '0\t0')
    BEHIND=$(echo "$counts" | cut -f1)
    AHEAD=$(echo "$counts" | cut -f2)
    if [ "$BEHIND" -gt 0 ]; then
      die "$BEHIND commit(s) behind @{u}. Pull first; deploying would roll production back."
    fi
    if [ "$AHEAD" -gt 0 ]; then
      warn "$AHEAD unpushed commit(s). Production would run code that is not on the remote."
      SYNC="$AHEAD commit(s) ahead of @{u}, not pushed"
    else
      SYNC="up to date with @{u}"
    fi
  else
    warn "Could not fetch from origin; skipping the ahead/behind check."
    SYNC="unverified (fetch failed)"
  fi
else
  warn "Branch has no upstream; cannot verify it matches the remote."
fi

# CI serializes itself with a concurrency group, which a local run is not part of.
if command -v gh >/dev/null 2>&1; then
  INFLIGHT=$(gh run list --workflow=deploy.yml --status in_progress --json databaseId --jq 'length' 2>/dev/null || echo 0)
  QUEUED_CI=$(gh run list --workflow=deploy.yml --status queued --json databaseId --jq 'length' 2>/dev/null || echo 0)
  if [ "${INFLIGHT:-0}" -gt 0 ] || [ "${QUEUED_CI:-0}" -gt 0 ]; then
    warn "A GitHub Actions deploy is in progress or queued. Two deploys can interleave badly."
    confirm "Continue anyway?"
  fi
fi

INDEXNOW_BASE=""
INDEXNOW_NOTE="n/a"
if [ "$HAS_INDEXNOW" -eq 1 ]; then
  if [ -r "$LAST_DEPLOY" ]; then
    INDEXNOW_BASE=$(tr -d '[:space:]' < "$LAST_DEPLOY")
    git cat-file -e "${INDEXNOW_BASE}^{commit}" 2>/dev/null || INDEXNOW_BASE=""
  fi
  if [ -z "$INDEXNOW_BASE" ]; then
    INDEXNOW_BASE=$(git rev-parse HEAD~1 2>/dev/null || echo "")
    INDEXNOW_NOTE="HEAD~1 (no .last-deploy-sha yet)"
  else
    INDEXNOW_NOTE="$(git rev-parse --short "$INDEXNOW_BASE") from .last-deploy-sha"
  fi
fi

echo "  Worker      : ${WORKER:-unknown}"
echo "  Account     : $CLOUDFLARE_ACCOUNT_ID"
if [ -n "$SITE_URL" ]; then echo "  Site URL    : $SITE_URL"; fi
echo "  Branch      : $BRANCH ($SHA) $SUBJECT"
echo "  Sync        : $SYNC"
echo "  Infra       : $([ "$HAS_PULUMI" -eq 1 ] && { [ "$SKIP_INFRA" -eq 1 ] && echo 'skipped' || echo 'Pulumi prod'; } || echo 'none')"
if [ "$DO_MIGRATE" -eq 1 ]; then
  echo "  Migrations  : $MIGRATE_KIND"
elif [ "$MIGRATE_KIND" != none ]; then
  echo "  Migrations  : $MIGRATE_KIND detected but NOT running (pass --migrate)"
else
  echo "  Migrations  : none"
fi
echo "  Secrets     : $([ "$SKIP_SECRETS" -eq 1 ] && echo 'skipped' || { [ "$ROTATE_SECRETS" -eq 1 ] && echo 'ROTATE ALL' || echo 'reconcile missing only'; })"
echo "  IndexNow    : $([ "$HAS_INDEXNOW" -eq 1 ] && { [ "$SKIP_INDEXNOW" -eq 1 ] && echo 'skipped' || echo "changed since $INDEXNOW_NOTE"; } || echo 'n/a')"

if [ "$PREVIEW" -eq 0 ]; then
  confirm "Deploy to PRODUCTION with the settings above?"
fi

# ── Infra ─────────────────────────────────────────────────────────────────────
if [ "$HAS_PULUMI" -eq 1 ] && [ "$SKIP_INFRA" -eq 0 ]; then
  step "Pulumi"

  export AWS_ACCESS_KEY_ID="${CLOUDFLARE_S3_ACCESS_KEY_ID:-}"
  export AWS_SECRET_ACCESS_KEY="${CLOUDFLARE_S3_SECRET_ACCESS_KEY:-}"
  export AWS_REGION=auto

  # CI writes this token into the runner's global git config because the runner
  # is destroyed afterwards. NEVER do that here: it would persist
  # INFRA_INSTALL_TOKEN in ~/.gitconfig (644) forever and rewrite every
  # github.com URL for every repo on this machine. GIT_CONFIG_COUNT applies the
  # same rewrite for these processes only, with nothing written to disk.
  if [ -n "${INFRA_INSTALL_TOKEN:-}" ]; then
    export GIT_CONFIG_COUNT=1
    export GIT_CONFIG_KEY_0="url.https://x-access-token:${INFRA_INSTALL_TOKEN}@github.com/.insteadOf"
    export GIT_CONFIG_VALUE_0="https://github.com/"
  fi

  run_pulumi() {
    (
      cd "$ROOT/program"
      # Git dependencies fail to install on node 24; CI pins node 22.
      if [ -s "$HOME/.nvm/nvm.sh" ]; then
        # shellcheck disable=SC1091
        . "$HOME/.nvm/nvm.sh"
        nvm use 22 >/dev/null
      fi
      [ "$1" = up ] || npm install
      pulumi login "s3://${PULUMI_STATE_BUCKET}?endpoint=${R2_ENDPOINT_HOST}&s3ForcePathStyle=true&region=auto"
      pulumi stack select prod 2>/dev/null || pulumi stack init prod
      # refresh is load-bearing: wrangler creates and deletes DNS records that
      # Pulumi still has in state, and deleting an already-gone record wedges
      # the stack.
      if [ "$1" = up ]; then
        pulumi up --stack prod --refresh --yes
      else
        pulumi preview --stack prod --refresh
      fi
    )
  }

  # The preview always runs, even on a real deploy: its diff is what the
  # confirmation below is about. `pulumi up --yes` alone would apply DNS
  # deletions sight unseen.
  run_pulumi preview

  if [ "$PREVIEW" -eq 1 ]; then
    echo "  Preview only, nothing applied."
  else
    confirm "IRREVERSIBLE: apply the Pulumi plan above? It owns live DNS."
    run_pulumi up
  fi

  unset GIT_CONFIG_COUNT GIT_CONFIG_KEY_0 GIT_CONFIG_VALUE_0
elif [ "$PREVIEW" -eq 1 ]; then
  die "--preview is a Pulumi diff, and this repo has no program/ directory."
fi

[ "$INFRA_ONLY" -eq 1 ] && { echo "Infra only, stopping."; exit 0; }

command -v "$PM" >/dev/null 2>&1 || die "$PM not found."

# ── Install ───────────────────────────────────────────────────────────────────
if [ "$DO_INSTALL" -eq 1 ]; then
  step "Install dependencies"
  case "$PM" in
    pnpm) pnpm install --frozen-lockfile ;;
    npm)  npm ci ;;
    bun)  bun install --frozen-lockfile ;;
  esac
fi

if [ ! -x "$APP/node_modules/.bin/wrangler" ] && [ ! -x "$ROOT/node_modules/.bin/wrangler" ]; then
  die "wrangler is not installed. Re-run with --install."
fi

# ALWAYS invoke wrangler through the package manager, never by absolute path.
# On an OpenNext project `wrangler deploy` shells out to `opennextjs-cloudflare`
# via npm, and npm cannot resolve pnpm's symlinked node_modules: the deploy dies
# with "npm error could not determine executable to run" even though the package
# is installed and on PATH. `pnpm exec` sets up the resolution npm then needs.
# Putting node_modules/.bin on PATH is NOT sufficient; this was tested.
# CI never hit it because it runs `pnpm exec wrangler deploy`.
wrangler_run() { ( cd "$APP" && "$PM" exec wrangler "$@" ); }

# ── Migrate ───────────────────────────────────────────────────────────────────
if [ "$DO_MIGRATE" -eq 1 ]; then
  step "Migrate database ($MIGRATE_KIND)"
  case "$MIGRATE_KIND" in
    prisma)
      MIGRATE_URL="${HYPERDRIVE_ORIGIN:-${DATABASE_URL:-}}"
      [ -n "$MIGRATE_URL" ] || die "No DATABASE_URL or HYPERDRIVE_ORIGIN; cannot migrate. Pass --skip-migrate to deploy without it."
      # `migrate status` exits non-zero when migrations are pending, which is
      # the normal case here, so it must not trip `set -e`.
      PENDING=$(DATABASE_URL="$MIGRATE_URL" npx prisma migrate status 2>&1 || true)
      echo "$PENDING" | sed 's/^/    /'
      if echo "$PENDING" | grep -q "Database schema is up to date"; then
        echo "  No pending migrations."
      else
        confirm "IRREVERSIBLE: apply the pending migration(s) to production?"
        DATABASE_URL="$MIGRATE_URL" PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK=1 npx prisma migrate deploy
      fi
      ;;
    d1)
      DB_NAME=$(grep -oE '"database_name"[[:space:]]*:[[:space:]]*"[^"]+"' "$WRANGLER_CFG" 2>/dev/null | head -1 | sed 's/.*"\([^"]*\)"$/\1/' || true)
      [ -n "$DB_NAME" ] || die "Could not read database_name from $WRANGLER_CFG."
      wrangler_run d1 migrations list "$DB_NAME" --remote || true
      confirm "IRREVERSIBLE: apply the pending D1 migration(s) to $DB_NAME?"
      wrangler_run d1 migrations apply "$DB_NAME" --remote
      ;;
  esac
fi

# ── Build ─────────────────────────────────────────────────────────────────────
if [ -n "$BUILD_CMD" ]; then
  step "Build ($BUILD_CMD)"
  ( cd "$APP" && eval "$BUILD_CMD" )
else
  warn "No build script detected; deploying whatever is already built."
fi

# ── Deploy ────────────────────────────────────────────────────────────────────
step "Deploy worker"
confirm "Ship ${WORKER:-this worker} ($SHA) to production now?"
wrangler_run deploy

# Written only after a successful deploy, so a failed run does not advance the
# baseline the next IndexNow range is diffed from.
printf '%s\n' "$FULL_SHA" > "$LAST_DEPLOY"

# ── Secrets ───────────────────────────────────────────────────────────────────
# CI blind-pushes the whole set because a fresh runner cannot know what the
# Worker already has. Locally we can just ask, so this reconciles: it lists the
# live secrets, uploads only the genuinely absent ones, and skips entirely when
# nothing is missing (the normal case).
if [ "$SKIP_SECRETS" -eq 0 ] && [ $((${#REQUIRED_SECRETS[@]} + ${#OPTIONAL_SECRETS[@]})) -gt 0 ]; then
  step "Reconcile runtime secrets"

  LIVE=$(wrangler_run secret list --format json 2>/dev/null | jq -r '.[].name' 2>/dev/null || true)
  has_secret() { printf '%s\n' "$LIVE" | grep -qx "$1"; }

  SECRETS_FILE=$(mktemp)
  chmod 600 "$SECRETS_FILE"
  echo '{}' > "$SECRETS_FILE"

  # jq --arg keeps the value off the process list and out of any `set -x` trace.
  queue_secret() {
    jq --arg k "$1" --arg v "$2" '. + {($k): $v}' "$SECRETS_FILE" > "$SECRETS_FILE.tmp"
    mv "$SECRETS_FILE.tmp" "$SECRETS_FILE"
  }

  QUEUED=0
  SKIPPED=""
  PROMPTED=""

  reconcile() {
    local pair="$1" tier="$2"
    local name="${pair%%:*}" var="${pair#*:}"
    local value="${!var:-}"

    if [ "$ROTATE_SECRETS" -eq 0 ] && has_secret "$name"; then
      return
    fi
    if [ -n "$value" ]; then
      queue_secret "$name" "$value"
      QUEUED=$((QUEUED + 1))
      return
    fi
    if [ "$tier" = optional ]; then
      SKIPPED="$SKIPPED $name"
      return
    fi

    have_tty || die "$name is missing from Cloudflare and from the local env, and there is no terminal to prompt on."
    printf '\n  %s is not set on the Worker and not in the local env\n' "$name" > /dev/tty
    printf '  Enter a value (input hidden, empty aborts): ' > /dev/tty
    read -rs value < /dev/tty
    printf '\n' > /dev/tty
    [ -n "$value" ] || die "$name is required."
    queue_secret "$name" "$value"
    QUEUED=$((QUEUED + 1))
    PROMPTED="$PROMPTED $name"
  }

  for pair in ${REQUIRED_SECRETS[@]+"${REQUIRED_SECRETS[@]}"}; do reconcile "$pair" required; done
  for pair in ${OPTIONAL_SECRETS[@]+"${OPTIONAL_SECRETS[@]}"}; do reconcile "$pair" optional; done

  if [ -n "$SKIPPED" ]; then warn "Unset:$SKIPPED -- the features behind them will degrade silently."; fi

  if [ "$QUEUED" -eq 0 ]; then
    echo "  All secrets already present on the Worker. Nothing to push."
  else
    echo "  Would upload $QUEUED secret(s): $(jq -r 'keys | join(", ")' "$SECRETS_FILE")"
    if [ "$ROTATE_SECRETS" -eq 1 ]; then
      confirm "IRREVERSIBLE: overwrite $QUEUED secret(s) on the live Worker? The old values stop working immediately."
    else
      confirm "Upload the $QUEUED missing secret(s)?"
    fi
    wrangler_run secret bulk "$SECRETS_FILE"
    if [ -n "$PROMPTED" ]; then
      warn "$PROMPTED came from a prompt and was NOT saved locally."
      warn "Add it to the repo's .env.prod and to the GitHub production environment."
    fi
  fi
fi

# ── IndexNow ──────────────────────────────────────────────────────────────────
# Never allowed to fail the deploy: the site is already live by this point.
if [ "$HAS_INDEXNOW" -eq 1 ] && [ "$SKIP_INDEXNOW" -eq 0 ]; then
  step "Ping IndexNow with the pages this deploy changed"
  if [ -z "$INDEXNOW_BASE" ]; then
    warn "No base commit to diff against; skipping. Run the indexnow script by hand if needed."
  else
    ( cd "$APP" && $PM run indexnow "--changed=$INDEXNOW_BASE" ) || \
      warn "IndexNow ping failed. The deploy is live; re-run it from $APP_DIR when convenient."
  fi
fi

step "Done"
echo "  Deployed $SHA to ${WORKER:-the worker}."
if [ "$HAS_INDEXNOW" -eq 1 ]; then echo "  Recorded in .last-deploy-sha for the next IndexNow range."; fi
exit 0
