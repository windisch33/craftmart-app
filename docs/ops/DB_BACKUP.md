# CraftMart Database Backups (So Simple a Kid Could Do It)

This guide shows you, step-by-step, how to back up and restore the CraftMart PostgreSQL database. No jargon, just do the steps.

Works whether you’re using Docker Compose (recommended) or the PostgreSQL tools installed on your computer.

## What You Need

- Docker installed with Compose, and this project running with `docker compose up -d`.
- Or, PostgreSQL client tools installed (`pg_dump`, `psql`).

We included ready-to-use scripts:

- macOS/Linux: `scripts/db/backup.sh` and `scripts/db/restore.sh`
- Windows PowerShell: `scripts/db/backup.ps1` and `scripts/db/restore.ps1`

Backups are saved to `database/backups/` with a timestamped filename.

## 1) Make a Backup

Like pressing “Save” on your game.

macOS/Linux:

```
bash scripts/db/backup.sh
```

Windows (PowerShell):

```
pwsh scripts/db/backup.ps1
```

You’ll see something like:

```
→ Backing up database 'craftmart' as user 'craftmart_user'
→ Output file: database/backups/craftmart_backup_20250101_120000.sql
✔ Backup completed: database/backups/craftmart_backup_20250101_120000.sql
```

That `.sql` file is your backup. Keep it safe.

### Change DB name/user/password (optional)

If your DB credentials are different, pass them as environment variables:

```
DB_NAME=mydb DB_USER=myuser DB_PASSWORD=mypassword bash scripts/db/backup.sh
```

Or on Windows PowerShell:

```
pwsh scripts/db/backup.ps1 -DbName mydb -DbUser myuser -DbPassword mypassword
```

## 2) Restore a Backup

Like loading a saved game.

WARNING: Restore will overwrite existing data in the database. Make another backup first if you care!

macOS/Linux:

```
bash scripts/db/restore.sh database/backups/craftmart_backup_YYYYMMDD_HHMMSS.sql
```

Windows (PowerShell):

```
pwsh scripts/db/restore.ps1 -File database/backups/craftmart_backup_YYYYMMDD_HHMMSS.sql
```

You should see:

```
→ Restoring backup into database 'craftmart' as user 'craftmart_user'
→ Source file: database/backups/craftmart_backup_...
✔ Restore completed
```

### If Your Credentials Differ

macOS/Linux:

```
DB_NAME=mydb DB_USER=myuser DB_PASSWORD=mypassword bash scripts/db/restore.sh path/to/backup.sql
```

Windows PowerShell:

```
pwsh scripts/db/restore.ps1 -File path/to/backup.sql -DbName mydb -DbUser myuser -DbPassword mypassword
```

## 3) Where the Magic Happens (details)

- Backups use `pg_dump --clean --if-exists` so restores can drop and recreate objects automatically.
- When running with Docker, we run the tools inside the `postgres` service defined in `docker-compose.yml`.
- If Docker Compose isn’t available, scripts try to use `pg_dump`/`psql` from your machine instead.

## 4) Automate (optional)

You can schedule the backup script daily using cron (Linux/macOS):

```
crontab -e
```

Add a line (this runs every night at 2:30am):

```
30 2 * * * cd /path/to/craftmart-app && /usr/bin/env bash scripts/db/backup.sh >> database/backups/cron.log 2>&1
```

Keep backups off the server too (copy `database/backups/` somewhere safe).

## 5) Troubleshooting

- “pg_dump not found”: Use Docker Compose (the scripts will do it automatically) or install PostgreSQL tools.
- “permission denied”: Double-check `DB_USER` and `DB_PASSWORD`.
- “service not found”: Make sure the stack is running: `docker compose up -d`.

That’s it. Backups made simple. ✅

