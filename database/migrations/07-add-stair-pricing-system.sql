-- Migration: Add Stair Pricing System
-- Date: 2025-08-06
-- Description: Comprehensive stair pricing tables and initial data

-- ============================================
-- 1. STAIR MATERIALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS stair_materials (
    id SERIAL PRIMARY KEY,
    mat_seq_n INTEGER UNIQUE NOT NULL,
    matrl_abv VARCHAR(2) NOT NULL,
    matrl_nam VARCHAR(100) NOT NULL,
    description TEXT,
    multiplier DECIMAL(5,3) DEFAULT 1.000,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_stair_materials_active ON stair_materials(is_active);
CREATE INDEX IF NOT EXISTS idx_stair_materials_seq ON stair_materials(mat_seq_n);

-- ============================================
-- 2. STAIR BOARD TYPES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS stair_board_types (
    id SERIAL PRIMARY KEY,
    brd_typ_id INTEGER UNIQUE NOT NULL,
    brdtyp_des VARCHAR(100) NOT NULL,
    purpose TEXT,
    pric_riser BOOLEAN DEFAULT false,
    pric_bxris BOOLEAN DEFAULT false,
    pric_opris BOOLEAN DEFAULT false,
    pric_doris BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_stair_board_types_active ON stair_board_types(is_active);
CREATE INDEX IF NOT EXISTS idx_stair_board_types_id ON stair_board_types(brd_typ_id);

-- ============================================
-- 3. STAIR BOARD PRICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS stair_board_prices (
    id SERIAL PRIMARY KEY,
    brd_typ_id INTEGER REFERENCES stair_board_types(brd_typ_id),
    mat_seq_n INTEGER REFERENCES stair_materials(mat_seq_n),
    -- Dimensional constraints
    brdlen_min DECIMAL(6,2) DEFAULT 0,
    brdlen_max DECIMAL(6,2) NOT NULL,
    brdwid_min DECIMAL(6,2) DEFAULT 0,
    brdwid_max DECIMAL(6,2) NOT NULL,
    brdthk_min DECIMAL(6,2) DEFAULT 0,
    brdthk_max DECIMAL(6,2) DEFAULT 2,
    -- Pricing
    unit_cost DECIMAL(10,2) NOT NULL,
    fulmit_cst DECIMAL(10,2) DEFAULT 0,
    -- Oversized increments
    len_incr DECIMAL(6,2) DEFAULT 1,
    len_cost DECIMAL(10,2) DEFAULT 0,
    wid_incr DECIMAL(6,2) DEFAULT 1,
    wid_cost DECIMAL(10,2) DEFAULT 0,
    -- Date validity
    begin_date DATE DEFAULT CURRENT_DATE,
    end_date DATE DEFAULT '2099-12-31',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_stair_board_prices_lookup 
    ON stair_board_prices(brd_typ_id, mat_seq_n, is_active);
CREATE INDEX IF NOT EXISTS idx_stair_board_prices_dimensions 
    ON stair_board_prices(brdlen_min, brdlen_max, brdwid_min, brdwid_max);
CREATE INDEX IF NOT EXISTS idx_stair_board_prices_dates 
    ON stair_board_prices(begin_date, end_date);

-- ============================================
-- 4. STAIR SPECIAL PARTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS stair_special_parts (
    id SERIAL PRIMARY KEY,
    stpart_id INTEGER NOT NULL,
    stpar_desc VARCHAR(100) NOT NULL,
    mat_seq_n INTEGER REFERENCES stair_materials(mat_seq_n),
    position VARCHAR(10), -- 'L', 'R', 'B' for left, right, both
    unit_cost DECIMAL(10,2) NOT NULL,
    labor_cost DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_stair_special_parts_active ON stair_special_parts(is_active);
CREATE INDEX IF NOT EXISTS idx_stair_special_parts_lookup ON stair_special_parts(stpart_id, mat_seq_n);

-- ============================================
-- 5. STAIR CONFIGURATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS stair_configurations (
    id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
    config_name VARCHAR(255),
    -- Basic dimensions
    floor_to_floor DECIMAL(8,2) NOT NULL,
    num_risers INTEGER NOT NULL,
    riser_height DECIMAL(6,3) GENERATED ALWAYS AS (floor_to_floor / num_risers) STORED,
    -- Tread configuration
    tread_material_id INTEGER REFERENCES stair_materials(mat_seq_n),
    riser_material_id INTEGER REFERENCES stair_materials(mat_seq_n),
    tread_size VARCHAR(100),
    nose_size DECIMAL(6,3),
    -- Stringer configuration
    stringer_type VARCHAR(100),
    stringer_material_id INTEGER REFERENCES stair_materials(mat_seq_n),
    num_stringers INTEGER DEFAULT 2,
    center_horses INTEGER DEFAULT 0,
    -- Options
    full_mitre BOOLEAN DEFAULT false,
    bracket_type VARCHAR(100),
    -- Pricing
    subtotal DECIMAL(10,2),
    labor_total DECIMAL(10,2),
    tax_amount DECIMAL(10,2),
    total_amount DECIMAL(10,2),
    -- Metadata
    special_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_stair_configurations_job ON stair_configurations(job_id);

-- ============================================
-- 6. STAIR CONFIGURATION ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS stair_config_items (
    id SERIAL PRIMARY KEY,
    config_id INTEGER REFERENCES stair_configurations(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL, -- 'tread', 'riser', 'stringer', 'special_part'
    riser_number INTEGER, -- For tread-specific configurations
    -- Tread specifics
    tread_type VARCHAR(50), -- 'box', 'open_left', 'open_right', 'double_open'
    width DECIMAL(6,2),
    length DECIMAL(6,2),
    -- Component details
    board_type_id INTEGER REFERENCES stair_board_types(brd_typ_id),
    material_id INTEGER REFERENCES stair_materials(mat_seq_n),
    special_part_id INTEGER,
    -- Pricing
    quantity DECIMAL(10,2) DEFAULT 1,
    unit_price DECIMAL(10,2),
    labor_price DECIMAL(10,2),
    total_price DECIMAL(10,2),
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_stair_config_items_config ON stair_config_items(config_id);
CREATE INDEX IF NOT EXISTS idx_stair_config_items_type ON stair_config_items(item_type);

-- ============================================
-- 7. ADD STAIR TO PRODUCT TYPES
-- ============================================
ALTER TABLE products 
DROP CONSTRAINT IF EXISTS products_product_type_check;

ALTER TABLE products 
ADD CONSTRAINT products_product_type_check 
CHECK (product_type IN ('handrail', 'newel', 'baluster', 'landing_tread', 'rail_parts', 'stair', 'other'));

-- ============================================
-- 8. INSERT INITIAL STAIR MATERIALS DATA
-- ============================================
INSERT INTO stair_materials (mat_seq_n, matrl_abv, matrl_nam, description, multiplier) VALUES
(2, 'S', 'Select Oak', 'Premium oak material', 1.000),
(3, 'X', 'CDX', 'Plywood material', 0.600),
(4, 'P', 'Pine', 'Standard pine', 0.500),
(5, 'O', 'Oak', 'Standard oak', 1.000),
(6, 'G', 'PGS', 'Specialty material', 0.800),
(7, 'R', 'Poplar', 'Poplar wood', 0.400),
(14, 'T', 'White Oak', 'Premium white oak', 1.300),
(17, 'A', 'Maple', 'Maple wood', 1.200),
(18, 'E', 'American Cherry', 'American cherry', 1.700),
(19, 'Z', 'Brazilian Cherry', 'Brazilian cherry', 2.000),
(20, 'K', 'Red Oak', 'Red oak', 1.000),
(21, 'I', 'HeartPine', 'Heart pine', 1.500),
(23, '2', '2nd Grade Oak', 'Second grade oak', 0.800),
(24, '4', '1/4 Sawn Red Oak', 'Quarter sawn red oak', 1.400),
(25, '5', '1/4 Sawn White Oak', 'Quarter sawn white oak', 1.500)
ON CONFLICT (mat_seq_n) DO NOTHING;

-- ============================================
-- 9. INSERT INITIAL BOARD TYPES DATA
-- ============================================
INSERT INTO stair_board_types (brd_typ_id, brdtyp_des, purpose, pric_bxris, pric_opris, pric_doris, pric_riser) VALUES
(1, 'Box Tread', 'Box-style stair treads', true, false, false, false),
(2, 'Open Tread', 'Open-end stair treads', false, true, false, false),
(3, 'Double Open', 'Double open-end treads', false, false, true, false),
(4, 'Riser', 'Stair risers', false, false, false, true),
(5, 'Stringer', 'Side support boards', false, false, false, true),
(6, 'Center Horse', 'Center support', false, false, false, true),
(7, 'Tread Nosing', 'Front edge of tread', false, false, false, false),
(8, 'Winder Box Tread', 'Winder box treads', false, false, false, true),
(9, 'Winder Open', 'Winder open treads', false, false, false, true),
(10, 'Winder Double', 'Winder double open', false, false, false, true)
ON CONFLICT (brd_typ_id) DO NOTHING;

-- ============================================
-- 10. INSERT SAMPLE BOARD PRICING DATA (OAK)
-- ============================================
-- Box Treads (Oak, Material ID 5)
INSERT INTO stair_board_prices (brd_typ_id, mat_seq_n, brdlen_min, brdlen_max, brdwid_min, brdwid_max, unit_cost, fulmit_cst, len_incr, len_cost, wid_incr, wid_cost) VALUES
(1, 5, 0, 36, 0, 9, 34.42, 0, 6, 5.00, 1, 2.00),
(1, 5, 0, 36, 9.01, 11, 36.70, 0, 6, 5.00, 1, 2.00),
(1, 5, 36.01, 42, 0, 9, 39.95, 0, 6, 5.00, 1, 2.00),
(1, 5, 36.01, 42, 9.01, 11, 42.22, 0, 6, 5.00, 1, 2.00),
(1, 5, 42.01, 48, 0, 9, 43.08, 0, 6, 5.00, 1, 2.00),
(1, 5, 42.01, 48, 9.01, 11, 45.35, 0, 6, 5.00, 1, 2.00),
(1, 5, 48.01, 54, 0, 9, 46.21, 0, 6, 5.00, 1, 2.00),
(1, 5, 48.01, 54, 9.01, 11, 48.48, 0, 6, 5.00, 1, 2.00);

-- Open Treads (Oak, Material ID 5)
INSERT INTO stair_board_prices (brd_typ_id, mat_seq_n, brdlen_min, brdlen_max, brdwid_min, brdwid_max, unit_cost, fulmit_cst, len_incr, len_cost, wid_incr, wid_cost) VALUES
(2, 5, 0, 42.75, 0, 9, 53.72, 6.30, 6, 5.50, 1, 2.20),
(2, 5, 0, 42.75, 9.01, 11, 55.99, 6.30, 6, 5.50, 1, 2.20),
(2, 5, 42.76, 48, 0, 9, 59.22, 6.30, 6, 5.50, 1, 2.20),
(2, 5, 42.76, 48, 9.01, 11, 61.49, 6.30, 6, 5.50, 1, 2.20),
(2, 5, 48.01, 54, 0, 9, 64.73, 6.30, 6, 5.50, 1, 2.20),
(2, 5, 48.01, 54, 9.01, 11, 67.00, 6.30, 6, 5.50, 1, 2.20);

-- Double Open Treads (Oak, Material ID 5)
INSERT INTO stair_board_prices (brd_typ_id, mat_seq_n, brdlen_min, brdlen_max, brdwid_min, brdwid_max, unit_cost, fulmit_cst, len_incr, len_cost, wid_incr, wid_cost) VALUES
(3, 5, 0, 49.5, 0, 9, 71.61, 12.60, 6, 6.00, 1, 2.50),
(3, 5, 0, 49.5, 9.01, 11, 73.88, 12.60, 6, 6.00, 1, 2.50),
(3, 5, 49.51, 56.25, 0, 9, 77.12, 12.60, 6, 6.00, 1, 2.50),
(3, 5, 49.51, 56.25, 9.01, 11, 79.39, 12.60, 6, 6.00, 1, 2.50),
(3, 5, 56.26, 63, 0, 9, 82.63, 12.60, 6, 6.00, 1, 2.50),
(3, 5, 56.26, 63, 9.01, 11, 84.90, 12.60, 6, 6.00, 1, 2.50);

-- Risers (Oak, Material ID 5)
INSERT INTO stair_board_prices (brd_typ_id, mat_seq_n, brdlen_min, brdlen_max, brdwid_min, brdwid_max, unit_cost, fulmit_cst) VALUES
(4, 5, 0, 48, 0, 8, 12.00, 0),
(4, 5, 0, 48, 8.01, 10, 15.00, 0),
(4, 5, 48.01, 60, 0, 8, 18.00, 0),
(4, 5, 48.01, 60, 8.01, 10, 22.00, 0);

-- Stringers (Oak, Material ID 5, priced per riser)
INSERT INTO stair_board_prices (brd_typ_id, mat_seq_n, brdlen_min, brdlen_max, brdwid_min, brdwid_max, unit_cost, fulmit_cst) VALUES
(5, 5, 0, 999, 9, 10, 12.00, 0), -- 1" Oak stringer
(5, 5, 0, 999, 10.01, 12, 15.00, 0); -- 2" Oak stringer

-- Stringers (Poplar, Material ID 7)
INSERT INTO stair_board_prices (brd_typ_id, mat_seq_n, brdlen_min, brdlen_max, brdwid_min, brdwid_max, unit_cost, fulmit_cst) VALUES
(5, 7, 0, 999, 9, 12, 3.00, 0); -- Poplar stringer

-- Stringers (Pine, Material ID 4)
INSERT INTO stair_board_prices (brd_typ_id, mat_seq_n, brdlen_min, brdlen_max, brdwid_min, brdwid_max, unit_cost, fulmit_cst) VALUES
(5, 4, 0, 999, 9, 12, 2.00, 0); -- Pine stringer

-- Center Horse (All materials, $5 per riser)
INSERT INTO stair_board_prices (brd_typ_id, mat_seq_n, brdlen_min, brdlen_max, brdwid_min, brdwid_max, unit_cost, fulmit_cst) VALUES
(6, 5, 0, 999, 0, 999, 5.00, 0),
(6, 7, 0, 999, 0, 999, 5.00, 0),
(6, 4, 0, 999, 0, 999, 5.00, 0);

-- ============================================
-- 11. INSERT SPECIAL PARTS DATA
-- ============================================
INSERT INTO stair_special_parts (stpart_id, stpar_desc, mat_seq_n, unit_cost, labor_cost) VALUES
(1, 'Bull Nose', 5, 102.20, 25.00), -- Oak
(1, 'Bull Nose', 3, 47.69, 25.00),  -- CDX
(2, 'Quarter Round', 5, 90.85, 20.00), -- Oak
(2, 'Quarter Round', 3, 42.02, 20.00), -- CDX
(3, 'Tread Protector', 5, 8.65, 5.00), -- Oak
(4, 'Ramshorn Bracket', 5, 3.09, 2.00), -- Oak
(5, 'Winder Box Tread', 5, 128.75, 35.00), -- Oak
(5, 'Winder Box Tread', 3, 92.70, 35.00), -- CDX
(6, 'Winder Open Tread', 5, 180.25, 45.00), -- Oak
(6, 'Winder Open Tread', 3, 108.15, 45.00); -- CDX

-- ============================================
-- 12. CREATE HELPER FUNCTION FOR STAIR PRICING
-- ============================================
CREATE OR REPLACE FUNCTION calculate_stair_price(
    p_board_type_id INTEGER,
    p_material_id INTEGER,
    p_length DECIMAL,
    p_width DECIMAL,
    p_quantity INTEGER DEFAULT 1,
    p_full_mitre BOOLEAN DEFAULT false
) RETURNS TABLE(
    base_price DECIMAL,
    oversized_charge DECIMAL,
    mitre_charge DECIMAL,
    total_price DECIMAL
) AS $$
DECLARE
    v_pricing RECORD;
    v_base_price DECIMAL := 0;
    v_oversized DECIMAL := 0;
    v_mitre DECIMAL := 0;
    v_total DECIMAL := 0;
BEGIN
    -- Find matching price rule
    SELECT * INTO v_pricing
    FROM stair_board_prices
    WHERE brd_typ_id = p_board_type_id
      AND mat_seq_n = p_material_id
      AND p_length BETWEEN brdlen_min AND brdlen_max
      AND p_width BETWEEN brdwid_min AND brdwid_max
      AND is_active = true
      AND CURRENT_DATE BETWEEN begin_date AND end_date
    LIMIT 1;
    
    IF FOUND THEN
        v_base_price := v_pricing.unit_cost * p_quantity;
        
        -- Check for oversized charges
        IF p_length > v_pricing.brdlen_max AND v_pricing.len_incr > 0 THEN
            v_oversized := v_oversized + 
                (CEIL((p_length - v_pricing.brdlen_max) / v_pricing.len_incr) * v_pricing.len_cost * p_quantity);
        END IF;
        
        IF p_width > v_pricing.brdwid_max AND v_pricing.wid_incr > 0 THEN
            v_oversized := v_oversized + 
                (CEIL((p_width - v_pricing.brdwid_max) / v_pricing.wid_incr) * v_pricing.wid_cost * p_quantity);
        END IF;
        
        -- Apply full mitre charge if applicable
        IF p_full_mitre AND v_pricing.fulmit_cst > 0 THEN
            v_mitre := v_pricing.fulmit_cst * p_quantity;
        END IF;
        
        v_total := v_base_price + v_oversized + v_mitre;
    END IF;
    
    RETURN QUERY SELECT v_base_price, v_oversized, v_mitre, v_total;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 13. ADD COMMENT DOCUMENTATION
-- ============================================
COMMENT ON TABLE stair_materials IS 'Materials available for stair construction with pricing multipliers';
COMMENT ON TABLE stair_board_types IS 'Types of boards used in stair construction with pricing flags';
COMMENT ON TABLE stair_board_prices IS 'Pricing rules for stair boards based on dimensions and materials';
COMMENT ON TABLE stair_special_parts IS 'Special stair components like bull nose, brackets, etc.';
COMMENT ON TABLE stair_configurations IS 'Complete stair configurations linked to jobs';
COMMENT ON TABLE stair_config_items IS 'Individual items within a stair configuration';
COMMENT ON FUNCTION calculate_stair_price IS 'Helper function to calculate stair component pricing';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================