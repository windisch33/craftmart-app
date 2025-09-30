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
- jobs (projects), job_items (orders), customers, salesmen.
- quote_items (job item line details) for Job Items breakdown in drill‑downs.
- deposits/payments tables (if present), invoice fields on jobs/job_items (invoice_amount, tax_amount, status).
- tax_rates (state → rate) if present; otherwise use job/customer state.
- Note: The backend already has basic `/api/reports/sales` and `/api/reports/tax` routes; this plan supersedes with richer filters/metrics.

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
- Columns: Invoice #, Order #, Customer, Salesman, Invoice Date, Due Date, Amount, Paid, Balance.
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
- GET `/ar/unpaid?start=...&end=...&salesmanId=&customerId=&state=`
- GET `/ar/aging?start=...&end=...&bucketSize=30`
- GET `/payments?start=...&end=...` (phase 2)
- GET `/invoices?start=...&end=...&salesmanId=&customerId=&state=` (shared drill‑down endpoint returning Invoice #, Order #, amounts, dates)
- GET `/invoices/:invoiceId/items` (Job Items breakdown: section, description, qty, unit price, line total)
- All endpoints accept `export=csv|xlsx` to trigger file download.

Date semantics
- Sales‑oriented reports (Sales by Month/Salesman/Customer, Tax by State) filter on invoice_date.
- AR/Aging and Unpaid filter on invoice_date and compute due_date buckets; “as of” today unless overridden.
- Example: “Sales by Salesman in May 2025”
  - UI: choose quick preset “May 2025” (start=2025‑05‑01, end=2025‑05‑31)
  - API: `/api/reports/sales/by-salesman?start=2025-05-01&end=2025-05-31`
  - Exports: CSV filename `sales_by_salesman_2025-05.csv`; PDF header shows “Period: May 1, 2025 – May 31, 2025”.

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
It must expose: `invoice_id`, `invoice_number`, `order_id` (job_item_id), `order_number` (formatted), `job_title`, `customer_id`, `customer_name`, `salesman_id`, `salesman_name` so drill‑downs can show Invoice # and Order # consistently.

## Exports
- CSV default; UTF‑8, RFC4180; comma‑separated, quoted where needed.
- XLSX optional via server‑side lib; include formatting for currency/totals.
- PDF (print‑ready) for all reports (see PDF Deliverables below).

## UI Behavior
- Date selection (all reports): Presets Today, This Week, This Month, Last Month, This Quarter, This Year, Custom Range, and a Month quick picker (e.g., “May 2025”).
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
