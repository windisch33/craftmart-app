# Reports CSV Specifications

All CSVs follow RFC 4180: comma‑separated, quoted fields when needed, UTF‑8 encoding, CRLF line endings for maximum compatibility.

Common formatting
- Dates: ISO 8601 (YYYY‑MM‑DD)
- Currency: numeric with 2 decimals (e.g., 12345.67) — do not include $ in CSV
- Percentages: decimal (e.g., 0.06) or percentage with 2 decimals (e.g., 6.00%) — noted per column below
- IDs: numeric or string as stored; no formatting changes

## Sales by Month (sales_by_month.csv)
Columns
1. month (string, YYYY‑MM)
2. invoices (integer)
3. subtotal (number, 2dp)
4. tax (number, 2dp)
5. total (number, 2dp)

Example
```
2025-09,112,123456.00,8641.92,132097.92
```

## Sales by Salesman (sales_by_salesman.csv)
Columns
1. salesman_id (integer)
2. salesman_name (string)
3. invoices (integer)
4. subtotal (number, 2dp)
5. tax (number, 2dp)
6. total (number, 2dp)
7. avg_invoice (number, 2dp)

## Sales by Customer (sales_by_customer.csv)
Columns
1. customer_id (integer)
2. customer_name (string)
3. invoices (integer)
4. subtotal (number, 2dp)
5. tax (number, 2dp)
6. total (number, 2dp)
7. last_invoice_date (date, YYYY‑MM‑DD)

## Tax by State (tax_by_state.csv)
Columns
1. state (string, 2‑letter)
2. invoices (integer)
3. taxable (number, 2dp)
4. tax (number, 2dp)
5. effective_rate (percent string, e.g., "6.00%")

## Unpaid Invoices (unpaid_invoices.csv)
Columns
1. invoice_id (integer)
2. job_id (integer)
3. customer_id (integer)
4. customer_name (string)
5. salesman_id (integer)
6. salesman_name (string)
7. invoice_date (date)
8. due_date (date)
9. amount (number, 2dp)
10. paid (number, 2dp)
11. balance (number, 2dp)

## AR Aging (ar_aging.csv)
Columns (customer level)
1. customer_id (integer)
2. customer_name (string)
3. current (number, 2dp)
4. d1_30 (number, 2dp)
5. d31_60 (number, 2dp)
6. d61_90 (number, 2dp)
7. d90_plus (number, 2dp)
8. invoices (integer)
9. total (number, 2dp)

Notes
- Rows are one per customer; group‑by salesman variant adds salesman columns and aggregates accordingly.
- Export respects applied filters (date range, salesman, customer, state).

## Payments & Deposits (phase 2) (payments.csv)
Columns
1. payment_id (integer)
2. date (date)
3. customer_id (integer)
4. customer_name (string)
5. method (string)
6. reference (string)
7. amount (number, 2dp)
8. applied (number, 2dp)
9. unapplied (number, 2dp)

---

Header row
- All CSVs include a header row (column names as above).

Delimiters & escaping
- Fields containing commas, quotes, or newlines are wrapped in double quotes; quotes inside fields are doubled per RFC 4180.

Timezone
- Dates are normalized to business timezone at export time; stored as local date (no time).

Validation
- Numeric fields must be valid numbers; blanks only where allowed (e.g., paid may be 0.00).

