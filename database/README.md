# Database Schema Documentation

This directory contains comprehensive documentation of the CraftMart database schema.

## Generated Files

### `schema_current.sql`
- Complete PostgreSQL schema dump (DDL only)
- Contains all table definitions, indexes, constraints, functions, and triggers
- Generated using `pg_dump --schema-only`
- Use this file to recreate the complete database structure

### `schema_documentation.md`
- Human-readable schema documentation in Markdown format
- Includes detailed table descriptions, column definitions, and relationships
- Shows indexes, foreign keys, and constraints
- Generated using the `generate_schema_docs.sql` script

### `generate_schema_docs.sql`
- PostgreSQL script that generates the markdown documentation
- Queries system catalogs to extract schema information
- Can be re-run to update documentation when schema changes

## Usage

### To regenerate schema documentation:

```bash
# Export current schema structure
docker-compose exec postgres pg_dump -U craftmart_user -d craftmart --schema-only > database/schema_current.sql

# Generate markdown documentation
docker-compose exec postgres psql -U craftmart_user -d craftmart < database/generate_schema_docs.sql > database/schema_documentation.md
```

### To restore database from schema:

```bash
# Restore complete schema structure
docker-compose exec postgres psql -U craftmart_user -d craftmart < database/schema_current.sql
```

## Schema Overview

The CraftMart database contains **22 tables** organized into these categories:

**Important Note:** The database uses a hierarchical structure where `jobs` acts as project groupings, and `job_items` contains the actual quote/order/invoice records. This naming can be confusing due to historical migrations.

### Core Business Tables
- `users` - Authentication and user management
- `customers` - Customer contact and address information
- `salesmen` - Sales representative information and commission tracking

### Jobs Workflow Tables
- `jobs` - Project groupings for customers (internally projects table)
- `job_items` - Main job records tracking quotes, orders, and invoices
- `job_sections` - Job organization into sections
- `quote_items` - Line items for jobs with pricing details

### Product Catalog Tables
- `products` - Base product catalog
- `handrail_products` - Handrail products with per-6-inch pricing
- `landing_tread_products` - Landing tread products with per-6-inch pricing
- `rail_parts_products` - Rail parts with base pricing

### Materials and Pricing Tables
- `materials` - Legacy materials table (deprecated)
- `material_multipliers` - Material pricing multipliers for simplified pricing system

### Stair Pricing System Tables
- `stair_board_types` - Board type definitions for stair components
- `stair_pricing_simple` - Simplified formula-based pricing system
- `stair_special_parts` - Special stair components and add-ons
- `stair_configurations` - Saved stair configurations
- `stair_config_items` - Line items for stair configurations

### Deposit Management Tables
- `deposits` - Customer deposit tracking with payment details
- `deposit_allocations` - Allocation of deposits to specific jobs and items

### Other Business Tables
- `shops` - Shop cut sheet management
- `tax_rates` - State tax rate configuration

## Key Features

### Database Views
- `deposits_with_balance` - Shows deposits with calculated unallocated amounts

### Stored Functions
- `calculate_stair_price_simple()` - Calculates stair pricing using simplified formula
- `update_job_deposit_totals()` - Maintains job-level deposit totals
- `check_allocation_total()` - Prevents deposit over-allocation
- `validate_deposit_allocation_links()` - Ensures allocation data integrity

### Data Integrity
- Comprehensive foreign key relationships
- Check constraints for business rules
- Triggers for automatic data maintenance
- Unique indexes to prevent duplicates

*Last Updated: September 18, 2025 - Corrected job_items documentation*