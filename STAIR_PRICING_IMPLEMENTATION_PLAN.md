# Stair Pricing Implementation Plan

## Project Overview
Implement a comprehensive stair pricing system for CraftMart that allows users to configure, price, and add stairs to jobs/quotes. The system will replicate the sophisticated pricing logic from the legacy FoxPro system while integrating seamlessly with the modern web application.

## Current Status
- [ ] Phase 1: Database Schema
- [ ] Phase 2: Backend API
- [ ] Phase 3: Frontend Components
- [ ] Phase 4: Data Migration
- [ ] Phase 5: Features & Enhancements
- [ ] Phase 6: Testing & Validation

---

## Phase 1: Database Schema (Backend)

### 1.1 Core Tables Creation
- [ ] Create `stair_materials` table
  - Material sequences and abbreviations
  - Standard materials: Oak, Pine, Poplar, Cherry, Maple, etc.
  - Material pricing multipliers

- [ ] Create `stair_board_types` table
  - Board type definitions (Box Tread, Open Tread, Double Open, Riser, Stringer)
  - Pricing category flags (PRIC_BXRIS, PRIC_OPRIS, etc.)

- [ ] Create `stair_board_prices` table
  - Dimensional constraints (length/width/thickness min/max)
  - Unit costs and full mitre costs
  - Oversized increment pricing rules
  - Date validity ranges

- [ ] Create `stair_special_parts` table
  - Bull nose, quarter round, brackets
  - Winder treads pricing
  - Tread protectors

- [ ] Create `stair_configurations` table
  - Store complete stair configurations
  - Link to jobs/quotes
  - Preserve pricing history

### 1.2 Migration File
- [ ] Create `database/migrations/07-add-stair-pricing-system.sql`
- [ ] Add indexes for performance
- [ ] Add foreign key constraints
- [ ] Insert initial pricing data from documentation

### 1.3 Product Integration
- [ ] Add 'stair' to product_type enum in products table
- [ ] Create stair_products linking table

---

## Phase 2: Backend API (Node.js/Express/TypeScript)

### 2.1 Stair Controller (`backend/src/controllers/stairController.ts`)
- [ ] `GET /api/stairs/materials` - Fetch available stair materials
- [ ] `GET /api/stairs/board-types` - Fetch board types
- [ ] `GET /api/stairs/special-parts` - Fetch special parts catalog
- [ ] `POST /api/stairs/calculate-price` - Calculate stair pricing
- [ ] `POST /api/stairs/configurations` - Save stair configuration
- [ ] `GET /api/stairs/configurations/:id` - Retrieve saved configuration
- [ ] `GET /api/stairs/price-rules` - Get pricing rules for validation

### 2.2 Stair Service (`backend/src/services/stairService.ts`)
- [ ] Implement core pricing algorithm
  - [ ] Base price lookup by dimensions and material
  - [ ] Oversized board calculations
  - [ ] Material multiplier application
  - [ ] Full mitre charge calculations
- [ ] Generate detailed stair descriptions
- [ ] Calculate labor costs
- [ ] Handle special parts pricing

### 2.3 Routes & Middleware
- [ ] Create `backend/src/routes/stairs.ts`
- [ ] Add authentication middleware
- [ ] Input validation schemas
- [ ] Error handling

---

## Phase 3: Frontend Components (React/TypeScript)

### 3.1 Main Configurator Component
**File:** `frontend/src/components/stairs/StairConfigurator.tsx`

- [ ] Step 1: Basic Configuration
  - [ ] Floor-to-floor height input
  - [ ] Number of risers input
  - [ ] Automatic riser height calculation
  - [ ] Validation for standard ranges

- [ ] Step 2: Tread Configuration
  - [ ] Width and type selector per riser
  - [ ] Box/Open Left/Open Right/Double Open options
  - [ ] Tread and nose size inputs
  - [ ] Visual tread type indicators

- [ ] Step 3: Materials Selection
  - [ ] Tread material dropdown
  - [ ] Riser material dropdown
  - [ ] Stringer type and size selector
  - [ ] Material multiplier display

- [ ] Step 4: Additional Components
  - [ ] Bracket type selection (or full mitre option)
  - [ ] Special parts selection
  - [ ] Center horse options
  - [ ] Tread protectors

### 3.2 Supporting Components

- [ ] `TreadTypeSelector.tsx`
  - Visual selector with icons
  - Bulk selection options
  - Copy configuration tools

- [ ] `StairMaterialSelector.tsx`
  - Material dropdown with multipliers
  - Price impact preview
  - Material compatibility warnings

- [ ] `StairPriceSummary.tsx`
  - Detailed price breakdown
  - Component-by-component listing
  - Tax calculations
  - Labor cost display

- [ ] `SpecialNotesSelector.tsx`
  - Saved notes management
  - Common notes library
  - Custom note entry

- [ ] `StairVisualization.tsx` (Optional Enhancement)
  - Visual representation of stair configuration
  - Dimension display
  - Material preview

### 3.3 Integration Points

- [ ] Modify `ProductSelector.tsx` to include stair option
- [ ] Update `JobForm.tsx` to handle stair products
- [ ] Ensure proper state management for complex stair data

