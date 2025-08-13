-- Add stair_config_id column to quote_items table to properly link stair configurations
ALTER TABLE quote_items 
ADD COLUMN IF NOT EXISTS stair_config_id INTEGER REFERENCES stair_configurations(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_quote_items_stair_config ON quote_items(stair_config_id);

-- Update existing STAIR- items to try to link them
-- This will try to extract the config ID from part numbers like 'STAIR-123'
UPDATE quote_items 
SET stair_config_id = SUBSTRING(part_number FROM 'STAIR-([0-9]+)')::INTEGER
WHERE part_number LIKE 'STAIR-%' 
  AND part_number ~ 'STAIR-[0-9]+'
  AND stair_config_id IS NULL;