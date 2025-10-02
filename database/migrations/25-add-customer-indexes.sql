-- Add helpful indexes for customers table
-- Name-based sorting/searching
CREATE INDEX IF NOT EXISTS idx_customers_name_lower ON customers (lower(name));

-- State filter
CREATE INDEX IF NOT EXISTS idx_customers_state ON customers (state);

