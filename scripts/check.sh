#!/usr/bin/env bash
#
# Pre-push check: runs, in CI order, every verification step
# .github/workflows/deploy.yml runs before it would deploy anything.
# Assumes dependencies are already installed (pnpm install).
#
# It never deploys, never runs pulumi / wrangler deploy / D1 migrations
# against a real database, and never needs production secrets.
#
# Where CI sets a fixed env var for the build, this sets the same value
# only when it is unset, so a developer's real env still wins.
set -euo pipefail

: "${NEXT_PUBLIC_BASE_URL:=https://fantasyfootballdraftorder.com}"
: "${NEXT_PUBLIC_COMMIT_SHA:=$(git rev-parse HEAD)}"
export NEXT_PUBLIC_BASE_URL NEXT_PUBLIC_COMMIT_SHA

echo "==> Unit tests (pnpm test)"
pnpm test

echo "==> Build: Next.js + OpenNext (pnpm exec turbo run build:cf)"
pnpm exec turbo run build:cf

echo "==> Build: Storybook (pnpm build-storybook)"
pnpm build-storybook

echo "==> check passed"
