# Reports Feature Plan

This document outlines the accounting/operations Reports area. It is desktop‑first, mobile‑compatible, and delivers exportable summaries and details without changing existing business logic. Scope is plan only (no code).

## Goals
- Give accounting clear, consistent, exportable reports with day, week, month filters.
- Cover key dimensions: by Salesman, by Customer, by Month, Tax by State, Unpaid Invoices, Aging (30/60/90), Payments/Deposits, and AR snapshots.
- Provide both summary and drill‑down detail, with CSV/XLSX export and optional PDF.
- Reuse existing auth; restrict sensitive reports to finance roles.

## Page Structure (UI)
- Header: title “Reports”, global Date Range (preset + custom), quick export buttons.
- Filter toolbar: salesman, customer, state, status, view (summary/detail), grouping.
- Content
  - Summary cards (top): Total Sales, Total Tax, Total AR, Unpaid Invoices, Over 30 Days.
  - Tabs (left or top): Sales, Customers, Salesmen, Tax, AR/Aging, Payments, Jobs KPI.
  - Table sections: sortable columns, sticky header, density toggle, infinite/virtual scroll for big data.
- Exports: CSV (primary), XLSX (optional), print/PDF.

## Data Sources (current schema cues)
- jobs (projects), job_items (orders), customers, salesmen.
- deposits/payments tables (if present), invoice fields on jobs/job_items (invoice_amount, tax_amount, status).
- tax_rates (state → rate) if present; otherwise use job/customer state.
- Note: The backend already has basic `/api/reports/sales` and `/api/reports/tax` routes; this plan supersedes with richer filters/metrics.

## Reports (Phase 1 – Must Have)

1) Sales by Month
- Purpose: Monthly revenue trend with totals and deltas.
- Filters: date range (invoice date), salesman, customer, state.
- Grouping: month (YYYY‑MM) → total invoiced, tax, count of invoices.
- Columns: Month, Invoices, Subtotal, Tax, Total.
- Drill‑down: link to invoice list for that month.
- Export: CSV.

2) Sales by Salesman
- Purpose: Performance by rep.
- Filters: date range, customer, state.
- Grouping: salesman → totals.
- Columns: Salesman, Invoices, Subtotal, Tax, Total, Avg Invoice.
- Drill‑down: invoices for that salesman.

3) Sales by Customer
- Purpose: Revenue concentration.
- Filters: date range, salesman, state.
- Grouping: customer → totals.
- Columns: Customer, Invoices, Subtotal, Tax, Total, Last Invoice Date.
- Drill‑down: invoices for that customer.

4) Tax Report by State
- Purpose: Filing support.
- Filters: date range.
- Grouping: state → taxable base, tax amount, invoices.
- Columns: State, Invoices, Taxable Sales, Tax Amount, Effective Rate.
- Drill‑down: invoices per state.
- Note: Use job/customer ship‑to state and rate from `tax_rates` if available; otherwise store per‑invoice tax rate snapshot.

5) Unpaid Invoices
- Purpose: Open AR list.
- Filters: date range (invoice date), salesman, customer, state.
- Columns: Invoice #/Job, Customer, Salesman, Invoice Date, Due Date, Amount, Paid, Balance.
- Drill‑down: payment history.

6) AR Aging (30/60/90)
- Purpose: Collections.
- Filters: as above.
- Columns: Customer (or Salesman), Current, 1–30, 31–60, 61–90, >90, Total; plus count of invoices.
- Drill‑down: outstanding invoices per bucket.
- Buckets based on today() − due_date (or invoice_date + terms).

## Reports (Phase 2 – Nice to Have)
- Payments & Deposits Report: received payments by date, method, unapplied balances.
- Conversion Funnel: quotes → orders → invoices by period, rate %, average cycle time.
- Job Margin Snapshot: subtotal vs costs (when cost data comes online).
- Shops Activity: shops generated per day/week; average sheets per shop.
- Top Products (if productized): breakdown of rail parts/stairs revenue.

## API Endpoints (proposed)
Namespace: `/api/reports`
- GET `/sales/by-month?start=YYYY-MM-DD&end=YYYY-MM-DD&salesmanId=&customerId=&state=`
- GET `/sales/by-salesman?...`
- GET `/sales/by-customer?...`
- GET `/tax/by-state?start=...&end=...`
- GET `/ar/unpaid?start=...&end=...&salesmanId=&customerId=&state=`
- GET `/ar/aging?start=...&end=...&bucketSize=30`
- GET `/payments?start=...&end=...` (phase 2)
- All endpoints accept `export=csv|xlsx` to trigger file download.

