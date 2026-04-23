#!/usr/bin/env bash
set -euo pipefail

# Exports every icon asset the site needs from public/logo.svg.
# Requires: rsvg-convert (librsvg) and magick (ImageMagick).
#   brew install librsvg imagemagick

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/public/logo.svg"
PUBLIC="$ROOT/public"
APP="$ROOT/src/app"

if [[ ! -f "$SRC" ]]; then
  echo "error: $SRC not found" >&2
  exit 1
fi

for cmd in rsvg-convert magick; do
  if ! command -v "$cmd" >/dev/null; then
    echo "error: $cmd not installed (brew install librsvg imagemagick)" >&2
    exit 1
  fi
done

echo "→ Rendering PNG sizes from $SRC"
sizes=(16 32 48 64 128 180 192 512)
for size in "${sizes[@]}"; do
  out="$PUBLIC/logo-$size.png"
  rsvg-convert -w "$size" -h "$size" -o "$out" "$SRC"
  echo "  wrote $out"
done

cp "$PUBLIC/logo-180.png" "$APP/apple-icon.png"
echo "  wrote $APP/apple-icon.png"

magick \
  "$PUBLIC/logo-16.png" \
  "$PUBLIC/logo-32.png" \
  "$PUBLIC/logo-48.png" \
  "$PUBLIC/logo-64.png" \
  "$APP/favicon.ico"
echo "  wrote $APP/favicon.ico"

cp "$SRC" "$APP/icon.svg"
echo "  wrote $APP/icon.svg"

echo "✓ Done."
