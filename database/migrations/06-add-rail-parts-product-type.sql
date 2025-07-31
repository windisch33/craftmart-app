-- Migration: Add rail parts product type and support
-- Date: 2025-01-30
-- Description: Adds rail_parts as a new product type with base price and material multiplier

-- Step 1: Update the products table CHECK constraint to include 'rail_parts'
ALTER TABLE products 
DROP CONSTRAINT IF EXISTS products_product_type_check;

ALTER TABLE products 
ADD CONSTRAINT products_product_type_check 
CHECK (product_type IN ('handrail', 'newel', 'baluster', 'landing_tread', 'rail_parts', 'other'));

-- Step 2: Create rail_parts_products table (base price with material multiplier)
CREATE TABLE IF NOT EXISTS rail_parts_products (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    base_price DECIMAL(8,2) NOT NULL CHECK (base_price >= 0),
    labor_install_cost DECIMAL(8,2) NOT NULL CHECK (labor_install_cost >= 0),
    UNIQUE(product_id)
);

-- Step 3: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_rail_parts_products_product_id ON rail_parts_products(product_id);

-- Step 4: Insert sample rail parts products
INSERT INTO products (name, product_type) VALUES
('End Cap - Standard', 'rail_parts'),
('Mounting Bracket - Heavy Duty', 'rail_parts'),
('Joint Connector', 'rail_parts')
ON CONFLICT DO NOTHING;

-- Get the product IDs for the rail parts we just inserted
DO $$
DECLARE
    end_cap_id INTEGER;
    bracket_id INTEGER;
    connector_id INTEGER;
BEGIN
    SELECT id INTO end_cap_id FROM products WHERE name = 'End Cap - Standard' AND product_type = 'rail_parts' LIMIT 1;
    SELECT id INTO bracket_id FROM products WHERE name = 'Mounting Bracket - Heavy Duty' AND product_type = 'rail_parts' LIMIT 1;
    SELECT id INTO connector_id FROM products WHERE name = 'Joint Connector' AND product_type = 'rail_parts' LIMIT 1;
    
    -- Insert pricing for the rail parts
    IF end_cap_id IS NOT NULL THEN
        INSERT INTO rail_parts_products (product_id, base_price, labor_install_cost) VALUES
        (end_cap_id, 15.00, 25.00)
        ON CONFLICT (product_id) DO NOTHING;
    END IF;
    
    IF bracket_id IS NOT NULL THEN
        INSERT INTO rail_parts_products (product_id, base_price, labor_install_cost) VALUES
        (bracket_id, 12.50, 30.00)
        ON CONFLICT (product_id) DO NOTHING;
    END IF;
    
    IF connector_id IS NOT NULL THEN
        INSERT INTO rail_parts_products (product_id, base_price, labor_install_cost) VALUES
        (connector_id, 8.00, 15.00)
        ON CONFLICT (product_id) DO NOTHING;
    END IF;
END $$;