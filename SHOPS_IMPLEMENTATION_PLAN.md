# Shops Feature Implementation Plan

## Overview
Implement a complete shops feature for CraftMart that generates cut sheets from job orders, tracks shop generation status, and produces PDF documents for the production floor.

## Current State
- Basic backend CRUD operations exist (shopController.ts, shops routes)
- Frontend has placeholder UI with mock data
- Database has shops table but lacks tracking fields
- No cut sheet generation logic
- No PDF generation for shops

## Requirements (from Shops.txt)

### Shop Generation Rules
- Available for any job with status='order'
- Can select all orders, individual orders, or orders without shops run
- Mark jobs when shops have been run for sorting/filtering
- Remove from shops options once job becomes invoice

### PDF Documents

#### 1. Shop Paper
- List of all parts/stairs by job (no pricing)
- Delivery signature section per job:
  ```
  Sign here for delivery _____________ Date _____________
  
  Time In: _________ Time Out: _________ O/D _________
  
  This product needs to be weather proofed as soon as possible 
  and must be sealed within 30 days of delivery.
  Craft Mart assumes no responsibility for cracks or splits
  after 30 days.
  ```

#### 2. Shop Parts List (Cut Sheets)
Cutting calculations for stairs:

**Treads:**
- Box Treads: Width = rough_cut_width + nose_size, Length = tread_length - 1.25" (for routes)
- Open Treads: Width = rough_cut_width + nose_size, Length = tread_length - 0.625" (for route)
- Double Open Treads: Width = rough_cut_width + nose_size, Length = tread_length

**Risers:**
- Box Risers: Width = riser_height, Length = riser_length - 1.25" (for routes)
- Open Risers: Width = riser_height, Length = riser_length - 1.875" (route + nose overhang)
- Double Open Risers: Width = riser_height, Length = riser_length - 2.5" (nose overhangs)

**S4S (Bottom Riser):**
- Each stair gets one S4S
- Width = riser_height - 1"
- Length logic:
  - If has double open treads: use double open riser length
  - Else if has open ends: use open riser length  
  - Else: use box riser length

## Implementation Tasks

### Phase 1: Database Updates
1. **Add tracking fields to jobs table**
   - `shops_run` (boolean, default false)
   - `shops_run_date` (timestamp)
   - Migration: `database/migrations/15-add-shops-tracking.sql`

2. **Update shops table structure**
   - Ensure cut_sheets JSONB can store calculated dimensions
   - Add status field for shop generation state

### Phase 2: Backend Services

1. **Create Shop Service (`backend/src/services/shopService.ts`)**
   - `generateCutSheets(jobIds: number[])` - Main generation logic
   - `calculateTreadDimensions(config, item)` - Apply tread formulas
   - `calculateRiserDimensions(config, item)` - Apply riser formulas
   - `calculateS4SDimensions(config)` - Determine S4S dimensions
   - `aggregateMaterials(cutSheets)` - Group by material type
   - `markJobsAsShopsRun(jobIds)` - Update job status

2. **Enhance Shop Controller**
   - `GET /api/shops/available-orders` - Get eligible orders
   - `POST /api/shops/generate` - Generate shops from selected orders
   - `GET /api/shops/:id/shop-paper` - Download shop paper PDF
   - `GET /api/shops/:id/cut-list` - Download cut list PDF
   - Update existing CRUD to handle new structure

3. **PDF Generation Updates**
   - Add to `pdfService.ts`:
     - `generateShopPaper(shopId)` - Shop paper with signatures
     - `generateCutList(shopId)` - Detailed cut sheets
   - Use existing PDF styling patterns

### Phase 3: Frontend Implementation

1. **Create Shop Service (`frontend/src/services/shopService.ts`)**
   ```typescript
   interface ShopService {
     getAvailableOrders(filter?: 'all' | 'unrun')
     generateShops(orderIds: number[])
     getShops()
     getShop(id: number)
     downloadShopPaper(id: number)
     downloadCutList(id: number)
   }
   ```

2. **Update Shops Page Component**
   - Replace mock data with API calls
   - Add order selection UI:
     - Filter dropdown (All Orders / Orders without Shops / Individual)
     - Order list with checkboxes
     - Generate Shops button
   - Display generated shops with:
     - Shop number/date
     - Associated jobs
     - Cut sheet count
     - Download buttons
   - Show shops_run badge on orders

3. **Create Supporting Components**
   - `ShopGenerationModal` - Order selection interface
   - `ShopCard` - Display shop with actions
   - `OrderSelectionList` - Filterable order list

### Phase 4: Integration & Testing

1. **Integration Points**
   - Link shops to jobs via job_id
   - Pull stair configurations from `stair_configurations` table
   - Use `stair_config_items` for detailed components
   - Apply material multipliers from `material_multipliers`

2. **Test Scenarios**
   - Generate shops for single order
   - Generate shops for multiple orders
   - Verify cut calculations for each tread/riser type
   - Confirm S4S length logic
   - Test PDF generation and formatting
   - Verify shops_run tracking
   - Ensure invoiced jobs are excluded

## File Structure

```
New Files:
├── backend/
│   └── src/
│       └── services/
│           └── shopService.ts
├── frontend/
│   └── src/
│       ├── services/
│       │   └── shopService.ts
│       └── components/
│           └── shops/
│               ├── ShopGenerationModal.tsx
│               ├── ShopCard.tsx
│               └── OrderSelectionList.tsx
└── database/
    └── migrations/
        └── 15-add-shops-tracking.sql

Modified Files:
├── backend/
│   └── src/
│       ├── controllers/
│       │   └── shopController.ts
│       ├── routes/
│       │   └── shops.ts
│       └── services/
│           └── pdfService.ts
├── frontend/
│   └── src/
│       └── pages/
│           ├── Shops.tsx
│           └── Shops.css
└── database/
    └── init/
        └── 01-init.sql
```

## Success Criteria
- [ ] Orders with status='order' can be selected for shop generation
- [ ] Shops are generated with accurate cut calculations
- [ ] Jobs are marked with shops_run status
- [ ] Shop paper PDF includes all jobs with signature sections
- [ ] Cut list PDF shows precise dimensions for all components
- [ ] S4S dimensions follow the specified logic
- [ ] Invoiced jobs are excluded from shop generation
- [ ] UI provides clear filtering and selection options
- [ ] PDFs follow existing clean modern design

## Implementation Order
1. Database migrations
2. Backend shop service with calculations
3. Shop controller endpoints
4. PDF generation methods
5. Frontend shop service
6. Update Shops page with real data
7. Create selection modal
8. Integration testing
9. UI polish and responsive design

## Notes
- Use existing authentication middleware
- Follow current error handling patterns
- Maintain TypeScript strict mode
- Use existing PDF styling from job quotes
- Ensure mobile responsiveness
- Add proper loading states
- Include error messages for failed operations