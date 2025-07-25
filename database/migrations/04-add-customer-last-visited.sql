-- Add last_visited_at column to track customer visits
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_visited_at TIMESTAMP;

-- Create index for efficient sorting by last visited
CREATE INDEX IF NOT EXISTS idx_customers_last_visited ON customers(last_visited_at DESC);

-- Initialize existing customers with a visited timestamp based on their updated_at
-- This ensures we have some data to work with initially
UPDATE customers 
SET last_visited_at = updated_at 
WHERE last_visited_at IS NULL;