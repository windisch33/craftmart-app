-- CraftMart Database Schema Documentation Generator
-- Generates comprehensive markdown documentation of the current database schema

\echo '# CraftMart Database Schema Documentation'
\echo ''
\echo 'Generated on:' `date`
\echo ''
\echo '## Database Overview'
\echo ''
\echo 'This document contains the complete schema for the CraftMart application database.'
\echo ''

-- Table count and overview
\echo '## Schema Statistics'
\echo ''
SELECT
  'Total Tables: ' || COUNT(*) as schema_stats
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

\echo ''

-- List all tables with row counts
\echo '## Tables Overview'
\echo ''
\echo '| Table Name | Description | Row Count |'
\echo '|------------|-------------|-----------|'

-- Core Tables Section
\echo ''
\echo '## Core Business Tables'
\echo ''

-- Users table
\echo '### users'
\echo 'Authentication and user management'
\echo ''
\d+ users;
\echo ''

-- Customers table
\echo '### customers'
\echo 'Customer contact and address information'
\echo ''
\d+ customers;
\echo ''

-- Salesmen table
\echo '### salesmen'
\echo 'Sales representative information and commission tracking'
\echo ''
\d+ salesmen;
\echo ''

-- Jobs workflow tables
\echo '## Jobs Workflow Tables'
\echo ''
\echo '**Note:** The database uses a hierarchical structure where `jobs` acts as project groupings, and `job_items` contains the actual quote/order/invoice records.'
\echo ''

\echo '### jobs'
\echo 'Project groupings for customers (internally projects table)'
\echo ''
\d+ jobs;
\echo ''

\echo '### job_items'
\echo 'Main job records - quotes, orders, and invoices (ACTIVE workflow table)'
\echo ''
\d+ job_items;
\echo ''

\echo '### job_sections'
\echo 'Job organization into sections'
\echo ''
\d+ job_sections;
\echo ''

\echo '### quote_items'
\echo 'Line items for jobs with pricing details'
\echo ''
\d+ quote_items;
\echo ''

-- Product catalog tables
\echo '## Product Catalog Tables'
\echo ''

\echo '### products'
\echo 'Base product catalog'
\echo ''
\d+ products;
\echo ''

\echo '### handrail_products'
\echo 'Handrail products with per-6-inch pricing'
\echo ''
\d+ handrail_products;
\echo ''

\echo '### landing_tread_products'
\echo 'Landing tread products with per-6-inch pricing'
\echo ''
\d+ landing_tread_products;
\echo ''

\echo '### rail_parts_products'
\echo 'Rail parts with base pricing'
\echo ''
\d+ rail_parts_products;
\echo ''

-- Material and pricing tables
\echo '## Materials and Pricing Tables'
\echo ''

\echo '### materials'
\echo 'Legacy materials table (deprecated)'
\echo ''
\d+ materials;
\echo ''

\echo '### material_multipliers'
\echo 'Material pricing multipliers for simplified pricing system'
\echo ''
\d+ material_multipliers;
\echo ''

-- Stair pricing system tables
\echo '## Stair Pricing System Tables'
\echo ''

\echo '### stair_board_types'
\echo 'Board type definitions for stair components'
\echo ''
\d+ stair_board_types;
\echo ''

\echo '### stair_pricing_simple'
\echo 'Simplified formula-based pricing system'
\echo ''
\d+ stair_pricing_simple;
\echo ''

\echo '### stair_special_parts'
\echo 'Special stair components and add-ons'
\echo ''
\d+ stair_special_parts;
\echo ''

\echo '### stair_configurations'
\echo 'Saved stair configurations'
\echo ''
\d+ stair_configurations;
\echo ''

\echo '### stair_config_items'
\echo 'Line items for stair configurations'
\echo ''
\d+ stair_config_items;
\echo ''

-- Deposit management tables
\echo '## Deposit Management Tables'
\echo ''

\echo '### deposits'
\echo 'Customer deposit tracking with payment details'
\echo ''
\d+ deposits;
\echo ''

\echo '### deposit_allocations'
\echo 'Allocation of deposits to specific jobs and items'
\echo ''
\d+ deposit_allocations;
\echo ''

-- Other business tables
\echo '## Other Business Tables'
\echo ''

\echo '### shops'
\echo 'Shop cut sheet management'
\echo ''
\d+ shops;
\echo ''

\echo '### tax_rates'
\echo 'State tax rate configuration'
\echo ''
\d+ tax_rates;
\echo ''


-- Views section
\echo '## Database Views'
\echo ''

\echo '### deposits_with_balance'
\echo 'View showing deposits with calculated unallocated amounts'
\echo ''
\d+ deposits_with_balance;
\echo ''

-- Functions and triggers
\echo '## Database Functions'
\echo ''

\df+ calculate_stair_price_simple;
\df+ update_job_deposit_totals;
\df+ check_allocation_total;
\df+ validate_deposit_allocation_links;

-- Indexes section
\echo '## Database Indexes'
\echo ''

SELECT
  schemaname as schema,
  tablename as table_name,
  indexname as index_name,
  indexdef as definition
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Foreign key relationships
\echo ''
\echo '## Foreign Key Relationships'
\echo ''

SELECT
  tc.table_name as from_table,
  kcu.column_name as from_column,
  ccu.table_name as to_table,
  ccu.column_name as to_column,
  tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;