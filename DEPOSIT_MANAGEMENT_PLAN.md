# Deposit Management System - Implementation Plan
**Version 2.0 - Revised with Critical Fixes**

## ⚠️ CRITICAL FIXES FROM REVIEW

### Major Issues Addressed (v2.0):
1. **Item-Level Allocation**: Added `quote_item_id` to `deposit_allocations` table to support applying deposits to specific job items (not just jobs)
2. **Unallocated Amount Sync**: Removed stored `unallocated_amount` field, replaced with computed view to prevent data drift
3. **Trigger Fix**: Updated `update_job_deposit_totals` to handle job changes correctly (updates both old and new job)
4. **Transaction Safety**: Added proper row-level locking in service layer to prevent concurrent modification issues
5. **Data Integrity**: Added database constraints to prevent over-allocation and ensure positive amounts

### Blocking Issues Fixed (v2.1):
6. **API Request Structure**: Fixed `CreateDepositRequest.initial_allocations` to include `job_section_id` and `quote_item_id` fields for item-level allocation support
7. **Missing deposit_id**: Fixed insert operations to properly include `deposit_id` in allocation records (prevents NOT NULL constraint violations)

### Additional Critical Fixes (v2.2):
8. **Missing created_by Handling**: Added `userId` parameter to `allocateDeposit` function and made `created_by` NOT NULL for audit trail integrity
9. **Section Ownership Validation**: Added `fk_section_job` constraint to ensure sections belong to the specified job
10. **Service Layer Validation**: Added runtime validation for both section and item ownership before insert

## Executive Summary
Implement a comprehensive deposit tracking system that allows applying customer deposit checks to one or multiple jobs at the item level, with the ability to track payment history, show remaining balances, and handle split payments across jobs and items.

## Business Requirements
1. **Accept deposit checks** from customers
2. **Apply deposits to specific job items** within a job (item-level granularity)
3. **Split single checks** across multiple jobs and items
4. **Track deposit history** for audit trail
5. **Display deposit status** on job details and item level
6. **Calculate remaining balance** after deposits with automatic synchronization

## Database Design

### New Tables Required

#### 1. `deposits` - Main deposit tracking (REVISED WITH COMPUTED BALANCE)
```sql
CREATE TABLE deposits (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  check_number VARCHAR(50),
  check_date DATE,
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount > 0),
  -- REMOVED: unallocated_amount (will be computed, not stored)
  deposit_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_deposits_customer_id ON deposits(customer_id);
CREATE INDEX idx_deposits_deposit_date ON deposits(deposit_date);
CREATE INDEX idx_deposits_check_number ON deposits(check_number);
```

#### 2. `deposit_allocations` - Track deposit distribution (REVISED FOR ITEM-LEVEL)
```sql
CREATE TABLE deposit_allocations (
  id SERIAL PRIMARY KEY,
  deposit_id INTEGER REFERENCES deposits(id) ON DELETE CASCADE,
  job_id INTEGER REFERENCES jobs(id) NOT NULL,
  job_section_id INTEGER REFERENCES job_sections(id),
  quote_item_id INTEGER REFERENCES quote_items(id), -- NEW: Item-level allocation
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  allocation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  created_by INTEGER REFERENCES users(id) NOT NULL, -- FIXED: Made NOT NULL for audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- Ensure item belongs to the specified job
  CONSTRAINT fk_item_job CHECK (
    quote_item_id IS NULL OR
    EXISTS (SELECT 1 FROM quote_items WHERE id = quote_item_id AND job_id = deposit_allocations.job_id)
  ),
  -- ADDED: Ensure section belongs to the specified job
  CONSTRAINT fk_section_job CHECK (
    job_section_id IS NULL OR
    EXISTS (SELECT 1 FROM job_sections WHERE id = job_section_id AND job_id = deposit_allocations.job_id)
  )
);

-- Indexes for performance
CREATE INDEX idx_deposit_allocations_deposit_id ON deposit_allocations(deposit_id);
CREATE INDEX idx_deposit_allocations_job_id ON deposit_allocations(job_id);
CREATE INDEX idx_deposit_allocations_item_id ON deposit_allocations(quote_item_id);
```

