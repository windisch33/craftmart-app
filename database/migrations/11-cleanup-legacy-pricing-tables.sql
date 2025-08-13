-- Migration: Clean up legacy pricing tables and migrate to new system
-- Date: August 12, 2025
-- Description: Remove old pricing tables (stair_board_prices, stair_materials) and update references

BEGIN;

-- Step 1: Drop foreign key constraints pointing to stair_materials
ALTER TABLE stair_board_prices DROP CONSTRAINT IF EXISTS stair_board_prices_mat_seq_n_fkey;
ALTER TABLE stair_special_parts DROP CONSTRAINT IF EXISTS stair_special_parts_mat_seq_n_fkey;
ALTER TABLE stair_configurations DROP CONSTRAINT IF EXISTS stair_configurations_tread_material_id_fkey;
ALTER TABLE stair_configurations DROP CONSTRAINT IF EXISTS stair_configurations_riser_material_id_fkey;
ALTER TABLE stair_configurations DROP CONSTRAINT IF EXISTS stair_configurations_stringer_material_id_fkey;
ALTER TABLE stair_config_items DROP CONSTRAINT IF EXISTS stair_config_items_material_id_fkey;

-- Step 2: Create mapping between old mat_seq_n and new material_id
-- First, ensure material_multipliers has all necessary materials
INSERT INTO material_multipliers (material_id, material_name, multiplier, display_order, is_active)
SELECT 
    mat_seq_n as material_id,
    matrl_nam as material_name,
    multiplier,
    mat_seq_n as display_order,
    is_active
FROM stair_materials
WHERE mat_seq_n NOT IN (SELECT material_id FROM material_multipliers)
ON CONFLICT (material_id) DO NOTHING;

-- Step 3: Update stair_configurations to use material_multipliers IDs
-- (They already use the same ID system, so no data change needed, just constraints)

-- Step 4: Update stair_special_parts to use material_multipliers IDs
-- (They already use the same ID system, so no data change needed, just constraints)

-- Step 5: Drop the old calculate_stair_price function
DROP FUNCTION IF EXISTS calculate_stair_price(integer, integer, numeric, numeric, integer, boolean);

-- Step 6: Drop legacy tables
DROP TABLE IF EXISTS stair_board_prices CASCADE;
DROP TABLE IF EXISTS stair_materials CASCADE;

-- Step 7: Add new foreign key constraints to material_multipliers
ALTER TABLE stair_configurations 
    ADD CONSTRAINT stair_configurations_tread_material_id_fkey 
    FOREIGN KEY (tread_material_id) REFERENCES material_multipliers(material_id);

ALTER TABLE stair_configurations 
    ADD CONSTRAINT stair_configurations_riser_material_id_fkey 
    FOREIGN KEY (riser_material_id) REFERENCES material_multipliers(material_id);

ALTER TABLE stair_configurations 
    ADD CONSTRAINT stair_configurations_stringer_material_id_fkey 
    FOREIGN KEY (stringer_material_id) REFERENCES material_multipliers(material_id);

ALTER TABLE stair_config_items 
    ADD CONSTRAINT stair_config_items_material_id_fkey 
    FOREIGN KEY (material_id) REFERENCES material_multipliers(material_id);

ALTER TABLE stair_special_parts 
    ADD CONSTRAINT stair_special_parts_mat_seq_n_fkey 
    FOREIGN KEY (mat_seq_n) REFERENCES material_multipliers(material_id);

-- Step 8: Add helpful comments
COMMENT ON TABLE material_multipliers IS 'Material pricing multipliers for stair components (replaced stair_materials)';
COMMENT ON TABLE stair_pricing_simple IS 'Simplified stair pricing with base + increment formula (replaced stair_board_prices)';
COMMENT ON FUNCTION calculate_stair_price_simple IS 'Current stair pricing function using simplified formula';

-- Log the migration
DO $$
BEGIN
    RAISE NOTICE 'Migration complete: Legacy pricing tables removed';
    RAISE NOTICE '- Dropped stair_board_prices table';
    RAISE NOTICE '- Dropped stair_materials table';
    RAISE NOTICE '- Dropped calculate_stair_price() function';
    RAISE NOTICE '- Updated foreign keys to use material_multipliers';
END $$;

COMMIT;