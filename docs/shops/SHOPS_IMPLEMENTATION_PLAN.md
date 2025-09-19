# Shops Feature Implementation Plan

## Overview
Implement a complete shops feature that generates cut sheets from job orders, tracks shop status, and produces Shop Paper and Cut List PDFs consistent with Shops.txt.

## Current State (September 2025)
- Backend routes in place: available orders, generate shops, update status, download Shop Paper/Cut List; legacy CRUD retained.
- Database ready for multi‑job shops:
  - `shops` has `shop_number`, `status`, `generated_date`.
  - `shop_jobs` maps shops ↔ `job_items` (migrations 20/21).
  - `job_items` now owns `shops_run`, `shops_run_date` (+ indexes) via migration 22.
- Shop generation service:
  - Accepts one/many orders with status `order`; marks `job_items.shops_run=true`.
  - Emits `cut_sheets` with per‑row `job_id`, `stair_id`, `location`, material, qty, and computed dimensions.
  - Dimension logic updated to Shops.txt (box/open/double‑open), including `open_left`/`open_right`.
- PDFs (server‑side via Puppeteer/Chromium in Docker):
  - Cut List: minimal header (no “OAK LIST”), grouped Job → Location → Stair; rows show TREADS/RISERS/S4S; dimensions print as fractional inches.
  - Shop Paper: quote‑like per‑job sections listing Rail parts and Stair configurations (no pricing) with signature/warning per job.
- Frontend Shops page uses live API for list/generate/status/download; generation modal supports “Orders without shops”.

## Requirements (from Shops.txt)

### Shop Generation Rules
- Available for any job with status `order`.
- Select all orders, individual orders, or only orders without shops run.
- After generation, mark jobs and exclude once invoiced.

### PDF Documents

#### 1) Shop Paper (Delivery Ticket / No Pricing)
- List all Rail parts and Stair configurations by job (similar to quote), omitting pricing/totals.
- Include signature and warning block per job (clean modern typography, text as specified).

#### 2) Shop Cut List (Cut Sheets)
Cutting rules for stairs:

Treads:
- Box: width = rough_cut + nose; length = L − 0.625 − 0.625
- Open (incl. open_left/open_right): width = rough_cut + nose; length = L − 0.625
- Double‑open: width = rough_cut + nose; length = L

Risers:
- Box: width = riser_height; length = L − 1.25
- Open: width = riser_height; length = L − 1.875
- Double‑open: width = riser_height; length = L − 2.5

S4S:
- Width = riser_height − 1
- Length uses double‑open > open > box rule

## Gap Analysis (Updated)
- Association: `shop_jobs` normalizes shops ↔ orders; APIs return per‑shop job summaries. ✅
- Dimensions: tread/riser/S4S math updated; treads now use configuration rough cut + nose for width and span‑based length. ✅
- Formatting: Cut List uses fractional inches; item labels simplified; removed decorative banners. ✅
- Shop Paper content: now lists rail parts and stair configurations per job (no pricing) with per‑job signature/warning. ✅
- Still to refine:
  - Material/grade wording (e.g., “2nd Grade Oak”, “PINE”) — mapping rules pending.
  - Stair ID display (config name vs A/B/C per location) — rule pending.
  - Fraction precision — currently 1/32; confirm 1/16 if preferred.

## Implementation Tasks (Updated Plan)

### Phase 1: Database (Complete)
1. `shop_jobs` join table (with indexes).
2. `job_items` shops tracking (fields + indexes).
3. `shops` metadata columns.

### Phase 2: Backend Services
1. `generateCutSheets(jobIds)` (done; refine label mapping):
   - Include `job_id`/`job_title` in rows; compute dimensions per Shops.txt; persist relations in `shop_jobs`; set `shops_run`.
2. Helpers (done): dimension utilities accept numeric coercion and fallbacks; grouping utilities in PDFs.
3. Controller (done): responses include job summaries for UI.
4. PDFs (done; refine style/labels):
   - Shop Paper: quote‑like content (no pricing) + signature/warning per job.
   - Cut List: minimal header, grouped rows with fractional inches.

### Phase 3: Frontend
1. Service/types wired to backend responses (shops list, jobs, downloads). ✅
2. UI: list shops, generation modal with “unrun” filter, status updates, downloads. ✅

### Phase 4: Integration & Testing
1. Integration: verify joins across `shop_jobs` ↔ `job_items`/`jobs`/`customers`/`salesmen`/stair config tables. ✅
2. Scenarios (updated):
   - Single/multi‑order generation; box/open/double‑open; confirm all formulas.
   - Tread width = rough_cut + nose; tread length = span − routes; validate riser/S4S.
   - Shop Paper lists rail parts and stair configurations (no pricing) with per‑job signature/warning.
   - API regression: filters, status, downloads; migration integrity.

## Success Criteria (Revised)
- [x] Orders in status `order` selectable; persisted in `shop_jobs`.
- [x] `cut_sheets` store accurate dimensions; `open_left/right` handled.
- [x] Treads/risers/S4S follow Shops.txt formulas.
- [x] Shop Paper shows rail parts + stair configurations per job; signature/warning per job; no pricing.
- [x] Cut List shows grouped rows with fractional inches and minimal header.
- [x] `job_items.shops_run` updates and is respected by “unrun” filter.
- [x] Frontend uses live API for list/generate/status/download.
- [ ] Material/grade label mapping finalized and implemented.
- [ ] Stair ID rule finalized (config name vs A/B/C).
- [ ] Fraction precision confirmed (1/16 vs 1/32).

## Implementation Order (Updated)
1. Database normalization + tracking — done.
2. Backend generation + dimensions — done (labels pending).
3. PDF templates aligned with Shops.txt — done (style/labels pending).
4. Frontend wiring — done.
5. QA & polish: material labels, stair ID, fraction precision.

## Decision Log / Clarifications
- Shop Paper = quote‑style list (rail parts + stair configurations) with no pricing and a per‑job signature/warning block.
- Cut List prioritizes correct formulas and grouping; no decorative banners.
- Width in Cut List = configuration rough cut + nose; tread length uses span as base.

## Verification (Docker)
```bash
# Apply job_items tracking (idempotent)
docker-compose exec -T postgres psql -U craftmart_user -d craftmart < database/migrations/22-add-shops-run-to-job-items.sql

# Generate shops for selected order IDs
curl -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{"orderIds":[44]}' http://localhost/api/shops/generate

# Download PDFs
curl -H "Authorization: Bearer <TOKEN>" -o cut-list.pdf http://localhost/api/shops/<SHOP_ID>/cut-list
curl -H "Authorization: Bearer <TOKEN>" -o shop-paper.pdf http://localhost/api/shops/<SHOP_ID>/shop-paper
```

## Notes
- Use existing auth middleware and error handling; keep TS strict.
- PDF generation runs headless Chromium in Docker; see backend Dockerfile for dependencies.
- UI styling intentionally minimal; content accuracy per Shops.txt is the priority.
