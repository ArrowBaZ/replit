#!/usr/bin/env bash
# Verify that the local Docker/database setup files and scripts are in place.
set -uo pipefail

cd "$(dirname "$0")/.."

ok=true

check_file() {
  if [ -f "$1" ]; then
    echo "OK    $1"
  else
    echo "MISS  $1"
    ok=false
  fi
}

check_grep() {
  if grep -q "$2" "$1" 2>/dev/null; then
    echo "OK    $1 contains $2"
  else
    echo "MISS  $1 does not contain $2"
    ok=false
  fi
}

echo "Files"
for f in \
  docker-compose.yml \
  .env.example \
  README.md \
  docs/setup/docker.md \
  scripts/setup-docker.sh; do
  check_file "$f"
done

echo
echo "package.json scripts"
for s in docker:up docker:reset db:push db:seed db:seed:admin; do
  check_grep package.json "\"$s\""
done

echo
echo "Environment"
if [ -f .env ]; then
  check_grep .env DATABASE_URL
  check_grep .env SESSION_SECRET
else
  echo "NOTE  .env not found. Copy .env.example to .env"
fi

echo
if [ "$ok" = true ]; then
  echo "All required setup files are in place."
  exit 0
fi
echo "Some required files are missing. See docs/setup/docker.md."
exit 1
