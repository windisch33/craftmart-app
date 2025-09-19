-- Ensure shops run tracking lives on job_items (orders),
-- aligning with API logic and filters.

ALTER TABLE job_items 
  ADD COLUMN IF NOT EXISTS shops_run BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS shops_run_date TIMESTAMP NULL;

-- Indexes to support filtering and sorting
CREATE INDEX IF NOT EXISTS idx_jobs_shops_run ON job_items(shops_run);
CREATE INDEX IF NOT EXISTS idx_jobs_shops_run_status ON job_items(status, shops_run);

