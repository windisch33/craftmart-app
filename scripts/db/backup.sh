#!/usr/bin/env bash
set -euo pipefail

# CraftMart DB Backup Script
# Creates a timestamped .sql dump in database/backups/

# Detect docker compose command
detect_compose() {
  if docker compose version >/dev/null 2>&1; then
    echo "docker compose"
  elif command -v docker-compose >/dev/null 2>&1; then
    echo "docker-compose"
  else
    echo "" # none
  fi
}

COMPOSE_CMD=$(detect_compose)
SERVICE_NAME=${SERVICE_NAME:-postgres}

# Defaults match docker-compose.yml
DB_NAME=${DB_NAME:-craftmart}
DB_USER=${DB_USER:-craftmart_user}
DB_PASSWORD=${DB_PASSWORD:-your_secure_password}

# Extra flags for pg_dump (optional)
PGDUMP_EXTRA=${PGDUMP_EXTRA:---clean --if-exists}

BACKUP_DIR="database/backups"
mkdir -p "$BACKUP_DIR"

STAMP=$(date +%Y%m%d_%H%M%S)
FILE="$BACKUP_DIR/${DB_NAME}_backup_${STAMP}.sql"

echo "→ Backing up database '$DB_NAME' as user '$DB_USER'"
echo "→ Output file: $FILE"

if [[ -n "$COMPOSE_CMD" ]]; then
  echo "→ Using Docker Compose service '$SERVICE_NAME'"
  # Run pg_dump inside the postgres container and stream to host
  $COMPOSE_CMD exec -T "$SERVICE_NAME" bash -lc \
    "PGPASSWORD=\"$DB_PASSWORD\" pg_dump -h localhost -U \"$DB_USER\" $PGDUMP_EXTRA \"$DB_NAME\"" \
    > "$FILE"
else
  echo "→ No docker-compose found. Attempting local pg_dump on host..."
  if ! command -v pg_dump >/dev/null 2>&1; then
    echo "ERROR: pg_dump not found. Install PostgreSQL client tools or run via Docker Compose." >&2
    exit 1
  fi
  PGPASSWORD="$DB_PASSWORD" pg_dump -h localhost -U "$DB_USER" $PGDUMP_EXTRA "$DB_NAME" > "$FILE"
fi

echo "✔ Backup completed: $FILE"

