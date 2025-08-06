# CraftMart Stair Pricing System Documentation

## Overview
This document provides comprehensive documentation of the CraftMart stair pricing system to enable accurate reimplementation in a modern web application. The pricing system uses a sophisticated database-driven approach with multiple tables that define materials, board types, pricing rules, and special components.

## Database Schema

### 1. MATERIAL Table
Defines all available materials used in stair construction.

| Mat_Seq_N | Matrl_Abv | Matrl_Nam | Description |
|-----------|-----------|-----------|-------------|
| 2 | S | Select Oak | Premium oak material |
| 3 | X | CDX | Plywood material |
| 4 | P | Pine | Standard pine |
| 5 | O | Oak | Standard oak |
| 6 | G | PGS | Specialty material |
| 7 | R | Poplar | Poplar wood |
| 14 | T | White Oak | Premium white oak |
| 17 | A | Maple | Maple wood |
| 18 | E | American Cherry | American cherry |
| 19 | Z | Brazilian Cherry | Brazilian cherry |
| 20 | K | Red Oak | Red oak |
| 21 | I | HeartPine | Heart pine |
| 23 | 2 | 2nd Grade Oak | Second grade oak |
| 24 | 4 | 1/4 Sawn Red Oak | Quarter sawn red oak |
| 25 | 5 | 1/4 Sawn White | Quarter sawn white oak |

### 2. BRD_TYP Table
Defines board types and their pricing categories.

| Brd_Typ_id | BrdTyp_Des | Purpose | Pricing Flags |
|------------|------------|---------|---------------|
| 1 | Box Tread | Box-style stair treads | PRIC_BXRIS = true |
| 2 | Open Tread | Open-end stair treads | PRIC_OPRIS = true |
| 3 | Double Open | Double open-end treads | PRIC_DORIS = true |
| 4 | Riser | Stair risers | PRIC_RISER = true |
| 5 | Stringer | Side support boards | PRIC_RISER = true |
| 6 | Center Horse | Center support | PRIC_RISER = true |
| 7 | Tread Nosing | Front edge of tread | - |
| 8 | Winder Box Tread | Winder box treads | PRIC_RISER = true |
| 9 | Winder Open | Winder open treads | PRIC_RISER = true |
| 10 | Winder Double | Winder double open | PRIC_RISER = true |

### 3. BRD_PRICE Table
Contains the core pricing rules with dimensional constraints.

#### Key Fields:
- **Brd_Typ_ID**: Links to BRD_TYP table
- **Mat_Seq_N**: Links to MATERIAL table
- **Dimensional Ranges**: BrdLen_Min/Max, BrdWid_Min/Max, BrdThk_Min/Max
- **Unit_Cost**: Base price for the board
- **Fulmit_Cst**: Additional cost for full mitre option
- **Increment Fields**: Wid_Incr/Wid_Cost, Len_Incr/Len_Cost for oversized boards

#### Example Pricing Rules (Oak Material ID=5):

**Box Treads (Brd_Typ_ID = 1):**
| Length Range | Width Range | Unit Cost | Full Mitre |
|--------------|-------------|-----------|------------|
| 0-36" | 0-9" | $34.42 | $0 |
| 0-36" | 9-11" | $36.70 | $0 |
| 36-42" | 0-9" | $39.95 | $0 |
| 36-42" | 9-11" | $42.22 | $0 |
| 42-48" | 0-9" | $43.08 | $0 |
| 42-48" | 9-11" | $45.35 | $0 |

**Open Treads (Brd_Typ_ID = 2):**
| Length Range | Width Range | Unit Cost | Full Mitre |
|--------------|-------------|-----------|------------|
| 0-42.75" | 0-9" | $53.72 | $6.30 |
| 0-42.75" | 9-11" | $55.99 | $6.30 |
| 42.75-48" | 0-9" | $59.22 | $6.30 |
| 42.75-48" | 9-11" | $61.49 | $6.30 |

**Double Open Treads (Brd_Typ_ID = 3):**
| Length Range | Width Range | Unit Cost | Full Mitre |
|--------------|-------------|-----------|------------|
| 0-49.5" | 0-9" | $71.61 | $12.60 |
| 0-49.5" | 9-11" | $73.88 | $12.60 |
| 49.5-56.25" | 0-9" | $77.12 | $12.60 |
| 49.5-56.25" | 9-11" | $79.39 | $12.60 |

### 4. StPrt_Prc Table
Defines pricing for special stair parts and accessories.

| StPart_ID | StPar_Desc | Material | Unit_Cost |
|-----------|------------|----------|-----------|
| 1 | Bull Nose | Oak (5) | $102.20 |
| 1 | Bull Nose | CDX (3) | $47.69 |
| 2 | Quarter Round | Oak (5) | $90.85 |
| 2 | Quarter Round | CDX (3) | $42.02 |
| 3 | Tread Protector | Oak (5) | $8.65 |
| 4 | Ramshorn Bracket | Oak (5) | $3.09 |
| 5 | Winder Box Tread | Oak (5) | $128.75 |
| 5 | Winder Box Tread | CDX (3) | $92.70 |
| 6 | Winder Open Tread | Oak (5) | $180.25 |
| 6 | Winder Open Tread | CDX (3) | $108.15 |

### 5. MAT_PRICE Table
Defines material price adjustments for different stair configurations.