#### 3. Update `jobs` table
```sql
ALTER TABLE jobs
ADD COLUMN total_deposits DECIMAL(10,2) DEFAULT 0,
ADD COLUMN balance_due DECIMAL(10,2) GENERATED ALWAYS AS (total_amount - total_deposits) STORED;
```

#### 4. Add computed unallocated amount view
```sql
-- View to get deposits with their unallocated amounts
CREATE VIEW deposits_with_balance AS
SELECT
  d.*,
  d.total_amount - COALESCE(SUM(da.amount), 0) as unallocated_amount
FROM deposits d
LEFT JOIN deposit_allocations da ON d.id = da.deposit_id
GROUP BY d.id;
```

#### 5. Create FIXED trigger to update deposit totals (handles job changes)
```sql
CREATE OR REPLACE FUNCTION update_job_deposit_totals()
RETURNS TRIGGER AS $$
DECLARE
  old_job_id INTEGER;
  new_job_id INTEGER;
BEGIN
  -- Determine which jobs need updating
  IF TG_OP = 'UPDATE' THEN
    old_job_id := OLD.job_id;
    new_job_id := NEW.job_id;
  ELSIF TG_OP = 'INSERT' THEN
    old_job_id := NULL;
    new_job_id := NEW.job_id;
  ELSIF TG_OP = 'DELETE' THEN
    old_job_id := OLD.job_id;
    new_job_id := NULL;
  END IF;

  -- Update old job if exists (CRITICAL FIX: handles job changes)
  IF old_job_id IS NOT NULL THEN
    UPDATE jobs
    SET total_deposits = (
      SELECT COALESCE(SUM(amount), 0)
      FROM deposit_allocations
      WHERE job_id = old_job_id
    )
    WHERE id = old_job_id;
  END IF;

  -- Update new job if exists and different from old
  IF new_job_id IS NOT NULL AND (old_job_id IS NULL OR new_job_id != old_job_id) THEN
    UPDATE jobs
    SET total_deposits = (
      SELECT COALESCE(SUM(amount), 0)
      FROM deposit_allocations
      WHERE job_id = new_job_id
    )
    WHERE id = new_job_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_job_deposits_trigger
AFTER INSERT OR UPDATE OR DELETE ON deposit_allocations
FOR EACH ROW EXECUTE FUNCTION update_job_deposit_totals();
```

#### 6. Add constraint to prevent over-allocation
```sql
-- Function to check allocation doesn't exceed deposit
CREATE OR REPLACE FUNCTION check_allocation_total()
RETURNS TRIGGER AS $$
DECLARE
  total_allocated DECIMAL(10,2);
  deposit_amount DECIMAL(10,2);
BEGIN
  SELECT total_amount INTO deposit_amount
  FROM deposits
  WHERE id = NEW.deposit_id;

  SELECT COALESCE(SUM(amount), 0) INTO total_allocated
  FROM deposit_allocations
  WHERE deposit_id = NEW.deposit_id
    AND id != COALESCE(NEW.id, -1); -- Exclude current row on update

  IF total_allocated + NEW.amount > deposit_amount THEN
    RAISE EXCEPTION 'Total allocations (%) would exceed deposit amount (%)',
      total_allocated + NEW.amount, deposit_amount;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_allocation_total_trigger
BEFORE INSERT OR UPDATE ON deposit_allocations
FOR EACH ROW EXECUTE FUNCTION check_allocation_total();
```

## Backend Implementation

### API Endpoints

