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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'quote' CHECK (status IN ('quote', 'order', 'invoice')),
    quote_amount DECIMAL(10,2),
    order_amount DECIMAL(10,2),
    invoice_amount DECIMAL(10,2),
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_jobs_customer_id ON jobs(customer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_shops_job_id ON shops(job_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

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

INSERT INTO jobs (customer_id, title, description, status, quote_amount) VALUES
(1, 'Custom Oak Staircase', 'Traditional oak staircase with carved railings', 'quote', 5500.00),
(2, 'Modern Steel Staircase', 'Industrial steel staircase for office building', 'order', 8200.00)
ON CONFLICT DO NOTHING;