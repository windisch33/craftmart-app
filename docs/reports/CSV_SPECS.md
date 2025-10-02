# CSV Export Specifications

This document defines CSV outputs for the Reports area. All CSVs are RFC 4180 compliant and encoded UTF‑8 with CRLF line endings for broad compatibility.

General rules
- Numbers: plain digits with decimal point; no thousand separators.
- Currency: numeric values in base currency (no symbol) unless stated. Example: 12345.67
- Dates: `YYYY-MM-DD` in business timezone context (America/New_York) but serialized as date literals without offset.
- Headers: included on first row; field order is fixed as below for each report.
- Filenames: `{report_key}_{YYYY-MM}` for month ranges or `{report_key}_{YYYY-MM-DD}_to_{YYYY-MM-DD}` for arbitrary ranges.

Report keys
- `sales_by_month`, `sales_by_salesman`, `sales_by_customer`, `tax_by_state`, `ar_unpaid`, `ar_aging`, `invoices`, `invoice_items`

Sales by Month
- Columns
  - `month` (YYYY-MM)
  - `invoices` (int)
  - `subtotal` (number)
  - `tax` (number)
  - `total` (number)
- Sample
```
month,invoices,subtotal,tax,total
2025-05,112,123456.00,8641.92,132097.92
```

Sales by Salesman
- Columns
  - `salesman_id` (int)
  - `salesman_name` (string)
  - `invoices` (int)
  - `subtotal` (number)
  - `tax` (number)
  - `total` (number)
  - `avg_invoice` (number)
  - `last_invoice_date` (YYYY-MM-DD)
- Sample
```
salesman_id,salesman_name,invoices,subtotal,tax,total,avg_invoice,last_invoice_date
3,Jane Smith,16,88000.00,6160.00,94160.00,5885.00,2025-05-28
```

Sales by Customer
- Columns
  - `customer_id` (int)
  - `customer_name` (string)
  - `invoices` (int)
  - `subtotal` (number)
  - `tax` (number)
  - `total` (number)
  - `last_invoice_date` (YYYY-MM-DD)
- Sample
```
customer_id,customer_name,invoices,subtotal,tax,total,last_invoice_date
42,ACME Homes,9,65432.10,3925.93,69358.03,2025-05-23
```

Tax by State
- Columns
  - `state` (string, 2-letter)
  - `invoices` (int)
  - `taxable` (number)
  - `non_taxable_labor` (number, optional)
  - `tax_exempt_amount` (number, optional)
  - `tax` (number)
  - `effective_rate` (number)
- Sample
```
state,invoices,taxable,non_taxable_labor,tax_exempt_amount,tax,effective_rate
MD,63,250000.00,500.00,97.50,15000.00,0.0600
```

Unpaid Invoices (AR Open Items)
- Columns
  - `invoice_id` (int)
  - `invoice_number` (string)
  - `order_id` (int)
  - `order_number` (string)
  - `po_number` (string)
  - `job_title` (string)
  - `customer_id` (int)
  - `customer_name` (string)
  - `salesman_id` (int)
  - `salesman_name` (string)
  - `invoice_date` (YYYY-MM-DD)
  - `due_date` (YYYY-MM-DD)
  - `amount` (number)
  - `paid` (number)
  - `balance` (number)
- Sample
```
invoice_id,invoice_number,order_id,order_number,po_number,job_title,customer_id,customer_name,salesman_id,salesman_name,invoice_date,due_date,amount,paid,balance
1001,INV-1001,1001,ORD-1001,PO 17802,Custom Stair,42,ACME Homes,3,Jane Smith,2025-05-03,2025-06-02,5800.00,3800.00,2000.00
```

AR Aging (Customer Level)
- Columns
  - `customer_id` (int)
  - `customer_name` (string)
  - `current` (number)
  - `d1_30` (number)
  - `d31_60` (number)
  - `d61_90` (number)
  - `d90_plus` (number)
  - `invoices` (int)
  - `total` (number)
- Sample
```
customer_id,customer_name,current,d1_30,d31_60,d61_90,d90_plus,invoices,total
42,ACME Homes,0.00,1200.00,800.00,0.00,0.00,3,2000.00
```

Invoices (Shared Drill‑Down)
- Columns
  - `invoice_id` (int)
  - `invoice_number` (string)
  - `order_id` (int)
  - `order_number` (string)
  - `po_number` (string)
  - `job_title` (string)
  - `customer_id` (int)
  - `customer_name` (string)
  - `salesman_id` (int)
  - `salesman_name` (string)
  - `invoice_date` (YYYY-MM-DD)
  - `due_date` (YYYY-MM-DD)
  - `paid_date` (YYYY-MM-DD or empty)
  - `subtotal` (number)
  - `labor` (number)
  - `tax` (number)
  - `total` (number)
  - `paid_amount` (number)
  - `open_balance` (number)
- Sample
```
invoice_id,invoice_number,order_id,order_number,po_number,job_title,customer_id,customer_name,salesman_id,salesman_name,invoice_date,due_date,paid_date,subtotal,labor,tax,total,paid_amount,open_balance
1001,INV-1001,1001,ORD-1001,PO 17802,Custom Stair,42,ACME Homes,3,Jane Smith,2025-05-03,2025-06-02,2025-05-15,5200.00,875.00,600.00,5800.00,5800.00,0.00
```

Invoice Items (Level 2 Drill‑Down)
- Columns
  - `invoice_id` (int)
  - `section` (string)
  - `item_description` (string)
  - `quantity` (number)
  - `unit_price` (number)
  - `line_total` (number)
- Sample
```
invoice_id,section,item_description,quantity,unit_price,line_total
1001,Main,Railing 8ft,2,250.00,500.00
```

Filename patterns
- Monthly: `{report_key}_{YYYY-MM}.csv`
- Arbitrary range: `{report_key}_{YYYY-MM-DD}_to_{YYYY-MM-DD}.csv`

PDF endpoints
- Each report has a dedicated `/pdf` endpoint returning a PDF with a summary row:
  - `/api/reports/sales/by-month/pdf`
  - `/api/reports/sales/by-salesman/pdf`
  - `/api/reports/sales/by-customer/pdf`
  - `/api/reports/tax/by-state/pdf`
  - `/api/reports/ar/unpaid/pdf`
  - `/api/reports/ar/aging/pdf`
  - `/api/reports/invoices/pdf`