#### Deposit Management
```typescript
// POST /api/deposits - Create new deposit record (FIXED: Item-level support)
interface CreateDepositRequest {
  customer_id: number;
  check_number?: string;
  check_date?: string;
  total_amount: number;
  notes?: string;
  initial_allocations?: {
    job_id: number;
    job_section_id?: number;     // ADDED: Section level allocation
    quote_item_id?: number;      // ADDED: Item level allocation
    amount: number;
    notes?: string;
  }[];
}

// GET /api/deposits - List all deposits with filters
interface GetDepositsQuery {
  customer_id?: number;
  start_date?: string;
  end_date?: string;
  status?: 'allocated' | 'partial' | 'unallocated';
  page?: number;
  limit?: number;
}

// GET /api/deposits/:id - Get deposit details with allocations
interface DepositDetails {
  id: number;
  customer: CustomerInfo;
  check_number: string;
  check_date: string;
  total_amount: number;
  unallocated_amount: number;
  allocations: AllocationInfo[];
}

// PUT /api/deposits/:id - Update deposit information
interface UpdateDepositRequest {
  check_number?: string;
  check_date?: string;
  notes?: string;
}

// DELETE /api/deposits/:id - Delete deposit (only if unallocated)
```

#### Allocation Management
```typescript
// POST /api/deposits/:id/allocate - Allocate deposit to jobs/items (REVISED)
interface AllocateDepositRequest {
  allocations: {
    job_id: number;
    job_section_id?: number;    // NEW: Optional section level
    quote_item_id?: number;     // NEW: Optional specific item
    amount: number;
    notes?: string;
  }[];
}

// GET /api/jobs/:id/deposits - Get all deposits for a job
interface JobDepositsResponse {
  job_id: number;
  total_deposits: number;
  deposits: {
    deposit_id: number;
    check_number: string;
    allocation_date: string;
    amount: number;
  }[];
}

// DELETE /api/deposit-allocations/:id - Remove allocation
// Returns freed amount to unallocated pool
```

