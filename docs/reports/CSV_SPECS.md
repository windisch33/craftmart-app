# Reports CSV Specifications

This document defines exact CSV exports for Phase 1 reports and shared drill‑downs. All CSVs are UTF‑8, comma‑separated, quoted where needed (RFC4180). Currency fields are exported as numbers with 2 decimals; dates are YYYY‑MM‑DD.

## Shared Conventions
- File naming: `${report_key}_${start}_${end}.csv` (e.g., `sales_by_salesman_2025-05-01_2025-05-31.csv`).
- Date range columns are NOT included unless noted; range is captured in filename and PDF header.
- Identifiers:
  - `invoice_number`: human‑readable invoice code (string)
  - `invoice_id`: internal integer id (optional; included in drill‑downs)
  - `order_number`: formatted order number (string, usually `#<job_item_id>`)
  - `order_id`: job_item id (integer)

## Sales by Month (summary)
Headers
- month (YYYY‑MM)
- invoices (integer)
- subtotal (number)
- tax (number)
- total (number)

Sort: by `month` asc.

## Sales by Salesman (summary)
Headers
- salesman (string) — `first last`
- invoices (integer)
- subtotal (number)
- tax (number)
- total (number)
- avg_invoice (number)

Sort: `total` desc, then `salesman` asc.

### Drill‑down: Invoices (level 1)
Headers
- invoice_number (string)
- invoice_id (integer)
- order_number (string)
- order_id (integer)
- job_title (string)
- customer (string)
- subtotal (number)
- tax (number)
- total (number)
- invoice_date (YYYY‑MM‑DD)

Sort: `invoice_date` desc, then `invoice_number` asc.

### Drill‑down: Job Items (level 2)
Headers
- invoice_number (string)
- order_number (string)
- section (string)
- item_description (string)
- quantity (number)
- unit_price (number)
- line_total (number)

Sort: by `section` asc, then `item_description` asc.

## Sales by Customer (summary)
Headers
- customer (string)
- invoices (integer)
- subtotal (number)
- tax (number)
- total (number)
- last_invoice_date (YYYY‑MM‑DD)

Sort: `total` desc, then `customer` asc.

Drill‑downs: same as Sales by Salesman (Invoices + Job Items) with the filters applied.

## Tax by State (summary)
Headers
- state (string)
- invoices (integer)
- taxable_sales (number)
- tax_amount (number)
- effective_rate (number) — e.g., 0.06 for 6%

Sort: `state` asc.

### Drill‑down: Invoices (level 1)
Headers
- invoice_number (string)
- order_number (string)
- customer (string)
- taxable_sales (number)
- tax_amount (number)
- total (number)
- state (string)
- invoice_date (YYYY‑MM‑DD)

## Unpaid Invoices (open AR)
Headers
- invoice_number (string)
- order_number (string)
- customer (string)
- salesman (string)
- invoice_date (YYYY‑MM‑DD)
- due_date (YYYY‑MM‑DD)
- amount (number) — invoice total
- paid (number)
- balance (number)
- days_past_due (integer)

Sort: `due_date` desc.

### Drill‑down: Job Items (optional)
Headers
- invoice_number (string)
- order_number (string)
- section (string)
- item_description (string)
- quantity (number)
- unit_price (number)
- line_total (number)

## AR Aging (customer level)
Headers
- customer (string)
- current (number)
- d1_30 (number)
- d31_60 (number)
- d61_90 (number)
- d90_plus (number)
- invoices (integer)
- total (number)

Sort: `total` desc.

## Data Source Notes (read model)
The backend read model (`invoices_view` concept) must expose fields used above:
- invoice_id, invoice_number, order_id, order_number, job_title
- customer_id, customer_name, salesman_id, salesman_name
- invoice_date, due_date, subtotal, tax_amount, total_amount
- taxable_amount (for tax report), paid_amount, balance_due, state

Quote items endpoint should return section name, item description, qty, unit price, line total for the Job Items drill‑down.

