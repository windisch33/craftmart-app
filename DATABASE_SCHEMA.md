# CraftMart Database Schema Documentation
Last Updated: August 12, 2025

## Overview
PostgreSQL database with simplified stair pricing system and comprehensive job management.

## Core Business Tables

### users
User authentication and access control.
```sql
- id: SERIAL PRIMARY KEY
- username: VARCHAR(50) UNIQUE NOT NULL
- password: VARCHAR(255) NOT NULL (bcrypt hashed)
- email: VARCHAR(100) UNIQUE
- first_name: VARCHAR(50)
- last_name: VARCHAR(50)
- role: VARCHAR(20) DEFAULT 'user'
- is_active: BOOLEAN DEFAULT true
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- updated_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### customers
Customer contact and shipping information.
```sql
- id: SERIAL PRIMARY KEY
- customer_name: VARCHAR(100) NOT NULL
- contact_name: VARCHAR(100)
- phone: VARCHAR(20)
- email: VARCHAR(100)
- billing_address: TEXT
- shipping_address: TEXT
- notes: TEXT
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- updated_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### salesmen
Sales representatives with commission tracking.
```sql
- id: SERIAL PRIMARY KEY
- first_name: VARCHAR(50) NOT NULL
- last_name: VARCHAR(50) NOT NULL
- email: VARCHAR(100) UNIQUE
- phone: VARCHAR(20)
- commission_rate: DECIMAL(5,2) DEFAULT 0.00
- is_active: BOOLEAN DEFAULT true
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- updated_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### jobs
Main job tracking (quotes, orders, invoices).
```sql
- id: SERIAL PRIMARY KEY
- job_name: VARCHAR(200) NOT NULL
- customer_id: INTEGER REFERENCES customers(id)
- salesman_id: INTEGER REFERENCES salesmen(id)
- status: VARCHAR(20) DEFAULT 'quote'
  -- Values: 'quote', 'order', 'invoice', 'completed', 'cancelled'
- subtotal: DECIMAL(10,2) DEFAULT 0
- tax_amount: DECIMAL(10,2) DEFAULT 0
- total_amount: DECIMAL(10,2) DEFAULT 0
- po_number: VARCHAR(50)
- delivery_date: DATE
- notes: TEXT
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- updated_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### job_sections
Organize job items into logical sections.
```sql
- id: SERIAL PRIMARY KEY
- job_id: INTEGER REFERENCES jobs(id) ON DELETE CASCADE
- section_name: VARCHAR(100) NOT NULL
- display_order: INTEGER DEFAULT 0
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### quote_items
Line items within job sections.
```sql
- id: SERIAL PRIMARY KEY
- job_id: INTEGER REFERENCES jobs(id) ON DELETE CASCADE
- section_id: INTEGER REFERENCES job_sections(id) ON DELETE CASCADE
- part_number: VARCHAR(50)
- description: TEXT NOT NULL
- quantity: INTEGER DEFAULT 1
- unit_price: DECIMAL(10,2) DEFAULT 0
- total_price: DECIMAL(10,2) DEFAULT 0
- notes: TEXT
- display_order: INTEGER DEFAULT 0
- stair_config_id: INTEGER REFERENCES stair_configurations(id)
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- updated_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

## Product Catalog Tables