### Service Layer (`backend/src/services/depositService.ts`) - WITH TRANSACTION SAFETY
```typescript
class DepositService {
  // Create new deposit with proper locking
  async createDeposit(depositData: CreateDepositData): Promise<Deposit> {
    return await db.transaction(async (trx) => {
      // Create deposit record
      const [deposit] = await trx('deposits').insert({
        customer_id: depositData.customer_id,
        check_number: depositData.check_number,
        check_date: depositData.check_date,
        total_amount: depositData.total_amount,
        notes: depositData.notes,
        created_by: depositData.user_id
      }).returning('*');

      // Process initial allocations if provided
      if (depositData.initial_allocations?.length) {
        // Map allocations with deposit_id
        const allocationsWithDepositId = depositData.initial_allocations.map(allocation => ({
          deposit_id: deposit.id,
          job_id: allocation.job_id,
          job_section_id: allocation.job_section_id,
          quote_item_id: allocation.quote_item_id,
          amount: allocation.amount,
          notes: allocation.notes,
          created_by: depositData.user_id
        }));

        await trx('deposit_allocations').insert(allocationsWithDepositId);
      }

      return deposit;
    });
  }

  // Allocate deposit with row-level locking
  async allocateDeposit(
    depositId: number,
    allocations: AllocationData[],
    userId: number  // ADDED: Pass user ID for audit trail
  ): Promise<void> {
    await db.transaction(async (trx) => {
      // 1. Lock deposit row to prevent concurrent modifications
      const deposit = await trx('deposits')
        .where('id', depositId)
        .forUpdate()
        .first();

      if (!deposit) {
        throw new Error('Deposit not found');
      }

      // 2. Calculate current allocations
      const currentAllocations = await trx('deposit_allocations')
        .where('deposit_id', depositId)
        .sum('amount as total');

      const currentTotal = currentAllocations[0]?.total || 0;
      const newTotal = allocations.reduce((sum, a) => sum + a.amount, 0);

      // 3. Validate total doesn't exceed deposit
      if (currentTotal + newTotal > deposit.total_amount) {
        throw new Error(
          `Cannot allocate $${newTotal}. Only $${deposit.total_amount - currentTotal} available.`
        );
      }

      // 4. Validate section and item ownership
      for (const allocation of allocations) {
        // Validate section belongs to job
        if (allocation.job_section_id) {
          const section = await trx('job_sections')
            .where('id', allocation.job_section_id)
            .where('job_id', allocation.job_id)
            .first();

          if (!section) {
            throw new Error(
              `Section ${allocation.job_section_id} doesn't belong to job ${allocation.job_id}`
            );
          }
        }

        // Validate item belongs to job
        if (allocation.quote_item_id) {
          const item = await trx('quote_items')
            .where('id', allocation.quote_item_id)
            .where('job_id', allocation.job_id)
            .first();

          if (!item) {
            throw new Error(
              `Item ${allocation.quote_item_id} doesn't belong to job ${allocation.job_id}`
            );
          }
        }
      }

      // 5. Insert allocations (FIXED: Add deposit_id and created_by to each allocation)
      const allocationsWithDepositId = allocations.map(allocation => ({
        deposit_id: depositId,  // CRITICAL: Must include deposit_id
        job_id: allocation.job_id,
        job_section_id: allocation.job_section_id,
        quote_item_id: allocation.quote_item_id,
        amount: allocation.amount,
        notes: allocation.notes,
        created_by: userId  // FIXED: Use userId passed to function
      }));

      await trx('deposit_allocations').insert(allocationsWithDepositId);

      // Note: Job totals updated automatically by trigger
    });
  }

  // Get deposits by customer
  async getDepositsByCustomer(customerId: number): Promise<Deposit[]> {
    // Query deposits with allocations
    // Include summary statistics
  }

  // Get deposits for a specific job
  async getDepositsByJob(jobId: number): Promise<DepositAllocation[]> {
    // Query allocations with deposit details
    // Calculate totals
  }

  // Get unallocated deposits
  async getUnallocatedDeposits(): Promise<Deposit[]> {
    // Query deposits where unallocated_amount > 0
    // Sort by date
  }

  // Remove allocation (return funds to unallocated)
  async removeAllocation(allocationId: number): Promise<void> {
    // Get allocation details
    // Update deposit unallocated amount
    // Delete allocation record
    // Update job totals
  }
}
```

## Frontend Components

### 1. Deposit Management Page (`frontend/src/pages/Deposits.tsx`)
```typescript
interface DepositsPageState {
  deposits: Deposit[];
  filters: {
    customerId?: number;
    dateRange?: [Date, Date];
    status?: 'all' | 'allocated' | 'partial' | 'unallocated';
  };
  selectedDeposit?: Deposit;
  showNewDepositModal: boolean;
  showAllocationModal: boolean;
}

// Features:
// - Sortable/filterable table of deposits
// - Quick allocation from list view
// - Bulk operations support
// - Export to CSV
```

### 2. New Deposit Modal (`frontend/src/components/deposits/NewDepositModal.tsx`)
```typescript
interface NewDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (deposit: DepositData) => Promise<void>;
  preselectedCustomer?: Customer;
}

// Features:
// - Customer search/selection
// - Display customer's open jobs
// - Split allocation interface
// - Real-time validation
// - Remaining balance indicator
```

### 3. Allocation Modal (`frontend/src/components/deposits/AllocationModal.tsx`)
```typescript
interface AllocationModalProps {
  deposit: Deposit;
  isOpen: boolean;
  onClose: () => void;
  onSave: (allocations: AllocationData[]) => Promise<void>;
}

// Features:
// - List of customer's jobs with balances
// - Allocation amount inputs
// - Auto-calculate remaining
// - Validation for over-allocation
// - Quick-fill options (full amount, split evenly)
```

### 4. Job Detail Enhancements (`frontend/src/components/jobs/JobDetail.tsx`)
```typescript
// Add to existing JobDetail component
interface JobFinancialSummary {
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  totalDeposits: number;
  balanceDue: number;
}

