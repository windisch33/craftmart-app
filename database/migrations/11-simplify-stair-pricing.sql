-- ============================================
-- Migration: Simplify Stair Pricing System
-- Date: 2025-01-12
-- Purpose: 
--   1. Update Oak references to Red Oak for clarity
--   2. Create simplified formula-based pricing tables
--   3. Migrate existing pricing to new structure
-- ============================================

-- ============================================
-- STEP 1: Update Oak Material References
-- ============================================

-- First, ensure Red Oak exists with proper ID
INSERT INTO stair_materials (mat_seq_n, matrl_abv, matrl_nam, description, multiplier, is_active)
VALUES (20, 'K', 'Red Oak', 'Standard red oak material', 1.0, true)
ON CONFLICT (mat_seq_n) DO UPDATE
SET matrl_nam = 'Red Oak',
    description = 'Standard red oak material',
    multiplier = 1.0;

-- Update White Oak to ensure consistency
UPDATE stair_materials 
SET description = 'Premium white oak material',
    multiplier = 1.1
WHERE mat_seq_n = 14;

-- Update all pricing rules from Oak (5) to Red Oak (20)
UPDATE stair_board_prices 
SET mat_seq_n = 20
WHERE mat_seq_n = 5;

-- Update all special parts from Oak (5) to Red Oak (20)
UPDATE stair_special_parts
SET mat_seq_n = 20
WHERE mat_seq_n = 5;

-- Update Select Oak (2) to Red Oak (20)
UPDATE stair_board_prices 
SET mat_seq_n = 20
WHERE mat_seq_n = 2;

UPDATE stair_special_parts
SET mat_seq_n = 20
WHERE mat_seq_n = 2;

-- Update any stair configurations using old Oak
UPDATE stair_configurations
SET tread_material_id = 20
WHERE tread_material_id IN (5, 2);

UPDATE stair_configurations
SET riser_material_id = 20
WHERE riser_material_id IN (5, 2);

UPDATE stair_configurations
SET stringer_material_id = 20
WHERE stringer_material_id IN (5, 2);

-- Mark old Oak materials as inactive
UPDATE stair_materials
SET is_active = false,
    description = description || ' (DEPRECATED - Use Red Oak)'
WHERE mat_seq_n IN (5, 2, 23); -- Oak, Select Oak, 2nd Grade Oak

-- ============================================
-- STEP 2: Create New Simplified Pricing Tables
-- ============================================

-- Drop the complex stored procedure
DROP FUNCTION IF EXISTS calculate_stair_price CASCADE;

-- Create simplified pricing structure
CREATE TABLE IF NOT EXISTS stair_pricing_simple (
    id SERIAL PRIMARY KEY,
    board_type_id INTEGER NOT NULL REFERENCES stair_board_types(brd_typ_id),
    base_price DECIMAL(10, 2) NOT NULL,
    length_increment_price DECIMAL(10, 2) DEFAULT 1.50, -- per 6" over 36"
    width_increment_price DECIMAL(10, 2) DEFAULT 2.25,  -- per inch over 9"
    mitre_price DECIMAL(10, 2) DEFAULT 0,
    base_length INTEGER DEFAULT 36, -- length where increments start
    base_width INTEGER DEFAULT 9,   -- width where increments start
    length_increment_size INTEGER DEFAULT 6, -- increment size in inches
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(board_type_id)
);

