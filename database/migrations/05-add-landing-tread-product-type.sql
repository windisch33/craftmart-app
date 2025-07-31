-- Migration: Add landing tread product type and support
-- Date: 2025-01-30
-- Description: Adds landing_tread as a new product type with per 6" pricing model

-- Step 1: Update the products table CHECK constraint to include 'landing_tread'
ALTER TABLE products 
DROP CONSTRAINT IF EXISTS products_product_type_check;

ALTER TABLE products 
ADD CONSTRAINT products_product_type_check 
CHECK (product_type IN ('handrail', 'newel', 'baluster', 'landing_tread', 'other'));

-- Step 2: Create landing_tread_products table (similar to handrail_products)
CREATE TABLE IF NOT EXISTS landing_tread_products (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    cost_per_6_inches DECIMAL(8,2) NOT NULL CHECK (cost_per_6_inches >= 0),
    labor_install_cost DECIMAL(8,2) NOT NULL CHECK (labor_install_cost >= 0),
    UNIQUE(product_id)
);

-- Step 3: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_landing_tread_products_product_id ON landing_tread_products(product_id);

-- Step 4: Insert sample landing tread product
INSERT INTO products (name, product_type) VALUES
('6" Landing Tread', 'landing_tread')
ON CONFLICT DO NOTHING;

-- Get the product ID for the landing tread we just inserted
DO $$
DECLARE
    landing_tread_id INTEGER;
BEGIN
    SELECT id INTO landing_tread_id FROM products WHERE name = '6" Landing Tread' AND product_type = 'landing_tread' LIMIT 1;
    
    IF landing_tread_id IS NOT NULL THEN
        -- Insert pricing for the landing tread
        INSERT INTO landing_tread_products (product_id, cost_per_6_inches, labor_install_cost) VALUES
        (landing_tread_id, 35.00, 125.00)
        ON CONFLICT (product_id) DO NOTHING;
    END IF;
END $$;

-- Step 5: Update quote_items table constraint if needed (it should already support any product_type)
-- No changes needed as quote_items.product_type is VARCHAR(50) without constraints