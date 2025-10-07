-- Add address fields to parent jobs table (projects)
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS state VARCHAR(2),
  ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20);

-- Optional: indexes for lookups by city/state
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'idx_jobs_city' AND n.nspname = 'public'
  ) THEN
    CREATE INDEX idx_jobs_city ON jobs (city);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'idx_jobs_state' AND n.nspname = 'public'
  ) THEN
    CREATE INDEX idx_jobs_state ON jobs (state);
  END IF;
END $$;

