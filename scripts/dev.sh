#!/usr/bin/env bash
#
# fantasy-draft-order dev: one command to boot the full local stack.
#
#   Frees stale ports, migrates + seeds the local D1 database, optionally
#   tunnels through ngrok, then hands off to the turbo TUI.
#
# There is no Docker here. The database is Cloudflare D1 (SQLite): `next dev`
# gets the binding from initOpenNextCloudflareForDev() in next.config.ts, which
# runs miniflare against the same .wrangler/state file that
# `wrangler d1 migrations apply --local` writes. Wrangler is not part of the
# daily loop beyond that one command.
#
# Usage:
#   pnpm dev                normal boot
#   pnpm dev:force          delete the local database, re-migrate, reseed
#   pnpm dev:tunnel         boot with an ngrok tunnel + URL injection
#   bash scripts/dev.sh --help
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

# --- Config (per project) ---------------------------------------------------
WEB_PORT=3042        # next dev
STUDIO_PORT=5564     # prisma studio
D1_NAME="fantasy-draft-order-db-production"   # database_name in wrangler.jsonc
D1_STATE_DIR=".wrangler/state/v3/d1"

# --- Colors (only when stdout is a TTY) -------------------------------------
if [ -t 1 ]; then
  C_ACCENT='\033[38;5;33m'; C_DIM='\033[2m'; C_BOLD='\033[1m'; C_RESET='\033[0m'
else
  C_ACCENT=''; C_DIM=''; C_BOLD=''; C_RESET=''
fi

usage() {
  cat <<EOF
Usage: bash scripts/dev.sh [flags]

  --force, -f     Delete the local D1 database, re-migrate, reseed
  --tunnel, -t    Start an ngrok tunnel and inject the URL into app configs
  --studio, -s    Also run Prisma Studio
  --no-seed, -n   Skip seeding
  --port N, -p N  Override the web port (default $WEB_PORT)
  --help, -h      Show this help
EOF
}

# --- Flags -------------------------------------------------------------------
FORCE=false; TUNNEL=false; STUDIO=false; SEED=true
while [[ $# -gt 0 ]]; do
  case "$1" in
    --force|-f)          FORCE=true; shift ;;
    --tunnel|-t|--ngrok) TUNNEL=true; shift ;;   # --ngrok kept for muscle memory
    --studio|-s)         STUDIO=true; shift ;;
    --no-seed|-n)        SEED=false; shift ;;
    --port|-p)           WEB_PORT="$2"; shift 2 ;;
    --help|-h)           usage; exit 0 ;;
    *) echo "Unknown flag: $1" >&2; usage; exit 1 ;;
  esac
done

# --- Free ports --------------------------------------------------------------
kill_port() {
  local port=$1 pids
  pids=$(lsof -ti:"$port" 2>/dev/null) || true
  if [ -n "$pids" ]; then
    echo "Killing processes on port $port..."
    echo "$pids" | xargs kill -9 2>/dev/null || true
  fi
}

for port in "$WEB_PORT" "$STUDIO_PORT"; do kill_port "$port"; done

# --- Env bootstrap -----------------------------------------------------------
# First run: create .env from the example. There is no DATABASE_URL to guard
# against any more — the database is a binding, so `pnpm dev` physically cannot
# reach production the way a mis-set connection string used to allow.
if [ ! -f .env ] && [ -f .env.example ]; then
  echo "Creating .env from .env.example..."
  cp .env.example .env
fi

# --- Tunnel (opt-in) -----------------------------------------------------------
STARTED_NGROK=false
NGROK_URL=""
if $TUNNEL; then
  if ! command -v ngrok-url >/dev/null 2>&1; then
    echo "ngrok-url helper not found on PATH." >&2
    exit 1
  fi
  # Remember whether ngrok was already running so cleanup only kills our own.
  if ! curl -s -o /dev/null http://localhost:4040 2>/dev/null; then
    STARTED_NGROK=true
  fi
  NGROK_URL=$(ngrok-url "$WEB_PORT")
  if [ -z "$NGROK_URL" ]; then
    echo "Failed to get ngrok URL. Is ngrok authenticated?" >&2
    echo "Run: ngrok config add-authtoken <your-token>" >&2
    exit 1
  fi

  # Share links and invites read NEXT_PUBLIC_BASE_URL; append the override.
  {
    echo ""
    echo "# Added by dev.sh --tunnel (removed on exit)"
    echo "NEXT_PUBLIC_BASE_URL=$NGROK_URL"
  } >> .env.local

  cleanup() {
    # Strip the injected block so stale tunnel URLs never leak into later runs.
    sed -i '' '/# Added by dev.sh --tunnel/,$d' .env.local 2>/dev/null || true
    if $STARTED_NGROK; then
      echo "Stopping ngrok..."
      killall ngrok 2>/dev/null || true
    fi
  }
  trap cleanup EXIT
