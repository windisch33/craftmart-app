-- Data migration script for existing jobs
-- Creates a default project for each customer with existing jobs
-- and assigns all existing jobs to their customer's default project

-- Step 1: Create default projects for customers with existing jobs
INSERT INTO projects (customer_id, name, created_at, updated_at)
SELECT DISTINCT 
  j.customer_id,
  'Default Project - ' || c.name AS name,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM jobs j
INNER JOIN customers c ON j.customer_id = c.id
WHERE j.project_id IS NULL
AND NOT EXISTS (
  SELECT 1 FROM projects p 
  WHERE p.customer_id = j.customer_id 
  AND p.name = 'Default Project - ' || c.name
);

-- Step 2: Update existing jobs to reference their customer's default project
UPDATE jobs 
SET project_id = (
  SELECT p.id 
  FROM projects p 
  INNER JOIN customers c ON p.customer_id = c.id
  WHERE p.customer_id = jobs.customer_id 
  AND p.name = 'Default Project - ' || c.name
  LIMIT 1
)
WHERE project_id IS NULL;

-- Step 3: Verify that all jobs now have a project_id
-- This should return 0 rows
SELECT COUNT(*) as jobs_without_project 
FROM jobs 
WHERE project_id IS NULL;

-- Step 4: Make project_id NOT NULL after migration (commented out for safety)
-- Uncomment the next line after verifying the migration was successful:
-- ALTER TABLE jobs ALTER COLUMN project_id SET NOT NULL;

-- Step 5: Add check constraint to ensure all jobs have projects (optional)
-- ALTER TABLE jobs ADD CONSTRAINT jobs_must_have_project CHECK (project_id IS NOT NULL);