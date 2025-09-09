-- Create projects table
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id) ON DELETE RESTRICT,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX idx_projects_customer_id ON projects(customer_id);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);

-- Add project_id to jobs table (nullable initially for migration)
ALTER TABLE jobs 
ADD COLUMN project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE;

-- Add index for jobs-project relationship
CREATE INDEX idx_jobs_project_id ON jobs(project_id);

-- Update updated_at trigger for projects
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();