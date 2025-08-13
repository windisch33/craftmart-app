-- Create simplified pricing structure
CREATE TABLE IF NOT EXISTS stair_pricing_simple (
    id SERIAL PRIMARY KEY,
    board_type_id INTEGER NOT NULL REFERENCES stair_board_types(brd_typ_id),
    base_price DECIMAL(10, 2) NOT NULL,
    length_increment_price DECIMAL(10, 2) DEFAULT 1.50,
    width_increment_price DECIMAL(10, 2) DEFAULT 2.25,
    mitre_price DECIMAL(10, 2) DEFAULT 0,
    base_length INTEGER DEFAULT 36,
    base_width INTEGER DEFAULT 9,
    length_increment_size INTEGER DEFAULT 6,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(board_type_id)
);

-- Create material multipliers table
CREATE TABLE IF NOT EXISTS material_multipliers (
    material_id INTEGER PRIMARY KEY,
    material_name VARCHAR(50) NOT NULL,
    abbreviation VARCHAR(5),
    multiplier DECIMAL(5, 2) NOT NULL DEFAULT 1.0,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);