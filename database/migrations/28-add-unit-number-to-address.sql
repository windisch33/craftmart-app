-- Add unit_number field to customers and projects (jobs)
-- Customers: store apartment/suite/unit information
ALTER TABLE IF EXISTS customers
  ADD COLUMN IF NOT EXISTS unit_number VARCHAR(50);

-- Projects (parent jobs table): store apartment/suite/unit information
ALTER TABLE IF EXISTS jobs
  ADD COLUMN IF NOT EXISTS unit_number VARCHAR(50);

-- Optional indexes for common filtering/ordering patterns are not needed here
-- since unit numbers are low-cardinality and mostly for display.