// New deposit section component
const JobDepositSection: React.FC<{
  jobId: number;
  deposits: DepositAllocation[];
  totalAmount: number;
  onApplyDeposit: () => void;
}> = ({ jobId, deposits, totalAmount, onApplyDeposit }) => {
  // Display deposit history
  // Show balance due prominently
  // Apply deposit button
};
```

## UI/UX Design

### Visual Hierarchy for Job Detail
```
┌─────────────────────────────────────────────┐
│ Job #0042 - Kitchen Remodel Project        │
├─────────────────────────────────────────────┤
│ Customer: ABC Company                       │
│ Status: Order | PO: 12345                  │
│                                            │
│ ┌─────────── Financial Summary ──────────┐ │
│ │                                        │ │
│ │ Subtotal:          $10,000.00         │ │
│ │ Tax (8.25%):       $   825.00         │ │
│ │ ─────────────────────────────         │ │
│ │ Total:             $10,825.00         │ │
│ │                                        │ │
│ │ Deposits Applied:  $ 3,000.00    ✓    │ │
│ │ ═══════════════════════════════       │ │
│ │ BALANCE DUE:       $ 7,825.00         │ │
│ │                                        │ │
│ │ [View Deposits] [Apply Deposit]        │ │
│ └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### Deposit Allocation Interface
```
┌──────────────────────────────────────────────┐
│ Apply Deposit to Jobs                       │
├──────────────────────────────────────────────┤
│ Customer: ABC Company                        │
│ Check #: 1234          Date: 2025-01-17     │
│ Total Amount: $5,000.00                     │
│                                              │
│ ┌──────────────────────────────────────────┐│
│ │ Select Jobs to Apply Deposit:            ││
│ │                                          ││
│ │ ☑ Job #0042 - Kitchen Remodel           ││
│ │   Total: $10,825 | Paid: $0            ││
│ │   Balance: $10,825                      ││
│ │   Apply: [$ 3,000.00        ] 🔹        ││
│ │                                          ││
│ │ ☑ Job #0043 - Bathroom Renovation       ││
│ │   Total: $5,500 | Paid: $0             ││
│ │   Balance: $5,500                       ││
│ │   Apply: [$ 2,000.00        ] 🔹        ││
│ │                                          ││
│ │ ☐ Job #0044 - Deck Addition            ││
│ │   Total: $8,000 | Paid: $2,000         ││
│ │   Balance: $6,000                       ││
│ │   Apply: [$ 0.00            ]           ││
│ └──────────────────────────────────────────┘│
│                                              │
│ Summary:                                     │
│ Total to Allocate: $5,000.00                │
│ Currently Allocated: $5,000.00 ✓            │
│ Remaining: $0.00                            │
│                                              │
│ [Cancel]              [Apply Allocations]    │
└──────────────────────────────────────────────┘
```

## Implementation Phases

### Phase 1: Database & Core Backend (3-4 days)
- [ ] Create database migration scripts
- [ ] Implement deposit service layer
- [ ] Create REST API endpoints
- [ ] Add validation and error handling
- [ ] Write unit tests for service layer

### Phase 2: Frontend Foundation (3-4 days)
- [ ] Create Deposits page with listing
- [ ] Implement New Deposit modal
- [ ] Add deposit section to Job Detail
- [ ] Create Allocation modal component
- [ ] Integrate with backend APIs

### Phase 3: Advanced Features (2-3 days)
- [ ] Add deposit history/audit trail
- [ ] Implement filtering and search
- [ ] Create deposit reports
- [ ] Add email notifications
- [ ] Generate deposit receipts (PDF)

### Phase 4: Testing & Refinement (2-3 days)
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] UI/UX improvements
- [ ] Documentation
- [ ] User training materials

## Security & Validation

### Access Control
```typescript
enum DepositPermission {
  VIEW_ALL_DEPOSITS = 'deposits.view.all',
  VIEW_OWN_DEPOSITS = 'deposits.view.own',
  CREATE_DEPOSIT = 'deposits.create',
  EDIT_DEPOSIT = 'deposits.edit',
  DELETE_DEPOSIT = 'deposits.delete',
  ALLOCATE_DEPOSIT = 'deposits.allocate'
}

// Role mappings
const rolePermissions = {
  admin: [ALL_PERMISSIONS],
  manager: [VIEW_ALL, CREATE, EDIT, ALLOCATE],
  salesperson: [VIEW_OWN, CREATE],
  viewer: [VIEW_ALL]
};
```

