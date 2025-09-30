# CraftMart Project - Claude AI Assistant Guide

## Project Overview
CraftMart is a custom staircase manufacturer management system for 6-10 employees. Web application for managing customers, jobs (quotes → orders → invoices), shops with cut sheets, salesmen, and sales/tax reports.

**Production URL**: https://www.cmioe.com

## Quick Start
```bash
# Start development environment
docker-compose up -d

# Database access
docker-compose exec postgres psql -U craftmart_user -d craftmart
```

## Tech Stack
- **Backend**: Node.js 20, Express, TypeScript, PostgreSQL, bcryptjs
- **Frontend**: React 19, TypeScript, Vite, React Router, Axios
- **Infrastructure**: Docker, Nginx, Cloudflare Tunnel
- **Styling**: External CSS modules (no frameworks)

## Project Structure
```
craftmart-app/
├── backend/            # Express API
├── frontend/           # React app
├── database/           # PostgreSQL schema
├── nginx/              # Reverse proxy
├── cloudflared/        # Tunnel config
└── docker-compose.yml  # Dev environment
```

## Key Files
- `docs/plans/outline.txt` - Original requirements (READ FIRST)
- `docs/stair/STAIR_PRICING_FORMULA.txt` - Current simplified pricing model
- `docs/stair/STAIR_PRICING_IMPLEMENTATION_PLAN.md` - Feature progress tracker
- `database/init/01-init.sql` - Complete schema
- `database/migrations/` - Schema updates

## Database Tables

### Core Tables
- **users** - Authentication (JWT)
- **customers** - Contact management
- **salesmen** - Commission tracking
- **jobs** - Quote/order/invoice workflow
- **job_sections** - Job organization
- **quote_items** - Line items with pricing
- **shops** - Cut sheet storage
- **tax_rates** - State tax rates

### Product Tables
- **products** - Base product catalog
- **handrail_products** - Per 6" pricing
- **landing_tread_products** - Per 6" pricing
- **rail_parts_products** - Base price items
- **materials** - Wood types with multipliers

### Stair Pricing Tables (Simplified System)
- **material_multipliers** - Material pricing multipliers (replaced stair_materials)
- **stair_board_types** - Board type definitions
- **stair_pricing_simple** - Simplified pricing with base + increment formula
- **stair_special_parts** - Add-on components
- **stair_configurations** - Saved stair configurations
- **stair_config_items** - Line items for configurations

## Simplified Stair Pricing Formula
```
Price = (Base Price + Length Charge + Width Charge) × Material Multiplier + Mitre Charge
```

### Board Types with Dimension-Based Pricing:
1. **Box Tread** - Base $37, +$1.25/6" length, +$2.00/inch width
2. **Open Tread** - Base $48, +$1.75/6" length, +$2.50/inch width  
3. **Double Open** - Base $62, +$2.25/6" length, +$3.00/inch width
4. **Riser** - Base $3.50, +$0.25/6" length, +$0.50/inch width
5. **Stringer** - Base $3.00/riser, +$0.50/inch width, +$0.25/inch thickness
6. **Center Horse** - Base $5.00/riser, +$0.75/inch width, +$0.35/inch thickness

## API Endpoints Summary
- `/api/auth/*` - Authentication
- `/api/customers/*` - Customer CRUD
- `/api/salesmen/*` - Salesman CRUD
- `/api/jobs/*` - Job management with advanced search
- `/api/products/*` - Product catalog (handrails, landing-treads, rail-parts)
- `/api/materials/*` - Material multipliers management
- `/api/stairs/*` - Stair component CRUD (materials, board-types, pricing, special-parts)
- `/api/stairs/calculate-price` - Real-time pricing calculation
- `/api/reports/*` - Sales and tax reports

## UI/UX Standards
- **Design**: Blue-purple gradient headers, card-based layouts
- **Mobile**: 44px touch targets, responsive at 768px/480px
- **CSS**: BEM naming, component-scoped files, no frameworks
- **Components**: Simplified SelectableList (no checkboxes), modal forms, hover actions
- **Forms**: Clean modal-based editing with validation

## Recent UI Improvements
- **SelectableList**: Removed checkboxes and bulk selection, hover-only actions
- **BoardTypeForm**: Simplified structure, disabled ID editing for existing items
- **StairConfigurator**: Enhanced dimension display for stringers
- **Products Page**: Cleaner interface without selection clutter

