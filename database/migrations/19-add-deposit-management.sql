-- Migration: Add deposit management tables and constraints
-- Description: Introduces deposits and deposit_allocations tables with supporting triggers and views

-- Create deposits table for tracking customer deposit checks
CREATE TABLE IF NOT EXISTS deposits (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  payment_method VARCHAR(20) NOT NULL DEFAULT 'check' CHECK (
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

-- Ensure each check number is unique per customer when provided
CREATE UNIQUE INDEX IF NOT EXISTS idx_deposits_customer_check_number
  ON deposits(customer_id, reference_number)
  WHERE payment_method = 'check' AND reference_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_deposits_customer_id ON deposits(customer_id);
CREATE INDEX IF NOT EXISTS idx_deposits_deposit_date ON deposits(deposit_date);
CREATE INDEX IF NOT EXISTS idx_deposits_payment_method ON deposits(payment_method);
CREATE INDEX IF NOT EXISTS idx_deposits_reference_number ON deposits(reference_number);

DROP TABLE IF EXISTS deposit_allocations CASCADE;

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

-- Augment jobs table with deposit tracking columns
DO $$
DECLARE
  total_col_exists BOOLEAN;
  balance_col_exists BOOLEAN;
BEGIN
  SELECT TRUE INTO total_col_exists
  FROM information_schema.columns
  WHERE table_name = 'jobs' AND column_name = 'total_deposits';

  IF NOT total_col_exists THEN
    EXECUTE 'ALTER TABLE jobs ADD COLUMN total_deposits DECIMAL(10,2) NOT NULL DEFAULT 0';
  END IF;

  SELECT TRUE INTO balance_col_exists
  FROM information_schema.columns
  WHERE table_name = 'jobs' AND column_name = 'balance_due';

  IF NOT balance_col_exists THEN
    EXECUTE 'ALTER TABLE jobs ADD COLUMN balance_due DECIMAL(10,2)';
    EXECUTE 'UPDATE jobs SET balance_due = COALESCE(total_amount, 0) - COALESCE(total_deposits, 0)';
  END IF;
END $$;

-- View exposing computed unallocated amounts to avoid stale data
DROP VIEW IF EXISTS deposits_with_balance;
CREATE VIEW deposits_with_balance AS
SELECT
  d.id,
  d.customer_id,
  d.payment_method,
  d.reference_number,
  d.payment_date,
  d.total_amount,
  d.deposit_date,
  d.notes,
  d.created_by,
  d.created_at,
  d.updated_at,
  d.total_amount - COALESCE(SUM(da.amount), 0) AS unallocated_amount
FROM deposits d
LEFT JOIN deposit_allocations da ON da.deposit_id = d.id
GROUP BY d.id;

-- Trigger function to maintain job-level deposit totals even when allocations move between jobs
CREATE OR REPLACE FUNCTION update_job_deposit_totals()
RETURNS TRIGGER AS $$
DECLARE
  old_job_id INTEGER;
  new_job_id INTEGER;
  has_totals_column BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'total_deposits'
  ) INTO has_totals_column;

  IF NOT has_totals_column THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'UPDATE' THEN
    old_job_id := OLD.job_id;
    new_job_id := NEW.job_id;
  ELSIF TG_OP = 'INSERT' THEN
    old_job_id := NULL;
    new_job_id := NEW.job_id;
  ELSIF TG_OP = 'DELETE' THEN
    old_job_id := OLD.job_id;
    new_job_id := NULL;
  END IF;

  IF old_job_id IS NOT NULL THEN
    UPDATE jobs
    SET total_deposits = (
      SELECT COALESCE(SUM(amount), 0)
      FROM deposit_allocations
      WHERE job_id = old_job_id
    )
    WHERE id = old_job_id;
  END IF;

  IF new_job_id IS NOT NULL AND (old_job_id IS NULL OR new_job_id <> old_job_id) THEN
    UPDATE jobs
    SET total_deposits = (
      SELECT COALESCE(SUM(amount), 0)
      FROM deposit_allocations
      WHERE job_id = new_job_id
    )
    WHERE id = new_job_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_job_deposits_trigger ON deposit_allocations;
CREATE TRIGGER update_job_deposits_trigger
AFTER INSERT OR UPDATE OR DELETE ON deposit_allocations
FOR EACH ROW EXECUTE FUNCTION update_job_deposit_totals();

-- Trigger to prevent allocations from exceeding the deposit total
CREATE OR REPLACE FUNCTION check_allocation_total()
RETURNS TRIGGER AS $$
DECLARE
  total_allocated DECIMAL(10,2);
  deposit_amount DECIMAL(10,2);
BEGIN
  SELECT total_amount INTO deposit_amount
  FROM deposits
  WHERE id = NEW.deposit_id
  FOR UPDATE;

  IF deposit_amount IS NULL THEN
    RAISE EXCEPTION 'Deposit % not found', NEW.deposit_id
      USING ERRCODE = '23503';
  END IF;

  SELECT COALESCE(SUM(amount), 0) INTO total_allocated
  FROM deposit_allocations
  WHERE deposit_id = NEW.deposit_id
    AND (TG_OP <> 'UPDATE' OR id <> NEW.id);

  IF total_allocated + NEW.amount > deposit_amount THEN
    RAISE EXCEPTION 'Total allocations (%) would exceed deposit amount (%)',
      total_allocated + NEW.amount, deposit_amount
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_allocation_total_trigger ON deposit_allocations;
CREATE TRIGGER check_allocation_total_trigger
BEFORE INSERT OR UPDATE ON deposit_allocations
FOR EACH ROW EXECUTE FUNCTION check_allocation_total();

-- Trigger to ensure job items belong to the specified job
CREATE OR REPLACE FUNCTION validate_deposit_allocation_links()
RETURNS TRIGGER AS $$
DECLARE
  item_job_id INTEGER;
BEGIN
  SELECT job_id INTO item_job_id FROM job_items WHERE id = NEW.job_item_id;

  IF item_job_id IS NULL THEN
    RAISE EXCEPTION 'Job item % does not exist', NEW.job_item_id
      USING ERRCODE = '23514';
  END IF;

  IF item_job_id <> NEW.job_id THEN
    RAISE EXCEPTION 'Job item % does not belong to job %', NEW.job_item_id, NEW.job_id
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_deposit_allocation_links_trigger ON deposit_allocations;
CREATE TRIGGER validate_deposit_allocation_links_trigger
BEFORE INSERT OR UPDATE ON deposit_allocations
FOR EACH ROW EXECUTE FUNCTION validate_deposit_allocation_links();