## Query Sketches (pseudo SQL)
- Sales by Month
```sql
SELECT date_trunc('month', invoice_date) AS month,
       COUNT(*) AS invoices,
       SUM(subtotal) AS subtotal,
       SUM(tax_amount) AS tax,
       SUM(total_amount) AS total
FROM invoices_view
WHERE invoice_date BETWEEN $1 AND $2
  AND ($3::int IS NULL OR salesman_id = $3)
  AND ($4::int IS NULL OR customer_id = $4)
  AND ($5::text IS NULL OR state = $5)
GROUP BY 1
ORDER BY 1 DESC;
```

- Tax by State
```sql
SELECT state,
       COUNT(*) AS invoices,
       SUM(taxable_amount) AS taxable,
       SUM(tax_amount) AS tax,
       CASE WHEN SUM(taxable_amount) > 0 THEN SUM(tax_amount)/SUM(taxable_amount) ELSE 0 END AS effective_rate
FROM invoices_view
WHERE invoice_date BETWEEN $1 AND $2
GROUP BY state
ORDER BY state;
```

- AR Aging (customer level)
```sql
WITH open AS (
  SELECT customer_id,
         invoice_id,
         invoice_date,
         due_date,
         (total_amount - COALESCE(paid_amount,0)) AS balance,
         GREATEST(0, DATE_PART('day', CURRENT_DATE - COALESCE(due_date, invoice_date))) AS days
  FROM invoices_view
  WHERE (total_amount - COALESCE(paid_amount,0)) > 0
)
SELECT customer_id,
       SUM(CASE WHEN days <= 0 THEN balance ELSE 0 END) AS current,
       SUM(CASE WHEN days BETWEEN 1 AND 30 THEN balance ELSE 0 END) AS d1_30,
       SUM(CASE WHEN days BETWEEN 31 AND 60 THEN balance ELSE 0 END) AS d31_60,
       SUM(CASE WHEN days BETWEEN 61 AND 90 THEN balance ELSE 0 END) AS d61_90,
       SUM(CASE WHEN days > 90 THEN balance ELSE 0 END) AS d90_plus,
       COUNT(*) AS invoices,
       SUM(balance) AS total
FROM open
GROUP BY customer_id
ORDER BY total DESC;
```

Note: `invoices_view` is a conceptual read model joining jobs/job_items/customers/salesmen, with derived fields (invoice_date, due_date, subtotal, tax, total, taxable_amount, state, paid_amount).

## Exports
- CSV default; UTF‑8, RFC4180; comma‑separated, quoted where needed.
- XLSX optional via server‑side lib; include formatting for currency/totals.
- PDF (later) for tax filing summaries and AR snapshots.

## UI Behavior
- Date presets: Today, This Week, This Month/Quarter/Year, Last Month, Custom.
- Sticky filters, small badge chips for active filters.
- Drill‑down opens in a side panel or modal; export respects current filters.
- Rows show currency with 2 decimals; totals bolded; thousands separators.

## Performance & Data
- Add indexes for invoice_date, status, customer_id, salesman_id, state.
- Consider a lightweight materialized view for invoices_view if queries grow.
- Use streaming/limit+offset for large exports (or cursor‑based paging).

## Security & Access
- Require authentication. Add role/claims check (e.g., `role in ('admin','accounting')`).
- Log report downloads (who/when/filters) for audits.

## Validation & Edge Cases
- Missing tax rates: include invoice‑line snapshot tax or compute from `tax_rates` at time of invoice; never re‑compute historical tax without a version source.
- Time zone: normalize to business tz for date bucketing.
- Voids/Credits: show as negatives; aging excludes fully paid/voided.

## Implementation Phases
- Phase 1 (MVP): Sales by Month, Sales by Salesman, Sales by Customer, Tax by State, Unpaid, Aging 30/60/90 + CSV exports.
- Phase 2: Payments/Deposits, Funnel/Conversion KPIs, PDF summaries, XLSX, Saved report presets.

## Acceptance Criteria
- Reports respect filters, render within 2s for typical ranges (last 3 months).
- CSV export matches on‑screen filters; numeric fields are cleanly typed.
- AR Aging buckets sum to total; unpaid list total equals aging total.
- Tax by State totals match Sales totals for the same period.