## Component Architecture (August 2025 Refactoring)
- **Target**: Keep components under 400 lines
- **Pattern**: Extract forms, displays, utilities, and error boundaries
- **Structure**: 
  - Main component orchestrates
  - Subcomponents handle specific UI sections
  - Shared utilities for calculations and validations
  - Dedicated types files

### Refactored Components:
- QuickPricer: 1,469 → 388 lines (-74%)
- ProductSelector: 1,135 → 674 lines (-41%)  
- StairConfigurator: 1,223 → 567 lines (-54%)

## Development Guidelines
- TypeScript strict mode
- JWT auth (24hr expiry)
- Parameterized SQL queries
- Frontend/backend validation
- Error handling on all endpoints
- No proactive documentation creation

## Current Status (August 2025)

### ✅ Completed Features
- Authentication system with JWT
- Customer/Salesman management
- Jobs with PDF generation and stair configurations
- Advanced search/filtering across all entities
- Mobile responsive design
- Multi-product catalog (handrails, landing treads, rail parts)
- **Simplified stair pricing system**:
  - Formula-based pricing (base + increments)
  - Material multipliers system
  - Dimension-based pricing for all components
  - Width/thickness modifiers for stringers and center horses
  - Landing tread special handling (3.5" width)
  - Real-time price calculation
- Production deployment via Cloudflare tunnel
- Clean UI without checkbox clutter
- Major component refactoring for maintainability
- Component-based architecture with separation of concerns
- Fixed QuickPricer dropdown bug (materialService method name)

### 🚧 Priority Tasks
1. **Shops** - Cut sheet implementation (partially complete)
   - Database migrations created
   - Backend services scaffolded  
   - Frontend UI in progress
   - PDF generation pending
2. **Reports** - Frontend for sales/tax reports
3. **Dashboard** - Business metrics overview
4. **Performance** - Add database indexes

### 📈 Recommended Database Indexes
```sql
CREATE INDEX idx_jobs_salesman_id ON jobs(salesman_id);
CREATE INDEX idx_jobs_created_at ON jobs(created_at);
CREATE INDEX idx_jobs_delivery_date ON jobs(delivery_date);
CREATE INDEX idx_quote_items_section_id ON quote_items(section_id);
CREATE INDEX idx_tax_rates_state_code ON tax_rates(state_code);
CREATE INDEX idx_stair_pricing_board_type ON stair_pricing_simple(board_type_id);
CREATE INDEX idx_material_multipliers_active ON material_multipliers(is_active);
```

## Known Issues & Fixes
- QuickPricer dropdowns: Use `materialService.getAllMaterials()` not `getMaterials()`
- TypeScript errors in older components (JobForm, JobDetail) - pending cleanup
- QuickPricer_old.tsx exists as backup (can be removed after validation)

## Testing Commands
```bash
# Check logs
docker-compose logs [frontend|backend|postgres]

# TypeScript check
docker-compose exec frontend npx tsc --noEmit --skipLibCheck

# Test stair pricing
docker-compose exec postgres psql -U craftmart_user -d craftmart -c "
  SELECT * FROM calculate_stair_price_simple(1, 5, 42, 11, 1, false);
"

# Restart services
docker-compose restart [frontend|backend]
```

## Important Implementation Notes
- Always read `docs/plans/outline.txt` for original requirements
- Use bcryptjs (not bcrypt) for Alpine Linux compatibility
- Tokens stored in localStorage as 'authToken'
- All monetary amounts stored as DECIMAL in database
- Stringer dimensions parsed from type string (e.g., "2x11.25")
- Center horses automatically use double thickness of stringers
- Landing treads fixed at 3.5" width regardless of regular tread width
- Board Type IDs cannot be edited after creation
- Component files should target <400 lines for maintainability
- Extract complex forms, displays, and utilities into separate files
- Use shared types files for component families

## Database Migration Path
- Migrated from `stair_materials` to `material_multipliers` table
- Consolidated pricing into `stair_pricing_simple` table
- Removed legacy pricing flags and complex matrix system
- All pricing now uses simplified formula approach

*Last Updated: August 25, 2025 - Component Refactoring and Shop Implementation Progress*
