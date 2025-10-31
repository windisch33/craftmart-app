#!/usr/bin/env bash
set -euo pipefail

# Add unit_number to customers and jobs tables.
# Works with Docker Compose (preferred) or local psql.

# Detect docker compose command
detect_compose() {
  if docker compose version >/dev/null 2>&1; then
    echo "docker compose"
  elif command -v docker-compose >/dev/null 2>&1; then
    echo "docker-compose"
  else
    echo ""
  fi
}

COMPOSE_CMD=$(detect_compose)
SERVICE_NAME=${SERVICE_NAME:-postgres}

# Defaults match docker-compose.yml
DB_NAME=${DB_NAME:-craftmart}
DB_USER=${DB_USER:-craftmart_user}
DB_PASSWORD=${DB_PASSWORD:-your_secure_password}

SQL=$(cat <<'EOSQL'
ALTER TABLE IF EXISTS customers
  ADD COLUMN IF NOT EXISTS unit_number VARCHAR(50);

ALTER TABLE IF EXISTS jobs
  ADD COLUMN IF NOT EXISTS unit_number VARCHAR(50);
EOSQL
)

echo "→ Applying unit_number migration"

if [[ -n "$COMPOSE_CMD" ]]; then
  echo "→ Using Docker Compose service '$SERVICE_NAME'"
  # Feed SQL via STDIN to psql inside the container
  $COMPOSE_CMD exec -T "$SERVICE_NAME" bash -lc \
    "PGPASSWORD=\"$DB_PASSWORD\" psql -h localhost -U \"$DB_USER\" -v ON_ERROR_STOP=1 \"$DB_NAME\"" \
    <<< "$SQL"
else
  echo "→ No docker-compose found. Attempting local psql on host..."
  if ! command -v psql >/dev/null 2>&1; then
    echo "ERROR: psql not found. Install PostgreSQL client tools or run via Docker Compose." >&2
    exit 1
  fi
  PGPASSWORD="$DB_PASSWORD" psql -h localhost -U "$DB_USER" -v ON_ERROR_STOP=1 "$DB_NAME" <<< "$SQL"
fi

echo "✔ Migration completed"