### products
Base product definitions.
```sql
- id: SERIAL PRIMARY KEY
- name: VARCHAR(100) NOT NULL
- description: TEXT
- category: VARCHAR(50)
- base_price: DECIMAL(10,2)
- is_active: BOOLEAN DEFAULT true
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- updated_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### handrail_products
Handrail pricing per 6" increment.
```sql
- id: SERIAL PRIMARY KEY
- product_id: INTEGER REFERENCES products(id)
- wood_type: VARCHAR(50)
- price_per_6_inch: DECIMAL(10,2) NOT NULL
- min_length: INTEGER DEFAULT 6
- max_length: INTEGER DEFAULT 240
```

### landing_tread_products
Landing tread pricing per 6" increment.
```sql
- id: SERIAL PRIMARY KEY
- product_id: INTEGER REFERENCES products(id)
- wood_type: VARCHAR(50)
- price_per_6_inch: DECIMAL(10,2) NOT NULL
- min_length: INTEGER DEFAULT 6
- max_length: INTEGER DEFAULT 144
```

### rail_parts_products
Rail components with fixed pricing.
```sql
- id: SERIAL PRIMARY KEY
- product_id: INTEGER REFERENCES products(id)
- part_type: VARCHAR(50)
- wood_type: VARCHAR(50)
- unit_price: DECIMAL(10,2) NOT NULL
```

### materials
General material types for products.
```sql
- id: SERIAL PRIMARY KEY
- name: VARCHAR(100) NOT NULL
- description: TEXT
- multiplier: DECIMAL(5,3) DEFAULT 1.000
- is_active: BOOLEAN DEFAULT true
```

## Simplified Stair Pricing System

### material_multipliers
Material pricing multipliers for stair components.
*Replaced the legacy stair_materials table*
```sql
- material_id: INTEGER PRIMARY KEY
- material_name: VARCHAR(100) NOT NULL
- multiplier: DECIMAL(5,3) DEFAULT 1.000
- display_order: INTEGER
- is_active: BOOLEAN DEFAULT true
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- updated_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```
Common multipliers:
- Pine: 0.50
- Poplar: 0.40
- Oak/Red Oak: 1.00
- PGS: 0.85
- Maple: 1.20
- Cherry: 1.70

### stair_board_types
Definitions for different board types.
```sql
- id: SERIAL PRIMARY KEY
- brd_typ_id: INTEGER UNIQUE NOT NULL
- brdtyp_des: VARCHAR(100) NOT NULL
- purpose: TEXT
- is_active: BOOLEAN DEFAULT true
```
Standard types:
- 1: Box Tread
- 2: Open Tread
- 3: Double Open Tread
- 4: Riser
- 5: Stringer
- 6: Center Horse

### stair_pricing_simple
Simplified pricing with base + increment formula.
*Replaced the complex stair_board_prices table*
```sql
- id: SERIAL PRIMARY KEY
- board_type_id: INTEGER REFERENCES stair_board_types(brd_typ_id)
- base_price: DECIMAL(10,2) NOT NULL
- length_increment_price: DECIMAL(10,2) DEFAULT 1.50
- width_increment_price: DECIMAL(10,2) DEFAULT 2.25
- mitre_price: DECIMAL(10,2) DEFAULT 0
- base_length: INTEGER DEFAULT 36
- base_width: INTEGER DEFAULT 9
- length_increment_size: INTEGER DEFAULT 6
- is_active: BOOLEAN DEFAULT true
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- updated_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### stair_special_parts
Add-on components for stairs.
```sql
- id: SERIAL PRIMARY KEY
- stpart_id: INTEGER NOT NULL
- mat_seq_n: INTEGER REFERENCES material_multipliers(material_id)
- stpar_desc: VARCHAR(100)
- matrl_nam: VARCHAR(100)
- position: VARCHAR(50)
- unit_cost: DECIMAL(10,2) DEFAULT 0
- labor_cost: DECIMAL(10,2) DEFAULT 0
- is_active: BOOLEAN DEFAULT true
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- updated_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### stair_configurations
Saved stair configurations tied to job items.
```sql
- id: SERIAL PRIMARY KEY
- job_item_id: INTEGER REFERENCES job_items(id)
- config_name: VARCHAR(100)
- floor_to_floor: DECIMAL(6,2)
- num_risers: INTEGER
- tread_material_id: INTEGER REFERENCES material_multipliers(material_id)
- riser_material_id: INTEGER REFERENCES material_multipliers(material_id)
- tread_size: VARCHAR(20)
- rough_cut_width: DECIMAL(5,2)
- nose_size: DECIMAL(5,3)
- stringer_type: VARCHAR(50)
- stringer_material_id: INTEGER REFERENCES material_multipliers(material_id)
- num_stringers: INTEGER DEFAULT 2
- center_horses: INTEGER DEFAULT 0
- full_mitre: BOOLEAN DEFAULT false
- bracket_type: VARCHAR(50)
- special_notes: TEXT
- subtotal: DECIMAL(10,2)
- labor_total: DECIMAL(10,2)
- tax_amount: DECIMAL(10,2)
- total_amount: DECIMAL(10,2)
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- updated_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### stair_config_items
Line items within stair configurations.
```sql
- id: SERIAL PRIMARY KEY
- config_id: INTEGER REFERENCES stair_configurations(id) ON DELETE CASCADE
- item_type: VARCHAR(20) -- 'tread', 'riser', 'stringer', 'special_part'
- riser_number: INTEGER
- tread_type: VARCHAR(20)
- width: DECIMAL(6,2)
- length: DECIMAL(6,2)
- board_type_id: INTEGER
- material_id: INTEGER REFERENCES material_multipliers(material_id)
- special_part_id: INTEGER
- quantity: INTEGER DEFAULT 1
- unit_price: DECIMAL(10,2)
- labor_price: DECIMAL(10,2)
- total_price: DECIMAL(10,2)
- notes: TEXT
```

