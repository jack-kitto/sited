#!/usr/bin/env bash
# Seed the LOCAL D1 database with sample sites and workers.
#
# Prerequisite: apply migrations first ->  npm run db:migrate:local
#
# This inserts the dev data in src/db/seed.sql. Worker PINs (local only):
#   Alice -> 1234, Bob -> 5678, Carol -> 4321
set -euo pipefail

DB_NAME="clock-in-app-db"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SEED_SQL="${SCRIPT_DIR}/../src/db/seed.sql"

echo "Seeding local D1 '${DB_NAME}' from ${SEED_SQL} ..."
npx wrangler d1 execute "${DB_NAME}" --local --file "${SEED_SQL}"
echo "Done. Local seed applied."
