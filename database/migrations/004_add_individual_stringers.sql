-- Migration: Add individual stringer configuration columns
-- Created: 2025-08-18
-- Purpose: Support individual left/right/center stringer configurations instead of just averaged values

-- Add individual stringer configuration columns
ALTER TABLE stair_configurations 
ADD COLUMN left_stringer_width DECIMAL(6,3),
ADD COLUMN left_stringer_thickness DECIMAL(6,3),
ADD COLUMN left_stringer_material_id INTEGER REFERENCES material_multipliers(material_id),
ADD COLUMN right_stringer_width DECIMAL(6,3),
ADD COLUMN right_stringer_thickness DECIMAL(6,3),
ADD COLUMN right_stringer_material_id INTEGER REFERENCES material_multipliers(material_id),
ADD COLUMN center_stringer_width DECIMAL(6,3),
ADD COLUMN center_stringer_thickness DECIMAL(6,3),
ADD COLUMN center_stringer_material_id INTEGER REFERENCES material_multipliers(material_id);

-- Add comments for documentation
COMMENT ON COLUMN stair_configurations.left_stringer_width IS 'Width of left stringer in inches';
COMMENT ON COLUMN stair_configurations.left_stringer_thickness IS 'Thickness of left stringer in inches';
COMMENT ON COLUMN stair_configurations.left_stringer_material_id IS 'Material ID for left stringer';
COMMENT ON COLUMN stair_configurations.right_stringer_width IS 'Width of right stringer in inches';
COMMENT ON COLUMN stair_configurations.right_stringer_thickness IS 'Thickness of right stringer in inches';
COMMENT ON COLUMN stair_configurations.right_stringer_material_id IS 'Material ID for right stringer';
COMMENT ON COLUMN stair_configurations.center_stringer_width IS 'Width of center stringer in inches (if exists)';
COMMENT ON COLUMN stair_configurations.center_stringer_thickness IS 'Thickness of center stringer in inches (if exists)';
COMMENT ON COLUMN stair_configurations.center_stringer_material_id IS 'Material ID for center stringer (if exists)';

-- Update existing configurations with individual stringer data where possible
-- For existing records, set left and right stringers to the same values as the current stringer_type
-- Extract width and thickness from stringer_type format (e.g., "1x9.25" -> thickness=1, width=9.25)
UPDATE stair_configurations 
SET 
  left_stringer_width = CASE 
    WHEN stringer_type ~ '^[0-9.]+x[0-9.]+' THEN 
      CAST(split_part(stringer_type, 'x', 2) AS DECIMAL(6,3))
    ELSE 9.25 
  END,
  left_stringer_thickness = CASE 
    WHEN stringer_type ~ '^[0-9.]+x[0-9.]+' THEN 
      CAST(split_part(stringer_type, 'x', 1) AS DECIMAL(6,3))
    ELSE 1.0 
  END,
  left_stringer_material_id = stringer_material_id,
  right_stringer_width = CASE 
    WHEN stringer_type ~ '^[0-9.]+x[0-9.]+' THEN 
      CAST(split_part(stringer_type, 'x', 2) AS DECIMAL(6,3))
    ELSE 9.25 
  END,
  right_stringer_thickness = CASE 
    WHEN stringer_type ~ '^[0-9.]+x[0-9.]+' THEN 
      CAST(split_part(stringer_type, 'x', 1) AS DECIMAL(6,3))
    ELSE 1.0 
  END,
  right_stringer_material_id = stringer_material_id
WHERE left_stringer_width IS NULL;

-- For configurations with center horses, set center stringer to double thickness
UPDATE stair_configurations 
SET 
  center_stringer_width = left_stringer_width,
  center_stringer_thickness = left_stringer_thickness * 2,
  center_stringer_material_id = left_stringer_material_id
WHERE center_horses > 0 AND center_stringer_width IS NULL;