| Stair_Type | Trd_Mat_N | Ris_Mat_N | Str_Mat_N | Perc_Inc | Description |
|------------|-----------|-----------|-----------|----------|-------------|
| 1 | 5 (Oak) | 5 (Oak) | 5 (Oak) | 0% | All oak construction |
| 2 | 14 (White Oak) | 7 (Poplar) | 6 (PGS) | 30% | Mixed materials |
| 8 | 18 (Am. Cherry) | 7 (Poplar) | 6 (PGS) | 70% | Premium cherry |
| 14 | 11 (Walnut) | 7 (Poplar) | 6 (PGS) | 70% | Premium walnut |

## Pricing Algorithm

### 1. Base Stair Component Pricing

```
FUNCTION CalculateStairPrice(boardType, length, width, thickness, materialId, 
                           numRisers, numBoxRisers, numOpenRisers, numDoubleOpenRisers, 
                           fullMitre)

1. Query BRD_PRICE table:
   - Match Brd_Typ_ID = boardType
   - Match Mat_Seq_N = materialId
   - Verify dimensions fall within min/max ranges
   - Check date validity (Begin_Date < today < End_Date)

2. Determine which riser type to price:
   - If PRIC_RISER = true: price = numRisers × Unit_Cost
   - If PRIC_BXRIS = true: price = numBoxRisers × Unit_Cost
   - If PRIC_OPRIS = true: price = numOpenRisers × Unit_Cost
   - If PRIC_DORIS = true: price = numDoubleOpenRisers × Unit_Cost

3. Apply full mitre charges:
   - For open risers: add (numOpenRisers × Fulmit_Cst) if fullMitre = true
   - For double open: add (numDoubleOpenRisers × Fulmit_Cst) if fullMitre = true
```

### 2. Oversized Board Handling

When board dimensions exceed standard ranges:

```
IF length > BrdLen_Max:
   extraLength = length - BrdLen_Max
   lengthIncrements = ROUND(extraLength / Len_Incr)
   lengthExtraCost = lengthIncrements × Len_Cost

IF width > BrdWid_Max:
   extraWidth = width - BrdWid_Max
   widthIncrements = ROUND(extraWidth / Wid_Incr)
   widthExtraCost = widthIncrements × Wid_Cost

finalUnitCost = Unit_Cost + lengthExtraCost + widthExtraCost
totalPrice = quantity × finalUnitCost
```

### 3. Additional Components Pricing

#### Stringers (from legacy STAIRPRC.PRG):
- 1" Oak stringers: $12 per riser
- 2" Oak stringers: $15 per riser
- Poplar stringers: $3 per riser
- Pine stringers: $2 per riser

#### Special Parts (from StPrt_Prc):
- Bull nose: Price varies by material and position (L/R/B)
- Quarter round: Price varies by material and position
- Center horse: $5 per riser × number of center horses

### 4. Material Upcharge Calculation

For non-standard material combinations:
```
IF using MAT_PRICE table:
   basePrice = calculated price from steps above
   materialUpcharge = basePrice × (Perc_Inc / 100)
   IF Perc_Sign = -1:
      finalPrice = basePrice + materialUpcharge
   ELSE:
      finalPrice = basePrice - materialUpcharge
```

## Example Calculations

### Example 1: Standard Oak Box Stair
- 10 box treads, Oak, 40" × 10" × 1"
- Query returns: Unit_Cost = $42.22
- Total: 10 × $42.22 = **$422.20**

### Example 2: Open Stair with Full Mitre
- 8 open treads, Oak, 45" × 10" × 1", with full mitre
- Query returns: Unit_Cost = $61.49, Fulmit_Cst = $6.30
- Base: 8 × $61.49 = $491.92
- Full mitre: 7 × $6.30 = $44.10
- Total: $491.92 + $44.10 = **$536.02**

### Example 3: Oversized Double Open Stair
- 5 double open treads, Oak, 80" × 12" × 1"
- Standard max: 79" length, 11" width
- Extra length: 80 - 79 = 1", increment = 1
- Extra width: 12 - 11 = 1", increment = 1
- Base Unit_Cost: $94.82
- Length extra: 1 × $0.71 = $0.71
- Width extra: 1 × $2.21 = $2.21
- Final unit cost: $94.82 + $0.71 + $2.21 = $97.74
- Total: 5 × $97.74 = **$488.70**

## Implementation Notes

1. **Database Queries**: All pricing lookups should validate:
   - Date ranges (Begin_Date < current_date < End_Date)
   - IsActive flag = true (-1 in FoxPro)
   - Dimensional constraints match exactly

2. **Rounding**: FoxPro uses banker's rounding. Ensure consistent rounding in new implementation.

3. **Material Codes**: The system uses both numeric IDs and character abbreviations. Maintain both for compatibility.

4. **Tax Calculation**: Apply state tax rate to final net price (tax calculation happens after all pricing).

5. **Error Handling**: If no matching price rule is found, the system should return 0 and log the error rather than crash.

## Migration Recommendations

1. **Database Structure**: 
   - Convert DBF tables to proper relational database (PostgreSQL/MySQL)
   - Add proper foreign key constraints
   - Index on commonly queried fields (material, board type, dimensions)

2. **API Design**:
   - Create RESTful endpoints for price calculations
   - Implement caching for frequently accessed pricing rules
   - Add versioning to support pricing rule changes over time

3. **Validation**:
   - Implement comprehensive input validation
   - Add unit tests for all pricing scenarios
   - Create integration tests with sample data

4. **Audit Trail**:
   - Log all price calculations with timestamps
   - Track which pricing rules were applied
   - Enable price history queries

This documentation should provide all necessary information to accurately reimplement the CraftMart stair pricing system in a modern web application.