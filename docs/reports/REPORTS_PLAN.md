# Reports Feature Plan

This document outlines the accounting/operations Reports area. It is desktop‑first, mobile‑compatible, and delivers exportable summaries and details without changing existing business logic. Scope is plan only (no code).

## Goals
- Give accounting clear, consistent, exportable reports with day, week, month filters.
- Cover key dimensions: by Salesman, by Customer, by Month, Tax by State, Unpaid Invoices, Aging (30/60/90), Payments/Deposits, and AR snapshots.
- Provide both summary and drill‑down detail, with CSV/XLSX export and optional PDF.
- Include concrete identifiers everywhere: Invoice # and Order # (job item id) in invoice lists, and a second‑level drill‑down that shows the actual Job Items (line details) for a selected invoice/order.
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
- jobs (projects), job_items (orders/invoices), customers, salesmen.
- quote_items (job item line details) for Job Items breakdown in drill‑downs.
- deposits and deposit_allocations (payments) used to compute paid amounts and balances.
- tax_rates (state → rate) if present; otherwise use job/customer state.
- Note: The backend already has basic `/api/reports/sales` and `/api/reports/tax` routes; this plan supersedes with richer filters/metrics.

### Invoice, Due, and Paid Dates (authoritative definitions)
- invoice_date: the accounting date used for bucketing, tax periods, and lateness.
  - Implementation: add `job_items.invoice_date DATE` and set it the first time status transitions to `invoice` (immutable thereafter). If historical data exists without this field, backfill from the timestamp of the first `invoice` transition or fall back to `job_items.updated_at` if needed.
- due_date: the payment due date used for aging buckets and late indicators.
  - Implementation: either store `job_items.due_date DATE` or maintain it via `invoice_date + (net_terms_days || ' days')::interval`. Include a `job_items.net_terms_days INTEGER` (default 30) if terms vary.
- paid_date: when the invoice becomes fully paid.
  - Policy (chosen): use the `deposits.payment_date` of the allocation that zeroed the balance (cash‑receipt based). If `payment_date` is null, fall back to `deposit_allocations.allocation_date` as a last resort.

## Reports (Phase 1 – Must Have)

