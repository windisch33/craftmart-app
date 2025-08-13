-- Update Oak references to Red Oak
UPDATE stair_board_prices 
SET mat_seq_n = 20
WHERE mat_seq_n = 5;

UPDATE stair_special_parts
SET mat_seq_n = 20
WHERE mat_seq_n = 5;

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

-- Mark old Oak materials as inactive
UPDATE stair_materials
SET is_active = false,
    description = CASE 
        WHEN description IS NULL THEN 'DEPRECATED - Use Red Oak'
        ELSE description || ' (DEPRECATED - Use Red Oak)'
    END
WHERE mat_seq_n IN (5, 2, 23); -- Oak, Select Oak, 2nd Grade Oak