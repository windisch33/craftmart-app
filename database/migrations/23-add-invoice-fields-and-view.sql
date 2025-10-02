-- Migration 23: Add invoice fields to job_items and create invoices_view
-- Purpose: Support reports with authoritative invoice_date/due_date/terms and expose a read model for reporting.

-- 1) Add columns to job_items
ALTER TABLE job_items
  ADD COLUMN IF NOT EXISTS invoice_date DATE,
  ADD COLUMN IF NOT EXISTS net_terms_days INTEGER DEFAULT 30,
  ADD COLUMN IF NOT EXISTS due_date DATE;

-- 2) Helpful indexes for reporting
CREATE INDEX IF NOT EXISTS idx_job_items_invoice_date ON job_items(invoice_date);
CREATE INDEX IF NOT EXISTS idx_job_items_due_date ON job_items(due_date);
-- Support payment computations
CREATE INDEX IF NOT EXISTS idx_deposit_allocations_job_item_date ON deposit_allocations(job_item_id, allocation_date);
CREATE INDEX IF NOT EXISTS idx_deposits_payment_date ON deposits(payment_date);

-- 3) Create invoices_view with AR fields
DROP VIEW IF EXISTS invoices_view;
CREATE VIEW invoices_view AS
WITH base AS (
  SELECT 
    ji.id                       AS invoice_id,
    ('INV-' || ji.id::text)     AS invoice_number,
    ji.id                       AS order_id,
    ('ORD-' || ji.id::text)     AS order_number,
    COALESCE(ji.title, 'Job Item ' || ji.id::text) AS job_title,
    ji.customer_id,
    c.name                      AS customer_name,
    ji.salesman_id,
    (s.first_name || ' ' || s.last_name) AS salesman_name,
    c.state                     AS state,
    CAST(COALESCE(ji.subtotal, 0) AS numeric)     AS subtotal,
    CAST(COALESCE(ji.tax_amount, 0) AS numeric)   AS tax_amount,
    CAST(COALESCE(ji.total_amount, 0) AS numeric) AS total_amount,
    -- Dates
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
  b.job_title,
  b.customer_id,
  b.customer_name,
  b.salesman_id,
  b.salesman_name,
  b.state,
  b.subtotal,
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

-- 4) Trigger to auto-populate invoice_date and due_date when status becomes 'invoice'
CREATE OR REPLACE FUNCTION set_invoice_dates()
RETURNS TRIGGER AS $$
BEGIN
  -- On INSERT
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'invoice' THEN
      IF NEW.invoice_date IS NULL THEN
        NEW.invoice_date := CURRENT_DATE;
      END IF;
      IF NEW.due_date IS NULL THEN
        NEW.due_date := NEW.invoice_date + COALESCE(NEW.net_terms_days, 30);
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  -- On UPDATE: detect transition to 'invoice'
  IF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'invoice' AND (OLD.status IS DISTINCT FROM 'invoice') THEN
      IF NEW.invoice_date IS NULL THEN
        NEW.invoice_date := CURRENT_DATE;
      END IF;
    END IF;
    -- Maintain due_date if invoice_date/terms present and due_date missing
    IF NEW.status = 'invoice' AND NEW.due_date IS NULL THEN
      NEW.due_date := COALESCE(NEW.invoice_date, CURRENT_DATE) + COALESCE(NEW.net_terms_days, 30);
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_invoice_dates_insert ON job_items;
CREATE TRIGGER trg_set_invoice_dates_insert
BEFORE INSERT ON job_items
FOR EACH ROW EXECUTE FUNCTION set_invoice_dates();

DROP TRIGGER IF EXISTS trg_set_invoice_dates_update ON job_items;
CREATE TRIGGER trg_set_invoice_dates_update
BEFORE UPDATE ON job_items
FOR EACH ROW EXECUTE FUNCTION set_invoice_dates();

-- 5) Backfill existing data for current invoices
UPDATE job_items
SET invoice_date = COALESCE(invoice_date, created_at::date)
WHERE status = 'invoice' AND invoice_date IS NULL;

UPDATE job_items
SET due_date = COALESCE(due_date, COALESCE(invoice_date, created_at::date) + COALESCE(net_terms_days, 30))
WHERE status = 'invoice' AND due_date IS NULL;

-- Optional: materialized view for heavy workloads (run manually or in a separate migration if desired)
-- DROP MATERIALIZED VIEW IF EXISTS invoices_mv;
-- CREATE MATERIALIZED VIEW invoices_mv AS
-- SELECT * FROM invoices_view;
-- CREATE INDEX IF NOT EXISTS idx_invoices_mv_invoice_date ON invoices_mv(invoice_date);
-- CREATE INDEX IF NOT EXISTS idx_invoices_mv_customer_id ON invoices_mv(customer_id);
-- CREATE INDEX IF NOT EXISTS idx_invoices_mv_salesman_id ON invoices_mv(salesman_id);
-- CREATE INDEX IF NOT EXISTS idx_invoices_mv_state ON invoices_mv(state);
-- CREATE INDEX IF NOT EXISTS idx_invoices_mv_due_date ON invoices_mv(due_date);
