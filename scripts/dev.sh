#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

FORCE=false
NGROK=false
for arg in "$@"; do
  case $arg in
    --force) FORCE=true ;;
    --ngrok) NGROK=true ;;
  esac
done

free_port() {
  local port=$1
  local containers
  containers=$(docker ps --filter "publish=$port" -q 2>/dev/null) || true
  if [ -n "$containers" ]; then
    echo "Stopping docker containers on port $port..."
    echo "$containers" | xargs docker stop 2>/dev/null || true
  fi
  local pids
  pids=$(lsof -ti:"$port" 2>/dev/null) || true
  if [ -n "$pids" ]; then
    echo "Killing processes on port $port..."
    echo "$pids" | xargs kill -9 2>/dev/null || true
  fi
}

PORTS=(3042 5438)
for port in "${PORTS[@]}"; do
  free_port "$port"
done

if $NGROK; then
  PORT=3042
  ENV_FILE="$REPO_ROOT/.env.local"

  echo "Getting ngrok URL for port $PORT..."
  NGROK_URL=$(ngrok-url "$PORT")

  if [ -z "$NGROK_URL" ]; then
    echo "Failed to get ngrok URL. Is ngrok authenticated?"
    echo "Run: ngrok config add-authtoken <your-token>"
    exit 1
  fi

  cat > "$ENV_FILE" <<EOF
NEXTAUTH_URL=$NGROK_URL
NEXT_PUBLIC_URL=$NGROK_URL
EOF

  echo ""
  echo "========================================="
  echo "  ngrok URL: $NGROK_URL"
  echo "========================================="
  echo ""
  echo "Wrote $ENV_FILE"
  echo ""
fi

if $FORCE; then
  echo "Force reset: tearing down containers and volumes..."
  docker compose -f dev/docker-compose.yml down -v
fi

echo "Starting infrastructure..."
docker compose -f dev/docker-compose.yml up -d --wait

if $FORCE; then
  echo "Force syncing database..."
  pnpm db:sync:force
  echo "Seeding database..."
  pnpm db:seed
else
  echo "Syncing database..."
  pnpm db:sync --accept-data-loss
fi

echo "Starting dev servers..."
exec pnpm exec turbo run dev:web dev:infra --ui tui
