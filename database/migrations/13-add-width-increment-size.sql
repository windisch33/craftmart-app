-- ============================================
-- Migration: Add width_increment_size field
-- Purpose: Allow configurable width increments like length increments
-- Date: August 2025
-- ============================================

-- Add width_increment_size column to stair_pricing_simple table
ALTER TABLE stair_pricing_simple 
ADD COLUMN IF NOT EXISTS width_increment_size INTEGER DEFAULT 1;

-- Update column comment
COMMENT ON COLUMN stair_pricing_simple.width_increment_size IS 'Increment size in inches for width pricing (default 1 inch)';

-- Update existing records to have width_increment_size = 1 for backward compatibility
UPDATE stair_pricing_simple 
SET width_increment_size = 1 
WHERE width_increment_size IS NULL;

-- Add constraint to ensure positive values
ALTER TABLE stair_pricing_simple 
ADD CONSTRAINT chk_width_increment_size_positive 
CHECK (width_increment_size > 0);

COMMENT ON TABLE stair_pricing_simple IS 'Simplified formula-based stair pricing using base price plus configurable increments for both length and width';