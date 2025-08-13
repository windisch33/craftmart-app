-- Migration: Update Tread Sizing for Flexible Input
-- Date: 2025-08-06
-- Description: Add rough_cut_width field to support separate rough cut and nose sizing

-- ============================================
-- 1. ADD ROUGH_CUT_WIDTH COLUMN
-- ============================================
ALTER TABLE stair_configurations 
ADD COLUMN IF NOT EXISTS rough_cut_width DECIMAL(6,3);

-- ============================================
-- 2. POPULATE EXISTING DATA
-- ============================================
-- Parse existing tread_size values and populate rough_cut_width
-- Format: "10x1.25" -> rough_cut_width = 10
UPDATE stair_configurations 
SET rough_cut_width = CAST(
    SPLIT_PART(SPLIT_PART(tread_size, 'x', 1), '"', 1) AS DECIMAL(6,3)
)
WHERE tread_size IS NOT NULL 
  AND rough_cut_width IS NULL
  AND tread_size ~ '^\d+(\.\d+)?x\d+(\.\d+)?$';

-- Handle cases where tread_size has quotes or different format
-- Format: "10" x 1.25" or similar variations
UPDATE stair_configurations 
SET rough_cut_width = CAST(
    TRIM(REGEXP_REPLACE(SPLIT_PART(tread_size, 'x', 1), '[^0-9.]', '', 'g')) AS DECIMAL(6,3)
)
WHERE rough_cut_width IS NULL 
  AND tread_size IS NOT NULL
  AND LENGTH(TRIM(REGEXP_REPLACE(SPLIT_PART(tread_size, 'x', 1), '[^0-9.]', '', 'g'))) > 0;

-- Set default rough_cut_width for any remaining NULL values
UPDATE stair_configurations 
SET rough_cut_width = 10.0
WHERE rough_cut_width IS NULL;

-- ============================================
-- 3. ADD CONSTRAINTS
-- ============================================
-- Add constraint to ensure rough_cut_width is within reasonable range
ALTER TABLE stair_configurations 
ADD CONSTRAINT chk_rough_cut_width 
CHECK (rough_cut_width >= 6.0 AND rough_cut_width <= 24.0);

-- Add constraint to ensure nose_size is within reasonable range if not already present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chk_nose_size' 
        AND table_name = 'stair_configurations'
    ) THEN
        ALTER TABLE stair_configurations 
        ADD CONSTRAINT chk_nose_size 
        CHECK (nose_size >= 0.25 AND nose_size <= 3.0);
    END IF;
END
$$;

-- ============================================
-- 4. CREATE INDEX
-- ============================================
CREATE INDEX IF NOT EXISTS idx_stair_config_rough_cut ON stair_configurations(rough_cut_width);

-- ============================================
-- 5. ADD HELPFUL COMMENTS
-- ============================================
COMMENT ON COLUMN stair_configurations.rough_cut_width IS 'Width of rough cut tread lumber in inches (before nose is added)';
COMMENT ON COLUMN stair_configurations.nose_size IS 'Overhang/bullnose size in inches';
COMMENT ON COLUMN stair_configurations.tread_size IS 'Legacy combined tread size string (maintained for compatibility)';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================