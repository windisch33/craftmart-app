-- CraftMart Database Initialization Script

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    phone VARCHAR(20),
    mobile VARCHAR(20),
    fax VARCHAR(20),
    email VARCHAR(255),
    accounting_email VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_visited_at TIMESTAMP
);

-- Create salesmen table
CREATE TABLE IF NOT EXISTS salesmen (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    commission_rate DECIMAL(5,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create jobs table with enhanced fields
CREATE TABLE IF NOT EXISTS jobs (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    salesman_id INTEGER REFERENCES salesmen(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'quote' CHECK (status IN ('quote', 'order', 'invoice')),
    delivery_date DATE,
    job_location TEXT,
    order_designation VARCHAR(100),
    model_name VARCHAR(100),
    installer VARCHAR(100),
    terms TEXT,
    show_line_pricing BOOLEAN DEFAULT true,
    quote_amount DECIMAL(10,2),
    order_amount DECIMAL(10,2),
    invoice_amount DECIMAL(10,2),
    subtotal DECIMAL(10,2) DEFAULT 0,
    labor_total DECIMAL(10,2) DEFAULT 0,
    tax_rate DECIMAL(5,4) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create shops table
CREATE TABLE IF NOT EXISTS shops (
    id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
    cut_sheets JSONB,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tax_rates table
CREATE TABLE IF NOT EXISTS tax_rates (
    id SERIAL PRIMARY KEY,
    state_code VARCHAR(2) NOT NULL,
    state_name VARCHAR(100) NOT NULL,
    rate DECIMAL(5,4) NOT NULL,
    effective_date DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create job_sections table
CREATE TABLE IF NOT EXISTS job_sections (
    id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create quote_items table
CREATE TABLE IF NOT EXISTS quote_items (
    id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
    section_id INTEGER REFERENCES job_sections(id) ON DELETE CASCADE,
    part_number VARCHAR(100),
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    line_total DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    is_taxable BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_jobs_customer_id ON jobs(customer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_salesman_id ON jobs(salesman_id);
CREATE INDEX IF NOT EXISTS idx_shops_job_id ON shops(job_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_last_visited ON customers(last_visited_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_sections_job_id ON job_sections(job_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_job_id ON quote_items(job_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_section_id ON quote_items(section_id);
CREATE INDEX IF NOT EXISTS idx_tax_rates_state_code ON tax_rates(state_code);

-- Insert sample data for development
INSERT INTO customers (name, address, city, state, zip_code, phone, email, notes) VALUES
('John Smith', '123 Main St', 'Springfield', 'IL', '62701', '(555) 123-4567', 'john@example.com', 'Preferred customer'),
('ABC Construction', '456 Oak Ave', 'Chicago', 'IL', '60601', '(555) 987-6543', 'contact@abc-construction.com', 'Commercial contractor')
ON CONFLICT DO NOTHING;

-- Insert sample users (password: 'password123' for all)
INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES
('admin@craftmart.com', '$2b$10$rQs7K7XqJZKJGfJ1YzZs9.kLJ9V8FQX9XqGZYJmGkMhM4J5JqQ6ta', 'Admin', 'User', 'admin'),
('john.doe@craftmart.com', '$2b$10$rQs7K7XqJZKJGfJ1YzZs9.kLJ9V8FQX9XqGZYJmGkMhM4J5JqQ6ta', 'John', 'Doe', 'employee'),
('jane.smith@craftmart.com', '$2b$10$rQs7K7XqJZKJGfJ1YzZs9.kLJ9V8FQX9XqGZYJmGkMhM4J5JqQ6ta', 'Jane', 'Smith', 'employee')
ON CONFLICT DO NOTHING;

-- Insert sample salesmen data
INSERT INTO salesmen (first_name, last_name, email, phone, commission_rate, notes) VALUES
('Robert', 'Johnson', 'robert.johnson@craftmart.com', '(555) 111-2222', 5.50, 'Senior salesman, handles commercial accounts'),
('Sarah', 'Williams', 'sarah.williams@craftmart.com', '(555) 333-4444', 4.25, 'Specializes in residential projects'),
('Michael', 'Davis', 'michael.davis@craftmart.com', '(555) 555-6666', 6.00, 'Top performer, focus on high-end custom work')
ON CONFLICT (email) DO NOTHING;

-- Insert tax rates for US states
INSERT INTO tax_rates (state_code, state_name, rate) VALUES
('MD', 'Maryland', 0.0600),
('VA', 'Virginia', 0.0575),
('PA', 'Pennsylvania', 0.0600),
('DC', 'District of Columbia', 0.0600),
('DE', 'Delaware', 0.0000),
('WV', 'West Virginia', 0.0600),
('NJ', 'New Jersey', 0.0663),
('NY', 'New York', 0.0800),
('NC', 'North Carolina', 0.0475),
('OH', 'Ohio', 0.0575)
ON CONFLICT DO NOTHING;

-- Insert sample jobs with enhanced fields
INSERT INTO jobs (customer_id, salesman_id, title, description, status, subtotal, labor_total, tax_rate, tax_amount, total_amount) VALUES
(1, 1, 'Custom Oak Staircase', 'Traditional oak staircase with carved railings', 'quote', 5000.00, 500.00, 0.06, 300.00, 5800.00),
(2, 2, 'Modern Steel Staircase', 'Industrial steel staircase for office building', 'order', 7500.00, 700.00, 0.06, 450.00, 8650.00)
ON CONFLICT DO NOTHING;

-- Create materials table for pricing multipliers
CREATE TABLE IF NOT EXISTS materials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    multiplier DECIMAL(5,3) NOT NULL CHECK (multiplier > 0),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create products table (base for all product types)
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    product_type VARCHAR(50) NOT NULL CHECK (product_type IN ('handrail', 'newel', 'baluster', 'landing_tread', 'rail_parts', 'other')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create handrail products table with specific handrail properties
CREATE TABLE IF NOT EXISTS handrail_products (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    cost_per_6_inches DECIMAL(8,2) NOT NULL CHECK (cost_per_6_inches >= 0),
    labor_install_cost DECIMAL(8,2) NOT NULL CHECK (labor_install_cost >= 0),
    UNIQUE(product_id)
);

-- Create landing_tread_products table with specific landing tread properties
CREATE TABLE IF NOT EXISTS landing_tread_products (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    cost_per_6_inches DECIMAL(8,2) NOT NULL CHECK (cost_per_6_inches >= 0),
    labor_install_cost DECIMAL(8,2) NOT NULL CHECK (labor_install_cost >= 0),
    UNIQUE(product_id)
);

-- Create rail_parts_products table with base price and material multiplier
CREATE TABLE IF NOT EXISTS rail_parts_products (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    base_price DECIMAL(8,2) NOT NULL CHECK (base_price >= 0),
    labor_install_cost DECIMAL(8,2) NOT NULL CHECK (labor_install_cost >= 0),
    UNIQUE(product_id)
);

-- Create quote items table for tracking items added to jobs/quotes
CREATE TABLE IF NOT EXISTS quote_items (
    id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    product_type VARCHAR(50) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    length_inches INTEGER CHECK (length_inches > 0),
    material_id INTEGER REFERENCES materials(id),
    material_name VARCHAR(255),
    material_multiplier DECIMAL(5,3),
    include_labor BOOLEAN DEFAULT false,
    unit_cost DECIMAL(8,2),
    labor_cost DECIMAL(8,2),
    total_cost DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance on new tables
CREATE INDEX IF NOT EXISTS idx_materials_active ON materials(is_active);
CREATE INDEX IF NOT EXISTS idx_products_type ON products(product_type);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_handrail_products_product_id ON handrail_products(product_id);
CREATE INDEX IF NOT EXISTS idx_landing_tread_products_product_id ON landing_tread_products(product_id);
CREATE INDEX IF NOT EXISTS idx_rail_parts_products_product_id ON rail_parts_products(product_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_job_id ON quote_items(job_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_product_id ON quote_items(product_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_material_id ON quote_items(material_id);

-- Insert sample materials
INSERT INTO materials (name, multiplier, description) VALUES
('Pine', 1.000, 'Standard pine wood - base pricing'),
('Oak', 1.500, 'Premium oak wood - 50% price increase'),
('Maple', 1.750, 'High-end maple wood - 75% price increase'),
('Cherry', 2.000, 'Premium cherry wood - 100% price increase'),
('Mahogany', 2.500, 'Luxury mahogany wood - 150% price increase')
ON CONFLICT DO NOTHING;

-- Insert sample handrail products
INSERT INTO products (name, product_type) VALUES
('Standard Round Handrail', 'handrail'),
('Square Profile Handrail', 'handrail'),
('Decorative Carved Handrail', 'handrail')
ON CONFLICT DO NOTHING;

INSERT INTO handrail_products (product_id, cost_per_6_inches, labor_install_cost) VALUES
(1, 25.00, 150.00),
(2, 30.00, 175.00),
(3, 45.00, 200.00)
ON CONFLICT DO NOTHING;

-- Insert sample landing tread product
INSERT INTO products (name, product_type) VALUES
('6" Landing Tread', 'landing_tread'),
('End Cap - Standard', 'rail_parts'),
('Mounting Bracket - Heavy Duty', 'rail_parts'),
('Joint Connector', 'rail_parts')
ON CONFLICT DO NOTHING;

INSERT INTO landing_tread_products (product_id, cost_per_6_inches, labor_install_cost) VALUES
(4, 35.00, 125.00)
ON CONFLICT DO NOTHING;

INSERT INTO rail_parts_products (product_id, base_price, labor_install_cost) VALUES
(5, 15.00, 25.00),
(6, 12.50, 30.00),
(7, 8.00, 15.00)
ON CONFLICT DO NOTHING;

-- Create salesmen table (separate from users)
CREATE TABLE IF NOT EXISTS salesmen (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    commission_rate DECIMAL(5,2) DEFAULT 0.00 CHECK (commission_rate >= 0),
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tax rates table for state-based tax calculations
CREATE TABLE IF NOT EXISTS tax_rates (
    id SERIAL PRIMARY KEY,
    state_code VARCHAR(2) NOT NULL,
    rate DECIMAL(5,4) NOT NULL CHECK (rate >= 0),
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create job sections table for organizing products by location
CREATE TABLE IF NOT EXISTS job_sections (
    id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add new columns to jobs table for enhanced functionality
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salesman_id INTEGER REFERENCES salesmen(id);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS show_line_pricing BOOLEAN DEFAULT true;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS labor_total DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,4) DEFAULT 0.0000;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS delivery_date DATE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS job_location TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS order_designation VARCHAR(50) DEFAULT 'INSTALL';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS model_name VARCHAR(255);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS installer VARCHAR(255);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS terms VARCHAR(255);

-- Enhance quote_items table for detailed product information
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS section_id INTEGER REFERENCES job_sections(id);
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS part_number VARCHAR(100);
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1 CHECK (quantity > 0);
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS unit_price DECIMAL(8,2) DEFAULT 0.00;
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS line_total DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS is_taxable BOOLEAN DEFAULT true;

-- Add indexes for better performance on new tables
CREATE INDEX IF NOT EXISTS idx_salesmen_active ON salesmen(is_active);
CREATE INDEX IF NOT EXISTS idx_salesmen_email ON salesmen(email);
CREATE INDEX IF NOT EXISTS idx_tax_rates_state ON tax_rates(state_code);
CREATE INDEX IF NOT EXISTS idx_tax_rates_active ON tax_rates(is_active);
CREATE INDEX IF NOT EXISTS idx_job_sections_job_id ON job_sections(job_id);
CREATE INDEX IF NOT EXISTS idx_job_sections_order ON job_sections(display_order);
CREATE INDEX IF NOT EXISTS idx_jobs_salesman_id ON jobs(salesman_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_section_id ON quote_items(section_id);

-- Insert sample salesmen
INSERT INTO salesmen (first_name, last_name, email, phone, commission_rate) VALUES
('Best Fit', 'Sales', 'sales@craftmart.com', '(410) 751-9467', 5.00),
('David', 'Johnson', 'david.johnson@craftmart.com', '(555) 123-4567', 7.50),
('Sarah', 'Williams', 'sarah.williams@craftmart.com', '(555) 987-6543', 6.25)
ON CONFLICT DO NOTHING;

-- Insert common US state tax rates (sample data)
INSERT INTO tax_rates (state_code, rate) VALUES
('MD', 0.0600),  -- Maryland 6%
('VA', 0.0575),  -- Virginia 5.75%
('DC', 0.0600),  -- Washington DC 6%
('PA', 0.0634),  -- Pennsylvania 6.34%
('DE', 0.0000),  -- Delaware 0%
('WV', 0.0635),  -- West Virginia 6.35%
('NC', 0.0475),  -- North Carolina 4.75%
('CA', 0.0775),  -- California 7.75%
('NY', 0.0800),  -- New York 8%
('FL', 0.0600)   -- Florida 6%
ON CONFLICT DO NOTHING;