-- Migration 24: Add PO number to job_items and update invoices_view

ALTER TABLE job_items
  ADD COLUMN IF NOT EXISTS po_number VARCHAR(100);

-- Optional index if PO is commonly searched/sorted
CREATE INDEX IF NOT EXISTS idx_job_items_po_number ON job_items(po_number);

-- Backfill from order_designation if it appears to be a PO indicator
UPDATE job_items
SET po_number = CASE 
  WHEN po_number IS NULL AND order_designation IS NOT NULL AND order_designation <> '' THEN order_designation
  ELSE po_number
END
WHERE po_number IS NULL;

-- Recreate invoices_view to include po_number and labor_total explicitly
DROP VIEW IF EXISTS invoices_view;
CREATE VIEW invoices_view AS
WITH base AS (
  SELECT 
    ji.id                       AS invoice_id,
    ('INV-' || ji.id::text)     AS invoice_number,
    ji.id                       AS order_id,
    ('ORD-' || ji.id::text)     AS order_number,
    COALESCE(ji.po_number, ji.order_designation) AS po_number,
    COALESCE(ji.title, 'Job Item ' || ji.id::text) AS job_title,
    ji.customer_id,
    c.name                      AS customer_name,
    ji.salesman_id,
    (s.first_name || ' ' || s.last_name) AS salesman_name,
    c.state                     AS state,
    CAST(COALESCE(ji.subtotal, 0) AS numeric)     AS subtotal,
    CAST(COALESCE(ji.labor_total, 0) AS numeric)  AS labor_total,
    CAST(COALESCE(ji.tax_amount, 0) AS numeric)   AS tax_amount,
    CAST(COALESCE(ji.total_amount, 0) AS numeric) AS total_amount,
    COALESCE(ji.invoice_date, ji.created_at::date) AS invoice_date,
    COALESCE(ji.due_date, COALESCE(ji.invoice_date, ji.created_at::date) + COALESCE(ji.net_terms_days, 30)) AS due_date
  FROM job_items ji
  LEFT JOIN customers c ON c.id = ji.customer_id
  LEFT JOIN salesmen s  ON s.id = ji.salesman_id
  WHERE ji.status = 'invoice'
), paid_totals AS (
  SELECT da.job_item_id, SUM(da.amount) AS paid_amount
  FROM deposit_allocations da
  GROUP BY da.job_item_id
), paid_dates AS (
  SELECT r.job_item_id,
         MIN(r.paid_component_date) FILTER (WHERE r.running_alloc >= bt.total_amount AND bt.total_amount IS NOT NULL) AS paid_date
  FROM (
    SELECT a.job_item_id,
           COALESCE(d.payment_date::date, a.allocation_date::date) AS paid_component_date,
           a.amount,
           SUM(a.amount) OVER (
             PARTITION BY a.job_item_id
             ORDER BY COALESCE(d.payment_date, a.allocation_date), a.id
             ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
           ) AS running_alloc
    FROM deposit_allocations a
    JOIN deposits d ON d.id = a.deposit_id
  ) r
  JOIN (
    SELECT b.invoice_id, b.total_amount FROM base b
  ) bt ON bt.invoice_id = r.job_item_id
  GROUP BY r.job_item_id
)
SELECT 
  b.invoice_id,
  b.invoice_number,
  b.order_id,
  b.order_number,
  b.po_number,
  b.job_title,
  b.customer_id,
  b.customer_name,
  b.salesman_id,
  b.salesman_name,
  b.state,
  b.subtotal,
  b.subtotal AS taxable_amount,
  b.labor_total,
  b.tax_amount,
  b.total_amount,
  b.invoice_date,
  b.due_date,
  COALESCE(pt.paid_amount, 0) AS paid_amount,
  COALESCE(pd.paid_date, NULL) AS paid_date,
  (b.total_amount - COALESCE(pt.paid_amount, 0)) AS open_balance
FROM base b
LEFT JOIN paid_totals pt ON pt.job_item_id = b.invoice_id
LEFT JOIN paid_dates pd  ON pd.job_item_id = b.invoice_id;
