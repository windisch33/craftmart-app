-- Add shops tracking fields to jobs table
-- Migration: 15-add-shops-tracking.sql

ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS shops_run BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS shops_run_date TIMESTAMP NULL;

-- Create index for efficient filtering of jobs by shops status
CREATE INDEX IF NOT EXISTS idx_jobs_shops_run ON jobs(shops_run);

-- Update existing orders to have shops_run = false (should already be default)
UPDATE jobs SET shops_run = false WHERE shops_run IS NULL;

-- Update shops table to support multiple jobs and better tracking
ALTER TABLE shops 
ADD COLUMN IF NOT EXISTS shop_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'generated' CHECK (status IN ('generated', 'in_progress', 'completed')),
ADD COLUMN IF NOT EXISTS generated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create index for shop lookups
CREATE INDEX IF NOT EXISTS idx_shops_status ON shops(status);
CREATE INDEX IF NOT EXISTS idx_shops_generated_date ON shops(generated_date);