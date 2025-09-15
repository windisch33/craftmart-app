This folder is a safe place for ad‑hoc backend scripts you might write for local testing, maintenance, or data migration. Keeping scripts here avoids cluttering the repo root and makes it clear they are not production code.

Guidelines
- Do not import from `src/` unless absolutely necessary; prefer standalone scripts using HTTP or psql.
- Never hard‑code secrets. Read from environment variables or `.env` locally.
- If a script is one‑off or contains sensitive logic, do not commit it.
- If a script is useful for others, add a short usage note and expected environment (Docker vs local).

Examples
- curl helpers to hit API endpoints
- one‑off data export/import utilities
- debug repros (avoid committing if they contain sensitive input)

Housekeeping
- Prefer temporary files under `backend/temp/` (already git‑ignored).
- Clean up obsolete scripts after use to keep this folder tidy.