### 3.4 Styling
- [ ] Create `StairConfigurator.css`
- [ ] Mobile-responsive design
- [ ] Consistent with existing UI patterns

---

## Phase 4: Data Migration

### 4.1 Pricing Data Import
- [ ] Convert FoxPro BRD_PRICE table data
- [ ] Import material definitions
- [ ] Import special parts pricing
- [ ] Validate against sample calculations

### 4.2 Seed Data Scripts
- [ ] Create `database/seeds/stair-pricing-data.sql`
- [ ] Include all materials from documentation
- [ ] Include standard pricing rules
- [ ] Add sample stair configurations

---

## Phase 5: Features & Enhancements

### 5.1 Core Features
- [ ] Automatic riser height calculation
- [ ] Full mitre option with charges
- [ ] Tread protector selection
- [ ] Labor cost inclusion
- [ ] Tax-aware pricing
- [ ] Multiple stair support per job

### 5.2 Advanced Features
- [ ] Stair configuration templates
- [ ] Quick duplicate functionality
- [ ] Bulk editing tools
- [ ] Price comparison tools
- [ ] Historical pricing lookup

### 5.3 Reporting
- [ ] Generate PDF quotes matching legacy format
- [ ] Detailed cut sheets for shops
- [ ] Material requirements summary
- [ ] Labor time estimates

---

## Phase 6: Testing & Validation

### 6.1 Unit Tests
- [ ] Pricing calculation tests
- [ ] Dimensional validation tests
- [ ] Material multiplier tests
- [ ] Oversized board calculations

### 6.2 Integration Tests
- [ ] API endpoint tests
- [ ] Database query tests
- [ ] End-to-end pricing scenarios

### 6.3 UI Tests
- [ ] Configurator workflow tests
- [ ] Form validation tests
- [ ] Mobile responsiveness tests

### 6.4 Validation
- [ ] Compare calculations with legacy system
- [ ] Validate against sample quotes
- [ ] User acceptance testing

---

## Technical Specifications

### Pricing Algorithm Overview
```
1. Base Price Lookup
   - Match board type, material, and dimensions
   - Find applicable pricing rule within date range

2. Quantity Calculation
   - Apply appropriate riser count (box, open, double)
   - Calculate based on PRIC flags

3. Oversized Adjustments
   - Length increments: (extra_length / Len_Incr) × Len_Cost
   - Width increments: (extra_width / Wid_Incr) × Wid_Cost

4. Material Multipliers
   - Apply material-specific multipliers
   - Handle premium materials (Cherry: 1.7x, Walnut: 1.7x)

5. Additional Charges
   - Full mitre charges for open/double open
   - Special parts pricing
   - Labor costs per component

6. Final Calculation
   - Subtotal all components
   - Apply tax rate
   - Calculate total
```

### Database Schema Highlights

#### Key Relationships
```sql
stair_configurations -> jobs (many-to-one)
stair_board_prices -> stair_materials (many-to-one)
stair_board_prices -> stair_board_types (many-to-one)
stair_configurations -> stair_config_items (one-to-many)
```

#### Critical Indexes
- Board price lookups by type, material, dimensions
- Date range validations
- Active status filtering

### API Response Format
```typescript
interface StairPriceResponse {
  configuration: StairConfiguration;
  breakdown: {
    treads: PriceLineItem[];
    risers: PriceLineItem[];
    stringers: PriceLineItem[];
    specialParts: PriceLineItem[];
    labor: PriceLineItem[];
  };
  subtotal: number;
  taxAmount: number;
  total: number;
  warnings?: string[];
}
```

---

## Timeline Estimates

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Database | 2 days | None |
| Phase 2: Backend API | 2-3 days | Phase 1 |
| Phase 3: Frontend | 3-4 days | Phase 2 |
| Phase 4: Data Migration | 1-2 days | Phase 1 |
| Phase 5: Features | 2-3 days | Phase 3 |
| Phase 6: Testing | 2 days | All phases |

**Total Estimated Duration:** 12-16 days

---

## Risk Factors & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Complex pricing rules | High | Comprehensive testing against legacy system |
| Data migration accuracy | High | Validation scripts and sample comparisons |
| UI complexity | Medium | Incremental development with user feedback |
| Performance with large datasets | Medium | Proper indexing and query optimization |

---

## Success Criteria

1. **Accuracy**: Pricing calculations match legacy system within $0.01
2. **Performance**: Price calculations complete in < 500ms
3. **Usability**: Users can configure stairs in < 2 minutes
4. **Integration**: Seamless addition to existing job workflow
5. **Reliability**: 100% test coverage for pricing logic

---

## Notes & References

- Legacy system documentation: `STAIR_PRICING_DOCUMENTATION.md`
- Sample requirements: `stair-price.txt`
- Example quote format: `stair-page-1.png`
- Original FoxPro code references: STAIRPRC.PRG

---

## Change Log

| Date | Author | Changes |
|------|--------|---------|
| 2025-08-06 | System | Initial plan creation |

---

## Contact & Questions

For questions about this implementation plan, refer to the project documentation or consult with the development team.