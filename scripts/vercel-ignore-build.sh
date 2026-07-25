#!/usr/bin/env bash
# Vercel "Ignored Build Step" for the legacy origin.
#
# Once fantasyfootballdraftorder.com is the canonical host, this Vercel project
# exists only to keep fantasy-draft-order.vercel.app alive and permanently
# forward every path to the canonical origin (see next.config.ts). App code no
# longer changes what this deployment does, so rebuilding on every push to src/
# just burns build minutes and churns a deployment nobody reaches.
#
# Exit codes are Vercel's, and they are inverted from the usual intuition:
#   exit 0 -> skip the build
#   exit 1 -> run the build
# `git diff --quiet` matches that exactly: 0 when the paths are unchanged,
# 1 when they differ. So the diff's own exit code is the answer.
set -uo pipefail

# Inert until the cutover. While Vercel still serves the real app, skipping
# builds would freeze the live site, so this only takes effect once
# LEGACY_REDIRECT_ONLY=1 is set on the Vercel project (Settings -> Environment
# Variables, Production). Committing this file changes nothing on its own.
if [ "${LEGACY_REDIRECT_ONLY:-}" != "1" ]; then
  echo "vercel-ignore-build: LEGACY_REDIRECT_ONLY is not 1, building."
  exit 1
fi

# Only these affect what the legacy origin serves.
PATHS=(
  next.config.ts                              # the redirect rule itself
  vercel.json                                 # this build config
  package.json                                # next version / build script
  pnpm-lock.yaml
  public/0d280bb4c994c621118dcd0a691c7c8d.txt # IndexNow key, excluded from the redirect
  scripts/vercel-ignore-build.sh
)

# Prefer the last deployed commit so a push of several commits is compared as a
# whole; fall back to the previous commit. If neither resolves (first commit, or
# a clone too shallow to walk back), build rather than risk skipping a real change.
BASE="${VERCEL_GIT_PREVIOUS_SHA:-}"
if [ -z "$BASE" ] || ! git cat-file -e "$BASE^{commit}" 2>/dev/null; then
  BASE="HEAD^"
fi
if ! git rev-parse --verify --quiet "$BASE^{commit}" >/dev/null; then
  echo "vercel-ignore-build: no usable base commit, building."
  exit 1
fi

if git diff --quiet "$BASE" HEAD -- "${PATHS[@]}"; then
  echo "vercel-ignore-build: no redirect-relevant changes since $BASE, skipping build."
  exit 0
fi

echo "vercel-ignore-build: redirect-relevant changes since $BASE:"
git diff --name-only "$BASE" HEAD -- "${PATHS[@]}"
exit 1
