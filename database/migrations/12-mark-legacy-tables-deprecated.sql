-- Mark legacy tables as deprecated
-- These tables are kept for historical reference but are no longer actively used

-- Comment on stair_materials table (replaced by material_multipliers)
COMMENT ON TABLE stair_materials IS 
  'DEPRECATED - Legacy stair materials table. Use material_multipliers instead. 
   Kept for historical reference. All new pricing uses simplified formula-based system.';

-- Comment on stair_board_prices table (replaced by stair_pricing_simple)  
COMMENT ON TABLE stair_board_prices IS 
  'DEPRECATED - Legacy complex pricing matrix with 32 rules. Use stair_pricing_simple instead.
   Kept for historical reference and price comparison. No longer updated or used in calculations.';

-- Comment on legacy columns in stair_board_types
COMMENT ON COLUMN stair_board_types.pric_riser IS 'DEPRECATED - Legacy pricing flag, no longer used';
COMMENT ON COLUMN stair_board_types.pric_bxris IS 'DEPRECATED - Legacy pricing flag, no longer used';
COMMENT ON COLUMN stair_board_types.pric_opris IS 'DEPRECATED - Legacy pricing flag, no longer used';
COMMENT ON COLUMN stair_board_types.pric_doris IS 'DEPRECATED - Legacy pricing flag, no longer used';

-- Comment on legacy columns in stair_materials
COMMENT ON COLUMN stair_materials.matrl_abv IS 'DEPRECATED - Abbreviations no longer used in system';

-- Add helpful comments to new tables
COMMENT ON TABLE material_multipliers IS 
  'Simplified material pricing multipliers for stair calculations. 
   Red Oak = 1.0 (base), other materials are relative to Red Oak.';

COMMENT ON TABLE stair_pricing_simple IS 
  'Simplified formula-based pricing for stair components.
   Formula: (base_price + length_charge + width_charge) × material_multiplier + mitre_charge';

-- Add comments to clarify the pricing formula columns
COMMENT ON COLUMN stair_pricing_simple.base_price IS 'Base price for standard size (typically 36" × 9")';
COMMENT ON COLUMN stair_pricing_simple.length_increment_price IS 'Price per increment (typically per 6") over base length';
COMMENT ON COLUMN stair_pricing_simple.width_increment_price IS 'Price per inch over base width';
COMMENT ON COLUMN stair_pricing_simple.mitre_price IS 'Additional charge for full mitre cuts';
COMMENT ON COLUMN stair_pricing_simple.base_length IS 'Standard length in inches (default 36")';
COMMENT ON COLUMN stair_pricing_simple.base_width IS 'Standard width in inches (default 9")';

COMMENT ON COLUMN material_multipliers.multiplier IS 'Price multiplier relative to Red Oak (1.0 = base)';