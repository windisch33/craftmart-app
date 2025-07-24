-- Migration to enhance the jobs table with additional fields
-- This adds all the fields mentioned in the IMPLEMENTATION_PLAN.md

-- First, create the salesmen table if it doesn't exist
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

-- Create tax_rates table if it doesn't exist
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
    description TEXT,
    is_labor_section BOOLEAN DEFAULT false,
    is_misc_section BOOLEAN DEFAULT false,
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

-- Add missing columns to jobs table
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS salesman_id INTEGER REFERENCES salesmen(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS delivery_date DATE,
ADD COLUMN IF NOT EXISTS job_location TEXT,
ADD COLUMN IF NOT EXISTS order_designation VARCHAR(100),
ADD COLUMN IF NOT EXISTS model_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS installer VARCHAR(100),
ADD COLUMN IF NOT EXISTS terms TEXT,
ADD COLUMN IF NOT EXISTS show_line_pricing BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS labor_total DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2) DEFAULT 0;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_jobs_salesman_id ON jobs(salesman_id);
CREATE INDEX IF NOT EXISTS idx_job_sections_job_id ON job_sections(job_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_job_id ON quote_items(job_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_section_id ON quote_items(section_id);
CREATE INDEX IF NOT EXISTS idx_tax_rates_state_code ON tax_rates(state_code);

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

-- Update existing jobs with default values
UPDATE jobs 
SET subtotal = COALESCE(quote_amount, order_amount, invoice_amount, 0),
    total_amount = COALESCE(quote_amount, order_amount, invoice_amount, 0)
WHERE subtotal IS NULL OR total_amount IS NULL;