1) Sales by Month
- Purpose: Monthly revenue trend with totals and deltas.
- Filters: date range (invoice date), salesman, customer, state.
- Grouping: month (YYYY‑MM) → total invoiced, tax, count of invoices.
- Columns: Month, Invoices, Subtotal, Tax, Total.
- Drill‑down (level 1): invoice list for that month with columns [Invoice #, Order #, Job Title, Customer, Subtotal, Tax, Total, Invoice Date].
- Drill‑down (level 2): selecting an invoice shows Job Items table [Section, Item Description, Qty, Unit Price, Line Total] with invoice totals.
- Export: CSV.

2) Sales by Salesman
- Purpose: Performance by rep.
- Filters: date range, customer, state.
- Grouping: salesman → totals.
- Columns: Salesman, Invoices, Subtotal, Tax, Total, Avg Invoice.
- Drill‑down (level 1): invoices for that salesman with [Invoice #, Order #, Job Title, Customer, Subtotal, Tax, Total, Invoice Date].
- Drill‑down (level 2): Job Items table for the selected invoice.

3) Sales by Customer
- Purpose: Revenue concentration.
- Filters: date range, salesman, state.
- Grouping: customer → totals.
- Columns: Customer, Invoices, Subtotal, Tax, Total, Last Invoice Date.
- Drill‑down (level 1): invoices for that customer with [Invoice #, Order #, Job Title, Subtotal, Tax, Total, Invoice Date].
- Drill‑down (level 2): Job Items table for the selected invoice.

4) Tax Report by State
- Purpose: Filing support.
- Filters: date range.
- Grouping: state → taxable base, tax amount, invoices.
- Columns: State, Invoices, Taxable Sales, Tax Amount, Effective Rate.
- Drill‑down (level 1): invoices per state with [Invoice #, Order #, Customer, Subtotal, Tax, Total, State].
- Drill‑down (level 2): Job Items table for the selected invoice.
- Note: Use job/customer ship‑to state and rate from `tax_rates` if available; otherwise store per‑invoice tax rate snapshot.

5) Unpaid Invoices
- Purpose: Open AR list.
- Filters: date range (invoice date), salesman, customer, state.
- Columns: Invoice #, Order #, PO #, Customer, Salesman, Invoice Date, Due Date, Amount, Paid, Balance.
- Drill‑down: Job Items table for the selected invoice (with allocations/payment history in sidebar).
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
- GET `/ar/unpaid?asOf=...&issuedStart=...&issuedEnd=...&salesmanId=&customerId=&state=`
- GET `/ar/aging?asOf=...&issuedStart=...&issuedEnd=...&bucketSize=30`
- GET `/payments?start=...&end=...` (phase 2)
- GET `/invoices?start=...&end=...&salesmanId=&customerId=&state=` (shared drill‑down endpoint returning Invoice #, Order #, amounts, dates)
- GET `/invoices/:invoiceId/items` (Job Items breakdown: section, description, qty, unit price, line total)
- All endpoints accept `export=csv|xlsx` to trigger file download.

Date semantics
- Sales‑oriented reports (Sales by Month/Salesman/Customer, Tax by State) filter on invoice_date.
- AR/Aging and Unpaid default to an “as of” snapshot (open balances up to `asOf`, no issued‑between filter unless provided). Optional `issuedStart/issuedEnd` narrow to invoices issued in that window.
- Example: “Sales by Salesman in May 2025”
  - UI: choose quick preset “May 2025” (start=2025‑05‑01, end=2025‑05‑31)
  - API: `/api/reports/sales/by-salesman?start=2025-05-01&end=2025-05-31`
  - Exports: CSV filename `sales_by_salesman_2025-05.csv`; PDF header shows “Period: May 1, 2025 – May 31, 2025”.

Standard parameters (apply consistently across endpoints)
- `start`, `end` (dates, inclusive): primary range selectors. For months, use first/last calendar day in business timezone. Accept legacy `start_date`/`end_date` as aliases for backward compatibility.
- `month` (YYYY‑MM, optional): convenience for single‑month selection; server converts to `start`=`YYYY‑MM‑01`, `end`=`last day of month`.
- `asOf` (date): AR/Aging snapshot date; defaults to `CURRENT_DATE` Eastern. Required for AR exports when UI provides a snapshot option.
- `groupBy` (enum): for time series endpoints allow `month|week|day` (default `month` for Sales by Month).
- `tz` (IANA, optional): override business timezone for bucketing; default is `America/New_York` (Eastern).
- AR‑specific optional filters: `issuedStart`, `issuedEnd` (filter by `invoice_date` in addition to the `asOf` snapshot).

Date Range API Contract (summary)
- Business timezone default: `America/New_York` (handles DST correctly when bucketing by week/month).
- Month parameter: `month=YYYY-MM` expands to the first and last calendar day in Eastern time; equivalent to `start`/`end` in that timezone.
- Inclusive comparisons: `invoice_date BETWEEN start AND end` (DATE). If using TIMESTAMPs, convert to Eastern before truncation/bucketing.
- Examples:
  - `month=2025-05` → `start=2025-05-01`, `end=2025-05-31` (Eastern)
  - `start=2025-04-15&end=2025-06-10` groups months Apr, May, Jun; fill missing months with zeros.

Boundary rules
- Date filters are inclusive on both ends when comparing DATE types: `invoice_date BETWEEN start AND end`.
- For time series queries, use `date_trunc('month', invoice_date AT TIME ZONE tz)` to bucket consistently.
- When `month` is supplied, ignore `start`/`end` if also present (or validate consistency and prefer `month`).

## Query Sketches (pseudo SQL)
- Sales by Month
```sql
-- If invoice_date is DATE, this is sufficient. If TIMESTAMP, bucket in Eastern time:
-- SELECT date_trunc('month', (invoice_ts AT TIME ZONE 'America/New_York')) AS month
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
    AND invoice_date <= $asOf
    AND ($issuedStart::date IS NULL OR invoice_date >= $issuedStart)
    AND ($issuedEnd::date IS NULL OR invoice_date <= $issuedEnd)
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

Note: `invoices_view` is a conceptual read model joining jobs/job_items/customers/salesmen, with derived fields. It should expose at minimum:
- Identity: `invoice_id` (job_item_id), `invoice_number`, `order_id` (job_item_id), `order_number` (formatted), `job_title`.
- Party: `customer_id`, `customer_name`, `salesman_id`, `salesman_name`, `state` (ship‑to or customer state), `po_number` (fallback to order_designation when missing).
- Money: `subtotal` (parts/materials), `labor_total`, `tax_amount` AS `tax`, `total_amount` AS `total`, `taxable_amount`.
- Dates: `invoice_date`, `due_date`, `paid_date` (per rules above).
- AR: `paid_amount`, `open_balance` (total − paid_amount).

Paid amount and paid date are derived from deposits and their allocations aggregated by `job_item_id`. The paid_date is the earliest `deposits.payment_date` where the running allocation total meets/exceeds the invoice total (falling back to `allocation_date` only if `payment_date` is null).

## Exports
- CSV default; UTF‑8, RFC4180; comma‑separated, quoted where needed.
- XLSX optional via server‑side lib; include formatting for currency/totals.
- PDF (print‑ready) for all reports (see PDF Deliverables below).

## UI Behavior
- Date selection (all reports): Presets Today, This Week, This Month, Last Month, This Quarter, This Year, Custom Range, and a Month quick picker (e.g., “May 2025”).
- Sticky filters, small badge chips for active filters.
- Drill‑down opens in a side panel or modal; export respects current filters.
- Rows show currency with 2 decimals; totals bolded; thousands separators.

Date & month UX specifics
- Default landing on Reports selects “Sales by Month” with the Month quick picker focused and initialized to the current month.
- Month quick picker supports keyboard navigation and shows adjacent months; selecting a month updates `start`/`end` accordingly.
- For multi‑month ranges, the Sales by Month tab displays contiguous calendar months and fills missing months with zero values to keep charts/tables aligned.

## Performance & Data
- Add indexes for `job_items(invoice_date)`, `job_items(due_date)`, `job_items(status)`, `job_items(customer_id)`, `job_items(salesman_id)`, and state.
- Ensure supporting indexes for payments: `deposit_allocations(job_item_id, allocation_date)` and `deposits(payment_date)`.
- Consider a lightweight materialized view for invoices_view if queries grow.
- Use streaming/limit+offset for large exports (or cursor‑based paging).

## Security & Access
- Require authentication. Add role/claims check (e.g., `role in ('admin','accounting')`).
- Log report downloads (who/when/filters) for audits.

## Validation & Edge Cases
- Missing tax rates: include invoice‑line snapshot tax or compute from `tax_rates` at time of invoice; never re‑compute historical tax without a version source.
- Time zone: normalize to business tz for date bucketing.
- Voids/Credits: show as negatives; aging excludes fully paid/voided.
- Late/overdue: an invoice is late when `paid_date` is null and `CURRENT_DATE > due_date`. If `paid_date` exists and is after `due_date`, treat as paid late (not currently overdue).

Reference SQL — Paid date by deposit payment date
```
WITH allocs AS (
  SELECT
    da.job_item_id,
    COALESCE(d.payment_date::date, da.allocation_date::date) AS paid_component_date,
    da.amount,
    SUM(da.amount) OVER (
      PARTITION BY da.job_item_id
      ORDER BY COALESCE(d.payment_date, da.allocation_date), da.id
      ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS running_alloc
  FROM deposit_allocations da
  JOIN deposits d ON d.id = da.deposit_id
), totals AS (
  SELECT ji.id AS job_item_id, ji.total_amount
  FROM job_items ji
)
SELECT
  t.job_item_id,
  MIN(a.paid_component_date) FILTER (WHERE a.running_alloc >= t.total_amount AND t.total_amount IS NOT NULL) AS paid_date
FROM totals t
LEFT JOIN allocs a ON a.job_item_id = t.job_item_id
GROUP BY t.job_item_id;
```

## Implementation Phases
- Phase 1 (MVP): Sales by Month, Sales by Salesman, Sales by Customer, Tax by State, Unpaid, Aging 30/60/90 + CSV exports.
- Phase 2: Payments/Deposits, Funnel/Conversion KPIs, PDF summaries, XLSX, Saved report presets.

Status (Oct 2025)
- Backend endpoints implemented and live under `/api/reports`:
  - JSON + CSV: `sales/by-month`, `sales/by-salesman`, `sales/by-customer`, `tax/by-state`, `ar/unpaid`, `ar/aging`, `invoices`
  - Dedicated PDF endpoints (binary):
    - `GET /sales/by-month/pdf`
    - `GET /sales/by-salesman/pdf`
    - `GET /sales/by-customer/pdf`
    - `GET /tax/by-state/pdf`
    - `GET /ar/unpaid/pdf`
    - `GET /ar/aging/pdf`
    - `GET /invoices/pdf`
- PDFs are server-rendered via Puppeteer with a clean report header and table. Each PDF includes a summary row totaling numeric columns (e.g., subtotal/tax/total).
- Invoices PDF honors filters (month or start/end, salesmanId, customerId, state) and includes totals for Subtotal/Labor/Tax/Total/Paid/Balance.
- Frontend Reports page:
  - Supports Report Type selection (Sales by Month/Salesman/Customer, Tax by State, Unpaid, Aging)
  - Filters: Month quick picker, Start/End, Salesman, Customer, State
  - Actions: Download CSV and Download PDF for all implemented reports
  - Drill‑down: Sales by Month/Salesman/Customer → “View Invoices” opens invoice list modal; modal supports CSV/PDF download. Item-level panel was intentionally removed.
  - HTML summaries: Cards above each table show totals for the current dataset.
- Database: `invoices_view` created with derived fields (`invoice_date`, `due_date`, `paid_date`, `po_number`, `labor_total`, `taxable_amount`, AR fields). Migrations 23/24 applied.

## Acceptance Criteria
- Reports respect filters, render within 2s for typical ranges (last 3 months).
- CSV export matches on‑screen filters; numeric fields are cleanly typed.
- AR Aging buckets sum to total; unpaid list total equals aging total.
- Tax by State totals match Sales totals for the same period.
- PO numbers appear where provided (invoice/unpaid/AR views), using `po_number` or falling back to `order_designation`.
- All PDF endpoints return valid binary PDFs with correct totals and headers.

## PDF Deliverables (Print‑Ready)
- Engine: reuse backend Puppeteer/browser pool (as in existing pdfService) for server‑side HTML→PDF.
- Layout: letter, 0.5in margins; portrait for listings; landscape allowed for wide aging or tax tables.
- Header: company block (name, address, phone/web), report title, date range, generated timestamp.
- Footer: page X of Y, optional confidentiality note.
- Tables: repeating header row per page; zebra rows; currency formatting; thousand separators; totals bolded; section subtotals when grouped.
- Typography: consistent with existing PDFs; avoid decorative banners; emphasize clarity.
- Accessibility: high contrast text; avoid color‑only meaning; readable font sizes (>=10pt).
- Performance: render within ~2s for typical ranges (<5k rows) using streaming content and minimal images.

PDF Outputs per Report (Phase 1)
- Sales by Month: summary cards + monthly table; one page per few months (auto paginate).
- Sales by Salesman: table grouped by salesman, each group subtotaled. Drill‑down PDF includes invoice list with [Invoice #, Order #] and optional second page showing Job Items for a selected invoice.
- Sales by Customer: table grouped by customer with totals and last invoice date column. Drill‑down PDF includes invoice list with [Invoice #, Order #] and optional Job Items page.
- Tax by State: table showing state, invoices, taxable, tax, effective rate.
- Unpaid Invoices: listing with invoice date, due date, balance; sorted by due date desc. Selecting an invoice shows Job Items breakdown.
- AR Aging: matrix (customer rows × aging buckets) + total; landscape if needed.

Front‑End Print View (optional add‑on)
- Provide a print CSS for on‑screen preview to match PDF as closely as feasible.

## Code Organization & Size Guidelines
- Keep files manageable: split any report module approaching 400 lines.
  - Example structure:
    - `backend/src/services/reports/`
      - `data/` query builders per report (e.g., `salesByMonthQuery.ts`).
      - `format/` CSV/XLSX formatters (small, focused).
      - `pdf/` per‑report PDF generators (e.g., `salesByMonthPdf.ts`, `taxByStatePdf.ts`).
      - `pdf/common.ts` shared styles, table builders, currency helpers.
    - `backend/src/controllers/reportsController.ts` thin controllers delegating to services.
    - `backend/src/routes/reports.ts` routes only.
- Prefer small, pure helpers (format currency, percent, date display, group totals) shared across reports.
- Avoid inlining giant query strings—extract to builder functions or `.sql` files if needed.
- Keep controllers <100 lines; per‑report PDF generators ~150–300 lines; data/format helpers ~50–120 lines.

## Legacy Reports Parity Notes
- Old system invoice list shows: Invoice #, Invoice Date, PO # (labeled as Lot/PO), Order type (Parts/Installation), Taxable Amount, Non‑taxable Labor, Tax, Discount, Amount Paid, Invoice Total.
  - Mapping:
    - PO # → `invoices_view.po_number` (from `job_items.po_number` or `order_designation`).
    - Order type → derive heuristically (e.g., `labor_total > 0` → Installation; else Parts) if needed for display.
    - Taxable/Non‑taxable → `taxable_amount` and `labor_total` respectively.
    - Discount → not currently modeled; backlog item if needed.
    - Amount Paid → `paid_amount`; Invoice Total → `total_amount`.
- Old system “Invoice list by Salesman” shows per‑invoice columns including Labor and Net Amount; include `labor_total` in drill‑down/CSV.
- Old system “Tax Summary” shows taxable, non‑taxable labor, and tax‑exempt amounts per state; surface `non_taxable_labor` and `tax_exempt_amount` when available and include in CSV as optional columns.
### Identifiers (consistency across reports)
- Invoice #: if a dedicated `invoice_number` does not exist, use a stable formatted value derived from `job_items.id` (e.g., `INV-{{id}}`) and plan a future migration to add a human‑friendly sequence if needed.
- Order #: same as `job_item_id` (formatted as needed, e.g., `ORD-{{id}}`).
- PO #: add `job_items.po_number VARCHAR(100)` and populate from `order_designation` where applicable. Expose as `po_number` and display in invoice/unpaid/AR views.
- Display Job Title consistently from `job_items.title`; fallback to `jobs.title` or a generated label when missing.