-- Create material multipliers table (simplified from stair_materials)
CREATE TABLE IF NOT EXISTS material_multipliers (
    material_id INTEGER PRIMARY KEY,
    material_name VARCHAR(50) NOT NULL,
    abbreviation VARCHAR(5),
    multiplier DECIMAL(5, 2) NOT NULL DEFAULT 1.0,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- STEP 3: Populate Simplified Pricing Tables
-- ============================================

-- Insert base prices derived from analyzing existing Oak (now Red Oak) prices
INSERT INTO stair_pricing_simple (board_type_id, base_price, length_increment_price, width_increment_price, mitre_price)
VALUES 
    (1, 40.00, 1.50, 2.25, 0),      -- Box Tread
    (2, 58.00, 1.75, 2.25, 6.30),   -- Open Tread  
    (3, 76.00, 1.75, 2.25, 12.60),  -- Double Open
    (4, 4.00, 0.50, 0.25, 0),       -- Riser
    (5, 3.00, 0, 0, 0),              -- Stringer (flat per riser pricing)
    (6, 5.00, 0, 0, 0),              -- Center Horse (flat per riser pricing)
    (7, 25.00, 1.00, 1.00, 0),      -- Tread Nosing
    (8, 4.00, 0.50, 0.25, 0),       -- Winder Box Tread (uses riser pricing)
    (9, 4.00, 0.50, 0.25, 0),       -- Winder Open (uses riser pricing)
    (10, 4.00, 0.50, 0.25, 0)       -- Winder Double (uses riser pricing)
ON CONFLICT (board_type_id) DO UPDATE
SET base_price = EXCLUDED.base_price,
    length_increment_price = EXCLUDED.length_increment_price,
    width_increment_price = EXCLUDED.width_increment_price,
    mitre_price = EXCLUDED.mitre_price,
    updated_at = CURRENT_TIMESTAMP;

-- Populate material multipliers
INSERT INTO material_multipliers (material_id, material_name, abbreviation, multiplier, display_order)
VALUES
    (20, 'Red Oak', 'K', 1.00, 10),           -- Base material
    (14, 'White Oak', 'T', 1.10, 20),         -- 10% premium
    (4, 'Pine', 'P', 0.60, 30),               -- 40% discount
    (7, 'Poplar', 'R', 0.65, 40),             -- 35% discount
    (6, 'PGS', 'G', 0.65, 50),                -- 35% discount
    (17, 'Maple', 'A', 1.30, 60),             -- 30% premium
    (18, 'American Cherry', 'E', 1.70, 70),   -- 70% premium
    (19, 'Brazilian Cherry', 'Z', 1.90, 80),  -- 90% premium
    (21, 'HeartPine', 'I', 1.50, 90),         -- 50% premium
    (24, '1/4 Sawn Red Oak', '4', 1.40, 100), -- 40% premium
    (25, '1/4 Sawn White Oak', '5', 1.50, 110) -- 50% premium
ON CONFLICT (material_id) DO UPDATE
SET material_name = EXCLUDED.material_name,
    multiplier = EXCLUDED.multiplier,
    display_order = EXCLUDED.display_order;

-- Mark CDX as inactive (not typically used for stairs)
INSERT INTO material_multipliers (material_id, material_name, abbreviation, multiplier, is_active, display_order)
VALUES (3, 'CDX', 'X', 0.50, false, 999)
ON CONFLICT (material_id) DO UPDATE
SET is_active = false;

-- ============================================
-- STEP 4: Create New Calculation Function
-- ============================================

CREATE OR REPLACE FUNCTION calculate_stair_price_simple(
    p_board_type_id INTEGER,
    p_material_id INTEGER,
    p_length DECIMAL,
    p_width DECIMAL,
    p_quantity INTEGER DEFAULT 1,
    p_full_mitre BOOLEAN DEFAULT false
) RETURNS TABLE(
    base_price DECIMAL,
    length_charge DECIMAL,
    width_charge DECIMAL,
    material_multiplier DECIMAL,
    mitre_charge DECIMAL,
    unit_price DECIMAL,
    total_price DECIMAL
) AS $$
DECLARE
    v_pricing RECORD;
    v_material RECORD;
    v_base DECIMAL := 0;
    v_length_extra DECIMAL := 0;
    v_width_extra DECIMAL := 0;
    v_mitre DECIMAL := 0;
    v_multiplier DECIMAL := 1.0;
    v_unit DECIMAL := 0;
    v_total DECIMAL := 0;
BEGIN
    -- Get pricing rule
    SELECT * INTO v_pricing
    FROM stair_pricing_simple
    WHERE board_type_id = p_board_type_id
      AND is_active = true
    LIMIT 1;
    
    -- Get material multiplier
    SELECT * INTO v_material
    FROM material_multipliers
    WHERE material_id = p_material_id
      AND is_active = true
    LIMIT 1;
    
    IF v_pricing.id IS NOT NULL THEN
        v_base := v_pricing.base_price;
        v_multiplier := COALESCE(v_material.multiplier, 1.0);
        
        -- Calculate length increment charge
        IF p_length > v_pricing.base_length AND v_pricing.length_increment_price > 0 THEN
            v_length_extra := CEIL((p_length - v_pricing.base_length) / v_pricing.length_increment_size::DECIMAL) 
                            * v_pricing.length_increment_price;
        END IF;
        
        -- Calculate width increment charge
        IF p_width > v_pricing.base_width AND v_pricing.width_increment_price > 0 THEN
            v_width_extra := (p_width - v_pricing.base_width) * v_pricing.width_increment_price;
        END IF;
        
        -- Apply mitre charge if applicable
        IF p_full_mitre AND v_pricing.mitre_price > 0 THEN
            v_mitre := v_pricing.mitre_price;
        END IF;
        
        -- Calculate unit price with material multiplier
        v_unit := (v_base + v_length_extra + v_width_extra) * v_multiplier + v_mitre;
        v_total := v_unit * p_quantity;
    END IF;
    
    RETURN QUERY SELECT 
        v_base,
        v_length_extra,
        v_width_extra,
        v_multiplier,
        v_mitre,
        v_unit,
        v_total;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 5: Add Indexes for Performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_stair_pricing_simple_active 
    ON stair_pricing_simple(board_type_id, is_active);

CREATE INDEX IF NOT EXISTS idx_material_multipliers_active 
    ON material_multipliers(material_id, is_active);

-- ============================================
-- STEP 6: Create View for Easy Price Lookup
-- ============================================

CREATE OR REPLACE VIEW stair_price_calculator AS
SELECT 
    bt.brd_typ_id,
    bt.brdtyp_des as board_type,
    sp.base_price,
    sp.length_increment_price,
    sp.width_increment_price,
    sp.mitre_price,
    sp.base_length,
    sp.base_width,
    sp.length_increment_size
FROM stair_board_types bt
JOIN stair_pricing_simple sp ON bt.brd_typ_id = sp.board_type_id
WHERE sp.is_active = true;

-- ============================================
-- STEP 7: Add Comments for Documentation
-- ============================================

COMMENT ON TABLE stair_pricing_simple IS 'Simplified formula-based stair pricing using base price plus increments';
COMMENT ON TABLE material_multipliers IS 'Material price multipliers applied to base stair prices';
COMMENT ON FUNCTION calculate_stair_price_simple IS 'Calculate stair component price using simplified formula';
COMMENT ON VIEW stair_price_calculator IS 'Helper view for easy price calculations and lookups';