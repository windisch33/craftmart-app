# Migrations Index

This index provides a quick reference to database migrations, with brief summaries and commands to apply them in Docker. Migrations are idempotent where noted; always review the SQL before applying to production.

## How To Apply (Docker)
- Run a migration file:
  - `docker-compose exec -T postgres psql -U craftmart_user -d craftmart < database/migrations/<file>.sql`
- Prefer running migrations individually in order. Take a DB backup before major changes.

## How To Roll Back
- Many migrations are not strictly reversible. If a migration includes `DROP` or data-transform steps, rolling back may not be safe.
- Where a paired rollback is provided (e.g., specific docs), use those commands. Otherwise, restore from backup.

## Notation
- ✅ Optional-safe: Includes guards (`IF EXISTS`, column checks) and is safe to re-run.
- 🧪 Tested: Covered by unit tests or has companion tests.

## Key Migrations (selected)
- 02-enhance-jobs-table.sql — Enhances jobs/job_items tables.
- 04-add-customer-last-visited.sql — Adds `customers.last_visited_at`.
- 07-add-stair-pricing-system.sql — Introduces stair pricing system.
- 11a/11b/11c — Simple pricing tables and function population.
- 15-add-shops-tracking.sql — Adds shop tracking tables.
- 16-add-projects.sql — Introduces projects table.
- 17-migrate-existing-jobs-to-projects.sql — Backfills projects for existing jobs.
- 19-add-deposit-management.sql — Payments (deposits) model, allocations, triggers, and `deposits_with_balance` view.
  - Apply: `docker-compose exec -T postgres psql -U craftmart_user -d craftmart < database/migrations/19-add-deposit-management.sql`
- 20-enforce-item-allocation-cap.sql — ✅🧪 Enforces per-item allocation caps at DB level via trigger; optional-safe.
  - Apply: `docker-compose exec -T postgres psql -U craftmart_user -d craftmart < database/migrations/20-enforce-item-allocation-cap.sql`
  - Rollback: see `docs/migrations/20-enforce-item-allocation-cap.md`
- 20-create-shop-jobs.sql — Creates shop_jobs support.
- 21-update-shop-jobs-reference.sql — Updates shop_jobs references.
- 22-add-shops-run-to-job-items.sql — Adds shop run ref to job_items.
- 23-add-invoice-fields-and-view.sql — Adds invoice fields and reporting view.
- 24-add-po-number-to-job-items.sql — Adds PO number to job items.
- 25-add-customer-indexes.sql — Adds indices to customers for performance.
- 26-soft-delete-and-email-unique.sql — Adds email unique constraint and soft-delete.

## Full List (from `database/migrations/`)
- 004_add_individual_stringers.sql
- 02-enhance-jobs-table.sql
- 03-add-bulk-customers.sql
- 03-simplify-job-sections.sql
- 04-add-customer-last-visited.sql
- 05-add-landing-tread-product-type.sql
- 06-add-rail-parts-product-type.sql
- 07-add-stair-pricing-system.sql
- 08-update-tread-sizing.sql
- 09-add-stair-config-reference.sql
- 10-add-pgs-stringer-pricing.sql
- 11-cleanup-legacy-pricing-tables.sql
- 11-simplify-stair-pricing.sql
- 11a-create-simple-tables.sql
- 11b-populate-simple-pricing.sql
- 11c-create-simple-function.sql
- 12-mark-legacy-tables-deprecated.sql
- 13-add-width-increment-size.sql
- 14-fix-increment-decimal-types.sql
- 15-add-shops-tracking.sql
- 16-add-projects.sql
- 17-migrate-existing-jobs-to-projects.sql
- 18-remove-handrail-labor-cost.sql
- 19-add-deposit-management.sql
- 20-create-shop-jobs.sql
- 20-enforce-item-allocation-cap.sql
- 21-update-shop-jobs-reference.sql
- 22-add-shops-run-to-job-items.sql
- 23-add-invoice-fields-and-view.sql
- 24-add-po-number-to-job-items.sql
- 25-add-customer-indexes.sql
- 26-soft-delete-and-email-unique.sql

## Tips
- Always apply migrations in sequence in new environments.
- For production, plan a maintenance window for schema changes affecting large tables.
- After deposit-related migrations, restart the backend so views/triggers are active and caches reset.
