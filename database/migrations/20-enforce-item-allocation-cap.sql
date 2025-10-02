-- Migration: Enforce per-item allocation cap
-- Description: Adds trigger to prevent allocating more than a job item's total amount.

-- Guard: Trigger function checks for presence of job_items.total_amount column.
-- If the column is missing or not positive, the trigger is a no-op for compatibility.

CREATE OR REPLACE FUNCTION check_item_allocation_total()
RETURNS TRIGGER AS $$
DECLARE
  has_total_col BOOLEAN;
  item_total DECIMAL(10,2);
  total_allocated DECIMAL(10,2);
BEGIN
  -- Verify column existence (optional feature)
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'job_items' AND column_name = 'total_amount'
  ) INTO has_total_col;

  IF NOT has_total_col THEN
    RETURN NEW;
  END IF;

  -- Fetch the item's total amount
  SELECT total_amount INTO item_total
  FROM job_items
  WHERE id = NEW.job_item_id;

  -- If total is NULL or not positive, skip enforcement
  IF item_total IS NULL OR item_total <= 0 THEN
    RETURN NEW;
  END IF;

  -- Sum existing allocations for this item (exclude current row on UPDATE)
  SELECT COALESCE(SUM(amount), 0) INTO total_allocated
  FROM deposit_allocations
  WHERE job_item_id = NEW.job_item_id
    AND (TG_OP <> 'UPDATE' OR id <> NEW.id);

  IF total_allocated + NEW.amount > item_total THEN
    RAISE EXCEPTION 'Item allocations (%) would exceed item total (%) for job_item %',
      total_allocated + NEW.amount, item_total, NEW.job_item_id
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_item_allocation_total_trigger ON deposit_allocations;
CREATE TRIGGER check_item_allocation_total_trigger
BEFORE INSERT OR UPDATE ON deposit_allocations
FOR EACH ROW EXECUTE FUNCTION check_item_allocation_total();

