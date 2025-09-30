# Payment Management System – Implementation Report

**Updated:** 2025-02-14

## Overview
We delivered a full-stack payment (formerly “deposit”) workflow that lets the team record incoming customer funds, split them across job items, and surface the applied/remaining balances everywhere the business needs them: the Payments workspace, job detail screens, PDF exports, and internal summaries. The UI now uses "Payment" terminology end-to-end, while the backend keeps the `/api/deposits` namespace for backward compatibility.

## Key Capabilities
- Capture payments with support for multiple methods (`check`, `cash`, `credit_card`, `ach`, `wire`, `other`) plus optional reference numbers and notes.
- Allocate any payment across one or many job items from the same customer, with live validation against job ownership and remaining payment balance.
- Reallocate or remove individual item allocations while preserving an audit trail (`created_by`, timestamps).
- Surface applied totals and remaining balances on job item detail pages, customer payment history, and PDF exports. Rows disappear automatically when no payment exists.
- Provide REST endpoints so the frontend can fetch customer jobs, job items, and allocation summaries without running manual SQL.

## Data Model
The migration in `database/migrations/19-add-deposit-management.sql` is the source of truth. Highlights below capture the final schema after all revisions.

### `deposits`
```sql
CREATE TABLE deposits (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  payment_method VARCHAR(20) NOT NULL CHECK (
    payment_method IN ('check', 'cash', 'credit_card', 'ach', 'wire', 'other')
  ),
  reference_number VARCHAR(100),
  payment_date DATE,
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount > 0),
  deposit_date TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_deposits_customer_check_number
  ON deposits(customer_id, reference_number)
  WHERE payment_method = 'check' AND reference_number IS NOT NULL;
CREATE INDEX idx_deposits_customer_id ON deposits(customer_id);
CREATE INDEX idx_deposits_deposit_date ON deposits(deposit_date);
CREATE INDEX idx_deposits_payment_method ON deposits(payment_method);
CREATE INDEX idx_deposits_reference_number ON deposits(reference_number);
```

### `deposit_allocations`
```sql
CREATE TABLE deposit_allocations (
  id SERIAL PRIMARY KEY,
  deposit_id INTEGER NOT NULL REFERENCES deposits(id) ON DELETE CASCADE,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  job_item_id INTEGER NOT NULL REFERENCES job_items(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  allocation_date TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_deposit_allocations_deposit_id ON deposit_allocations(deposit_id);
CREATE INDEX idx_deposit_allocations_job_id ON deposit_allocations(job_id);
CREATE INDEX idx_deposit_allocations_job_item_id ON deposit_allocations(job_item_id);
```

We intentionally removed the legacy `quote_item_id`/`job_section_id` columns—job items are the accounting surface, so allocations require a `job_item_id` and we confirm at write-time that each item belongs to the declared job.

### Derived Totals & Validation
- **View:** `deposits_with_balance` recalculates `unallocated_amount` on the fly (`total_amount - SUM(allocation.amount)`), eliminating drift.
- **Trigger:** `update_job_deposits_trigger` maintains `jobs.total_deposits` any time an allocation is inserted, updated, or deleted, and recomputes `balance_due` as `total_amount - total_deposits`.
- **Trigger:** `check_allocation_total_trigger` prevents over-allocation past the payment’s total.
- **Trigger:** `validate_deposit_allocation_links_trigger` ensures the selected job item actually belongs to the job on the allocation row.

## Backend Surface Area
All routes live under `backend/src/routes/deposits.ts`.

| Method & Path | Description |
| --- | --- |
| `GET /api/deposits` | Paginated payment list with filters for `customer_id`, `payment_method`, `status`, `limit`, `offset`.  Returns summary rows with amounts, unallocated balance, and applied totals. |
| `POST /api/deposits` | Create a payment. Accepts optional inline allocations. Requires auth (`created_by`). |
| `GET /api/deposits/:id` | Detailed payment view with allocation history. 404 on missing records. |
| `POST /api/deposits/:id/allocate` | Allocate the remaining balance across job items. Validates job/item ownership, deposit availability, and records `created_by`. |
| `DELETE /api/deposits/allocations/:allocationId` | Removes a single allocation and refreshes related job totals. |
| `GET /api/deposits/customers/:customerId/jobs` | Returns each job for the customer with aggregated `total_amount`, `total_deposits`, and `balance_due`. Uses a lateral join over job items and allocations so the frontend can render job cards quickly. |
| `GET /api/deposits/jobs/:jobId/items` | Lists job items under that job, including their total amount, amount already allocated, and remaining balance. |

Internally, `backend/src/services/depositService.ts` encapsulates all transactional logic: row-level locking, allocation validation, trigger-friendly updates, and utility queries consumed by both the REST controller and downstream generators (PDF, job detail).

## Frontend Experience
Implemented under `frontend/src/pages/Deposits.tsx` with shared components in `frontend/src/components/deposits/`.

- **Payments Dashboard:** rebranded from “Deposits”. Provides filters, payment cards, and quick access to allocation histories.
- **New Payment Modal (`NewDepositModal.tsx`):** captures customer, payment method, date, total, reference number, and notes. Form validation mirrors backend rules (e.g., positive amounts, conditional check number requirement).
- **Allocation Modal (`AllocationModal.tsx`):** modern modal styling, collapsible jobs, live totals, and per-job session summaries. Only job items appear, matching the accounting model. Amount inputs enforce currency format and highlight validation errors.
- **Job Detail Integrations:** `TotalsPanel`, `Summary`, and related components display “Payments applied” and “Balance due”. Rows hide automatically when the payment total is zero.
- **PDF Output:** `backend/src/services/pdfService.ts` injects payment totals into PDFs and suppresses the payment row when no allocations exist.

## Operational Runbook
1. **Migrate:** `psql -U craftmart_user -d craftmart < database/migrations/19-add-deposit-management.sql` (idempotent; safe to rerun).
2. **Restart services** after deploying the backend so triggers/views refresh.
3. **Clear PDF cache** (`DELETE /api/jobs/cache/pdf` or via UI) to ensure new totals appear.
4. **Hard refresh** the frontend (or redeploy) so the renamed UI and new modals load.

## QA & Validation Checklist
- Unit + integration tests cover allocation validation and service-layer error paths (`backend/src/services/depositService.ts`).
- Manual regression: create payment → allocate to multiple job items → remove allocation → confirm job detail and PDFs update.
- Verified frontend build (`npm run build`) and backend TypeScript build (`npm run build` in backend) succeed post-changes.

## Future Enhancements
- Extend the allocation modal with presets (e.g., allocate evenly across selected items) if a business use-case emerges.
- Consider re-exposing the REST namespace as `/api/payments` once downstream consumers migrate.
- Add reporting endpoints that summarize payments by period or salesperson to aid finance audits.
