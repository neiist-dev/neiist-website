#!/bin/bash
# Diffs the desired schema (docker/schema.sql) against the result of all
# migrations (docker/migrations) on a throwaway Postgres.
#
#   scripts/db-diff.sh <name>        write docker/migrations/V<timestamp>__<name>.sql
#   scripts/db-diff.sh --out <file>  write the diff to <file>
#   scripts/db-diff.sh --check       write nothing, exit 1 if there is a diff
#   scripts/db-diff.sh               print the diff
#
# Set PGHOST/PGPORT/PGUSER/PGPASSWORD to use an existing server (e.g. a CI service
# container) instead of starting one. Its `current`/`desired` databases get recreated.
# Only Docker is required.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
POSTGRES_IMAGE=postgres:16
FLYWAY_IMAGE=flyway/flyway:11.20-alpine
DIFF_IMAGE=neiist/pg-schema-diff:1.0.9

MODE=print
OUT=""
case "${1:-}" in
  "") ;;
  --check) MODE=check ;;
  --out)
    MODE=write
    OUT="${2:?--out needs a file}"
    ;;
  -*)
    echo "Unknown option: $1" >&2
    exit 2
    ;;
  *)
    if [[ ! "$1" =~ ^[a-z0-9_]+$ ]]; then
      echo "Migration name must match [a-z0-9_]+" >&2
      exit 2
    fi
    MODE=write
    OUT="$ROOT/docker/migrations/V$(date -u +%Y%m%d%H%M)__$1.sql"
    ;;
esac

ID="neiist_db_diff_$$"
cleanup() {
  docker rm -f "$ID" >/dev/null 2>&1 || true
  docker network rm "$ID" >/dev/null 2>&1 || true
}

if [ -n "${PGHOST:-}" ]; then
  DB_HOST="$PGHOST"
  DB_PORT="${PGPORT:-5432}"
  DB_USER="${PGUSER:-postgres}"
  DB_PASS="${PGPASSWORD:-postgres}"
  NETWORK=host
else
  trap cleanup EXIT
  DB_HOST="$ID"
  DB_PORT=5432
  DB_USER=postgres
  DB_PASS=postgres
  NETWORK="$ID"
  docker network create "$ID" >/dev/null
  docker run -d --name "$ID" --network "$NETWORK" -e POSTGRES_PASSWORD="$DB_PASS" "$POSTGRES_IMAGE" >/dev/null
fi

psql_run() {
  docker run --rm -i --network "$NETWORK" -e PGPASSWORD="$DB_PASS" -v "$ROOT/docker:/repo:ro" "$POSTGRES_IMAGE" \
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -v ON_ERROR_STOP=1 -q "$@"
}

until psql_run -d postgres -c 'SELECT 1' >/dev/null 2>&1; do
  sleep 1
done

psql_run -d postgres -c 'DROP DATABASE IF EXISTS current' -c 'DROP DATABASE IF EXISTS desired' \
  -c 'CREATE DATABASE current' -c 'CREATE DATABASE desired' 2>/dev/null

if ! FLYWAY_LOG="$(docker run --rm --network "$NETWORK" -v "$ROOT/docker:/flyway/project:ro" "$FLYWAY_IMAGE" \
  -configFiles=/flyway/project/flyway.conf \
  -url="jdbc:postgresql://$DB_HOST:$DB_PORT/current" -user="$DB_USER" -password="$DB_PASS" migrate 2>&1)"; then
  printf '%s\n' "$FLYWAY_LOG" >&2
  echo "flyway migrate failed: the existing migrations don't apply cleanly" >&2
  exit 1
fi

psql_run -d desired -f /repo/schema.sql 2>/dev/null \
  || { echo "docker/schema.sql failed to load:" >&2; psql_run -d postgres -c 'DROP DATABASE desired' -c 'CREATE DATABASE desired' 2>/dev/null; psql_run -d desired -f /repo/schema.sql >&2; exit 1; }

docker image inspect "$DIFF_IMAGE" >/dev/null 2>&1 \
  || docker build -q -t "$DIFF_IMAGE" -f "$ROOT/docker/pg-schema-diff.Dockerfile" "$ROOT/docker" >/dev/null

# Plan validation can't be used: it replays the schema with functions before tables, which
# fails on %ROWTYPE. The apply-then-`--check` step in CI proves the plan instead.
DIFF="$(docker run --rm --network "$NETWORK" -e PGPASSWORD="$DB_PASS" "$DIFF_IMAGE" plan \
  --disable-plan-validation --include-schema neiist --output-format sql \
  --from-dsn "postgres://$DB_USER@$DB_HOST:$DB_PORT/current?sslmode=disable" \
  --to-dsn "postgres://$DB_USER@$DB_HOST:$DB_PORT/desired?sslmode=disable")"

if [ -z "$DIFF" ]; then
  echo "No schema changes." >&2
  exit 0
fi

case "$MODE" in
  print) printf '%s\n' "$DIFF" ;;
  check)
    echo "docker/schema and docker/migrations disagree. Missing migration:" >&2
    printf '%s\n' "$DIFF"
    exit 1
    ;;
  write)
    printf '%s\n' "$DIFF" >"$OUT"
    echo "Wrote $OUT" >&2
    ;;
esac