## Support Tables

### shops
Manufacturing locations and cut sheets.
```sql
- id: SERIAL PRIMARY KEY
- shop_name: VARCHAR(100) NOT NULL
- address: TEXT
- phone: VARCHAR(20)
- contact_person: VARCHAR(100)
- notes: TEXT
- is_active: BOOLEAN DEFAULT true
```

### tax_rates
State tax rates for calculations.
```sql
- id: SERIAL PRIMARY KEY
- state_code: VARCHAR(2) UNIQUE NOT NULL
- state_name: VARCHAR(50) NOT NULL
- tax_rate: DECIMAL(5,4) NOT NULL
- is_active: BOOLEAN DEFAULT true
```

## Database Functions

### calculate_stair_price_simple()
Current pricing function using simplified formula.
*Replaced the complex calculate_stair_price() function*
```sql
CREATE FUNCTION calculate_stair_price_simple(
    p_board_type_id INTEGER,
    p_material_id INTEGER,
    p_length NUMERIC,
    p_width NUMERIC,
    p_quantity INTEGER DEFAULT 1,
    p_full_mitre BOOLEAN DEFAULT false
)
RETURNS TABLE(
    base_price NUMERIC,
    length_charge NUMERIC,
    width_charge NUMERIC,
    material_multiplier NUMERIC,
    mitre_charge NUMERIC,
    unit_price NUMERIC,
    total_price NUMERIC
)
```
Formula: `(base_price + length_charge + width_charge) × material_multiplier + mitre_charge`

## Removed Legacy Tables (August 2025)

The following tables were removed during the simplification:

### ❌ stair_board_prices (REMOVED)
- Complex matrix-based pricing with min/max ranges
- Replaced by `stair_pricing_simple`

### ❌ stair_materials (REMOVED)
- Old material definitions with abbreviations
- Replaced by `material_multipliers`

### ❌ calculate_stair_price() (REMOVED)
- Complex pricing calculation function
- Replaced by `calculate_stair_price_simple()`

## Key Indexes

```sql
-- Performance indexes
CREATE INDEX idx_jobs_customer_id ON jobs(customer_id);
CREATE INDEX idx_jobs_salesman_id ON jobs(salesman_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_created_at ON jobs(created_at);
CREATE INDEX idx_quote_items_job_id ON quote_items(job_id);
CREATE INDEX idx_quote_items_section_id ON quote_items(section_id);
CREATE INDEX idx_stair_configurations_job_item_id ON stair_configurations(job_item_id);
CREATE INDEX idx_stair_config_items_config_id ON stair_config_items(config_id);
CREATE INDEX idx_material_multipliers_active ON material_multipliers(is_active);
CREATE INDEX idx_stair_pricing_board_type ON stair_pricing_simple(board_type_id);
```

## Migration History

### August 12, 2025 - Simplified Pricing System
- Migrated from `stair_materials` to `material_multipliers`
- Replaced `stair_board_prices` with `stair_pricing_simple`
- Removed complex pricing function in favor of simple formula
- Updated all foreign key constraints
- Cleaned up legacy tables and functions

## Notes

- All monetary values stored as DECIMAL for precision
- Timestamps automatically updated via triggers
- Soft deletes implemented via `is_active` flags
- Foreign keys ensure referential integrity
- Stringer dimensions parsed from type string (e.g., "2x11.25")
- Center horses automatically use double thickness
- Landing treads fixed at 3.5" width
