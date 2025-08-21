-- ============================================
-- Migration: Fix increment size column types for decimal support
-- Purpose: Change INTEGER columns to NUMERIC(10,2) to support 0.25" increments
-- Date: August 2025
-- ============================================

-- Change increment size columns from INTEGER to NUMERIC(10,2) to support decimal values like 0.25
ALTER TABLE stair_pricing_simple 
ALTER COLUMN length_increment_size TYPE NUMERIC(10,2),
ALTER COLUMN width_increment_size TYPE NUMERIC(10,2);

-- Drop the old constraint and add new one that works with decimal values
ALTER TABLE stair_pricing_simple 
DROP CONSTRAINT IF EXISTS chk_width_increment_size_positive;

ALTER TABLE stair_pricing_simple 
ADD CONSTRAINT chk_increment_sizes_positive 
CHECK (length_increment_size > 0 AND width_increment_size > 0);

-- Update column comments
COMMENT ON COLUMN stair_pricing_simple.length_increment_size IS 'Increment size in inches for length pricing (supports decimal values like 0.25)';
COMMENT ON COLUMN stair_pricing_simple.width_increment_size IS 'Increment size in inches for width pricing (supports decimal values like 0.25)';

-- Note: This allows for quarter-inch precision in both length and width increments
-- Examples: 0.25, 0.5, 0.75, 1.0, 1.25, etc.