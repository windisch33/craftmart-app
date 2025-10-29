#!/usr/bin/env bash
set -euo pipefail

# CraftMart DB Restore Script
# Restores a .sql dump file into the running Postgres service

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 path/to/backup.sql"
  exit 1
fi

BACKUP_FILE="$1"
if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "ERROR: File not found: $BACKUP_FILE" >&2
  exit 1
fi

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

echo "→ Restoring backup into database '$DB_NAME' as user '$DB_USER'"
echo "→ Source file: $BACKUP_FILE"

if [[ -n "$COMPOSE_CMD" ]]; then
  echo "→ Using Docker Compose service '$SERVICE_NAME'"
  # Stream the SQL file into psql inside the container
  cat "$BACKUP_FILE" | $COMPOSE_CMD exec -T "$SERVICE_NAME" bash -lc \
    "PGPASSWORD=\"$DB_PASSWORD\" psql -h localhost -U \"$DB_USER\" -v ON_ERROR_STOP=1 \"$DB_NAME\""
else
  echo "→ No docker-compose found. Attempting local psql on host..."
  if ! command -v psql >/dev/null 2>&1; then
    echo "ERROR: psql not found. Install PostgreSQL client tools or run via Docker Compose." >&2
    exit 1
  fi
  PGPASSWORD="$DB_PASSWORD" psql -h localhost -U "$DB_USER" -v ON_ERROR_STOP=1 "$DB_NAME" < "$BACKUP_FILE"
fi

echo "✔ Restore completed"