### Validation Rules
1. **Deposit Creation**
   - Amount must be positive
   - Customer must exist
   - Check number unique per customer

2. **Allocation**
   - Cannot allocate more than deposit amount
   - Cannot allocate to cancelled jobs
   - Job must belong to deposit's customer

3. **Deletion**
   - Can only delete if fully unallocated
   - Requires manager approval
   - Maintains audit trail

## Reporting Capabilities

### Standard Reports
1. **Deposit Summary Report**
   - By date range
   - By customer
   - By status

2. **Outstanding Balances**
   - All jobs with balances
   - Aged receivables
   - Payment projections

3. **Cash Flow Analysis**
   - Deposits by month
   - Trending analysis
   - Forecast modeling

4. **Audit Trail Report**
   - All deposit transactions
   - User actions
   - Timestamp tracking

## API Response Examples

### Get Job with Deposits
```json
{
  "job": {
    "id": 42,
    "job_name": "Kitchen Remodel",
    "customer_id": 15,
    "status": "order",
    "subtotal": 10000.00,
    "tax_amount": 825.00,
    "total_amount": 10825.00,
    "total_deposits": 3000.00,
    "balance_due": 7825.00,
    "deposits": [
      {
        "deposit_id": 101,
        "check_number": "1234",
        "check_date": "2025-01-15",
        "allocation_date": "2025-01-16",
        "amount": 3000.00
      }
    ]
  }
}
```

### Create Deposit with Allocations
```json
{
  "customer_id": 15,
  "check_number": "5678",
  "check_date": "2025-01-17",
  "total_amount": 5000.00,
  "notes": "Initial deposit for Q1 projects",
  "initial_allocations": [
    {
      "job_id": 42,
      "amount": 3000.00
    },
    {
      "job_id": 43,
      "amount": 2000.00
    }
  ]
}
```

## Error Handling

### Common Error Scenarios
1. **Insufficient Funds**
   - Message: "Cannot allocate $X. Only $Y remains unallocated."
   - Code: `INSUFFICIENT_DEPOSIT_FUNDS`

2. **Invalid Job**
   - Message: "Job #X not found or does not belong to customer."
   - Code: `INVALID_JOB_ALLOCATION`

3. **Over-allocation**
   - Message: "Total allocations exceed deposit amount."
   - Code: `OVER_ALLOCATION`

4. **Duplicate Check**
   - Message: "Check #X already exists for this customer."
   - Code: `DUPLICATE_CHECK_NUMBER`

## Future Enhancements

### Version 2.0
1. **Multiple Payment Methods**
   - Credit card processing
   - ACH transfers
   - Wire transfers
   - Online payments

2. **Automated Features**
   - Auto-allocation rules
   - Payment reminders
   - Late fee calculation
   - Payment plans

3. **Integration Capabilities**
   - QuickBooks sync
   - Banking API integration
   - Stripe/PayPal integration
   - Customer portal

4. **Advanced Reporting**
   - Custom report builder
   - Scheduled reports
   - Dashboard widgets
   - Mobile app support

## Success Metrics

### Key Performance Indicators
- **Efficiency**: 75% reduction in deposit processing time
- **Accuracy**: Zero allocation errors
- **Visibility**: Real-time balance updates
- **Audit**: 100% transaction traceability
- **User Satisfaction**: 90% approval rating

### Measurement Methods
1. Time tracking for deposit operations
2. Error rate monitoring
3. User feedback surveys
4. System performance metrics
5. Adoption rate tracking

## Conclusion

This deposit management system will provide CraftMart with a robust, scalable solution for handling customer deposits across multiple jobs. The implementation focuses on accuracy, transparency, and ease of use while maintaining a complete audit trail for all financial transactions.

The phased approach ensures minimal disruption to current operations while delivering immediate value through core functionality, with advanced features following in subsequent releases.