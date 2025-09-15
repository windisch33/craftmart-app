-- Migration: Remove labor_install_cost from handrail_products
-- Date: 2025-09-15
-- Description: Remove labor cost field from handrail products as it's no longer needed

-- Drop the check constraint first
ALTER TABLE handrail_products DROP CONSTRAINT IF EXISTS handrail_products_labor_install_cost_check;

-- Drop the labor_install_cost column
ALTER TABLE handrail_products DROP COLUMN IF EXISTS labor_install_cost;