fi

# --- Database ------------------------------------------------------------------
if $FORCE; then
  echo "Force reset: deleting the local D1 database..."
  rm -rf "$D1_STATE_DIR"
fi

echo "Generating Prisma client..."
pnpm db:generate >/dev/null

echo "Applying D1 migrations (local)..."
pnpm exec wrangler d1 migrations apply "$D1_NAME" --local

if $SEED; then
  if $FORCE; then
    pnpm db:seed
  else
    # Seed is idempotent (skips when demo-league exists); a hiccup shouldn't
    # block the dev servers.
    pnpm db:seed || echo "warn: seed failed, continuing without it."
  fi
fi

# --- Named *.localhost URLs via portless (https://github.com/vercel-labs/portless) -----
# Optional: everything above works on plain ports with no portless installed.
HAVE_PORTLESS=0
PORTLESS_SUFFIX=""
STUDIO_PORTLESS_SUFFIX=""
if command -v portless >/dev/null 2>&1; then
  HAVE_PORTLESS=1
  echo "→ syncing portless routes"
  portless proxy start --port 443 --https || true
  portless alias fantasy-draft-order "$WEB_PORT" --force >/dev/null 2>&1 || true
  found_port=$(portless list 2>/dev/null | grep -o 'fantasy-draft-order\.localhost:[0-9]*' | head -1 | cut -d: -f2 || true)
  if [ -n "$found_port" ] && [ "$found_port" != "443" ]; then
    PORTLESS_SUFFIX=":$found_port"
  fi
  if $STUDIO; then
    portless alias studio.fantasy-draft-order "$STUDIO_PORT" --force >/dev/null 2>&1 || true
    studio_found_port=$(portless list 2>/dev/null | grep -o 'studio\.fantasy-draft-order\.localhost:[0-9]*' | head -1 | cut -d: -f2 || true)
    if [ -n "$studio_found_port" ] && [ "$studio_found_port" != "443" ]; then
      STUDIO_PORTLESS_SUFFIX=":$studio_found_port"
    fi
  fi
fi

# --- Banner --------------------------------------------------------------------
LAN_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "")
echo ""
printf "${C_BOLD}  fantasy-draft-order${C_RESET}\n"
printf "  ${C_ACCENT}Local${C_RESET}     http://localhost:%s\n" "$WEB_PORT"
[ "$HAVE_PORTLESS" = "1" ] && printf "  ${C_ACCENT}Named${C_RESET}     https://fantasy-draft-order.localhost%s\n" "$PORTLESS_SUFFIX"
[ -n "$LAN_IP" ] && printf "  ${C_ACCENT}Network${C_RESET}   http://%s:%s\n" "$LAN_IP" "$WEB_PORT"
$STUDIO && printf "  ${C_ACCENT}Studio${C_RESET}    http://localhost:%s\n" "$STUDIO_PORT"
$STUDIO && [ "$HAVE_PORTLESS" = "1" ] && printf "  ${C_ACCENT}Studio${C_RESET}    https://studio.fantasy-draft-order.localhost%s\n" "$STUDIO_PORTLESS_SUFFIX"
printf "  ${C_ACCENT}D1${C_RESET}        %s (local, %s)\n" "$D1_NAME" "$D1_STATE_DIR"
if [ -n "$NGROK_URL" ]; then
  printf "  ${C_ACCENT}Tunnel${C_RESET}    %s\n" "$NGROK_URL"
fi
printf "${C_DIM}  Seeded demo draft: /d/demo-league${C_RESET}\n"
printf "${C_DIM}  TUI: arrows switch tasks / m toggle / q quit${C_RESET}\n"
echo ""

# --- Open or refresh Chrome ------------------------------------------------------
# Once the server responds: if Chrome already has a tab on this host:port,
# refresh and focus it; otherwise open a new tab; launch Chrome if needed.
(
  until curl -s -o /dev/null -m 2 "http://localhost:$WEB_PORT"; do sleep 1; done
  "$SCRIPT_DIR/lib/open-chrome-tab.sh" "http://localhost:$WEB_PORT" 2>/dev/null || true
) &

# --- Handoff ---------------------------------------------------------------------
echo "Starting dev servers..."
TASKS=(dev:web)
$STUDIO && TASKS+=(dev:studio)
if $TUNNEL; then
  # No exec: the EXIT trap must survive to clean up injected tunnel config.
  pnpm exec turbo run "${TASKS[@]}" --ui tui
else
  exec pnpm exec turbo run "${TASKS[@]}" --ui tui
fi
