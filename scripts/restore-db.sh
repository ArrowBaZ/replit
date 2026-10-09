#!/usr/bin/env bash
# Restore a SQL dump into DATABASE_URL.
# The dump path comes from DB_SEED_FILE (relative to the repo root, e.g. ./db/backups/x.sql).
# WARNING: loads the dump on top of the existing database. Use docker:reset first for a clean slate.
set -euo pipefail

cd "$(dirname "$0")/.."

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

: "${DATABASE_URL:?DATABASE_URL is not set. Check .env}"
: "${DB_SEED_FILE:?DB_SEED_FILE is not set. Point it at a dump in db/backups/}"

if [ ! -f "$DB_SEED_FILE" ]; then
  echo "Dump not found: $DB_SEED_FILE" >&2
  echo "Put the dump in db/backups/ and update DB_SEED_FILE." >&2
  exit 1
fi

echo "Restoring $DB_SEED_FILE"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -f "$DB_SEED_FILE"
echo "Restore complete."
