Title: Enforce Per-Item Allocation Cap (Migration 20)

Summary
- Adds a database trigger (`check_item_allocation_total_trigger`) that prevents allocating more than a job item's total amount.
- Trigger function is optional-safe: if `job_items.total_amount` does not exist or is not positive, it no-ops to maintain compatibility.

Apply (Docker)
- Assumes compose service name `craftmart-db` (see docker-compose.yml) and DB creds from compose.

Run:
```
docker exec -i craftmart-db psql -U craftmart_user -d craftmart -v ON_ERROR_STOP=1 < database/migrations/20-enforce-item-allocation-cap.sql
```

Idempotency
- Uses `CREATE OR REPLACE FUNCTION` and `DROP TRIGGER IF EXISTS`. Safe to re-run.

Rollback
- Removes the trigger and function (safe if you need to revert).

Run:
```
docker exec -i craftmart-db psql -U craftmart_user -d craftmart -v ON_ERROR_STOP=1 <<'SQL'
DROP TRIGGER IF EXISTS check_item_allocation_total_trigger ON deposit_allocations;
DROP FUNCTION IF EXISTS check_item_allocation_total();
SQL
```

Notes
- This migration complements service-layer checks. Together they ensure item-level caps under concurrency.
- No data changes; only DDL and trigger logic.

