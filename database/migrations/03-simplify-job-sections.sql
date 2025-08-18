-- Migration to simplify job sections by removing complex fields
-- This simplifies sections to just be labels for grouping products

-- Remove unused columns from job_sections table
ALTER TABLE job_sections 
DROP COLUMN IF EXISTS description,
DROP COLUMN IF EXISTS is_labor_section,
DROP COLUMN IF EXISTS is_misc_section;

-- Add comment to document the simplified structure
COMMENT ON TABLE job_sections IS 'Simplified job sections - just labels for grouping products';
COMMENT ON COLUMN job_sections.name IS 'Section name - simple label for grouping items';
COMMENT ON COLUMN job_sections.display_order IS 'Order for displaying sections in the UI';