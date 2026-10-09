#!/usr/bin/env bash
# Build a handover archive of the working tree for an external agency.
# Excludes secrets, build output, local tooling, and git metadata.
#
# Usage: scripts/export-for-agency.sh [output-dir]
#   output-dir  where the zip is written (default: ~/Desktop)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="${1:-$HOME/Desktop}"

STAMP="$(date +%Y%m%d)"
NAME="sellzy-agency-$STAMP"
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

EXCLUDES=(
  --include='.env.example'
  --exclude='.env*'
  --exclude='.git/'
  --exclude='node_modules/'
  --exclude='dist/'
  --exclude='.idea/'
  --exclude='.nwave/'
  --exclude='.agent/'
  --exclude='.agents/'
  --exclude='.claude/settings.local.json'
  --exclude='.DS_Store'
  --exclude='*.log'
)

rsync -a "${EXCLUDES[@]}" "$ROOT/" "$STAGE/$NAME/"

mkdir -p "$OUT_DIR"
# zip adds to an existing archive instead of replacing it, so remove the old one first
rm -f "$OUT_DIR/$NAME.zip"
(cd "$STAGE" && zip -qr "$OUT_DIR/$NAME.zip" "$NAME")

echo "Wrote $OUT_DIR/$NAME.zip"
echo "Excluded: .git (its history still contains the deleted dump.sql), .env*, node_modules, dist, local tooling folders."
