import type { PoolClient } from 'pg';
import pool from '../config/database';

export type PaymentMethod =
  | 'check'
  | 'cash'
  | 'credit_card'
  | 'ach'
  | 'wire'
  | 'other';

export interface AllocationInput {
  jobId: number;
  jobItemId: number;
  amount: number;
  notes?: string;
}

export interface CreateDepositInput {
  customerId: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  paymentDate?: string;
  depositDate?: string;
  totalAmount: number;
  notes?: string;
  userId: number;
  initialAllocations?: AllocationInput[];
}

export interface DepositSummary {
  id: number;
  customerId: number;
  paymentMethod: PaymentMethod;
  referenceNumber: string | null;
  paymentDate: string | null;
  totalAmount: number;
  depositDate: string;
  notes: string | null;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
  unallocatedAmount: number;
  allocations: AllocationRecord[];
}

export interface AllocationRecord {
  id: number;
  depositId: number;
  jobId: number;
  jobItemId: number;
  jobItemTitle: string | null;
  amount: number;
  allocationDate: string;
  notes: string | null;
  createdBy: number;
  createdAt: string;
}

export type DepositStatus = 'unallocated' | 'partial' | 'allocated';

export interface DepositListItem extends Omit<DepositSummary, 'allocations'> {
  allocatedAmount: number;
  status: DepositStatus;
}

export interface GetDepositsOptions {
  customerId?: number;
  paymentMethod?: PaymentMethod;
  status?: DepositStatus;
  limit?: number;
  offset?: number;
}

export interface AllocateDepositInput {
  depositId: number;
  allocations: AllocationInput[];
  userId: number;
}

export interface RemoveAllocationResult {
  depositId: number;
}

export interface CustomerJobSummary {
  jobId: number;
  jobName: string;
  status: string | null;
  totalAmount: number;
  totalDeposits: number;
  balanceDue: number;
}

export interface JobItemSummary {
  id: number;
  jobId: number;
  title: string;
  status: string | null;
  description: string | null;
  totalAmount: number;
  allocatedAmount: number;
  balanceDue: number;
}

interface JobItemColumnState {
  title: boolean;
  status: boolean;
  description: boolean;
  totalAmount: boolean;
  createdAt: boolean;
}

export const SUPPORTED_PAYMENT_METHODS: PaymentMethod[] = [
  'check',
  'cash',
  'credit_card',
  'ach',
  'wire',
  'other'
];

export class DepositServiceError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    if (code !== undefined) {
      this.code = code;
    }
  }
}

interface DepositRow {
  id: number;
  customer_id: number;
  payment_method: PaymentMethod;
  reference_number: string | null;
  payment_date: string | null;
  total_amount: string;
  deposit_date: string;
  notes: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  unallocated_amount?: string;
}

interface AllocationRow {
  id: number;
  deposit_id: number;
  job_id: number;
  job_item_id: number;
  job_item_title: string | null;
  amount: string;
  allocation_date: string;
  notes: string | null;
  created_by: number;
  created_at: string;
}

interface SchemaState {
  hasDepositsTable: boolean;
  hasAllocationsTable: boolean;
  hasView: boolean;
  hasJobItemColumn: boolean;
  ready: boolean;
}

interface JobColumnState {
  name: boolean;
  title: boolean;
  status: boolean;
  totalAmount: boolean;
  totalDeposits: boolean;
  balanceDue: boolean;
  updatedAt: boolean;
  createdAt: boolean;
}

const normalizePaymentMethod = (method: string): PaymentMethod => {
  if ((SUPPORTED_PAYMENT_METHODS as string[]).includes(method)) {
    return method as PaymentMethod;
  }
  throw new DepositServiceError(400, `Unsupported payment method: ${method}`);
};

const getSchemaState = async (client?: PoolClient): Promise<SchemaState> => {
  const runner = client ?? pool;
  const result = await runner.query(
    `SELECT
       to_regclass('public.deposits') AS deposits,
       to_regclass('public.deposit_allocations') AS allocations,
       to_regclass('public.deposits_with_balance') AS view
     `
  );

  const row = result.rows[0] ?? {};
  const hasDepositsTable = Boolean(row.deposits);
  const hasAllocationsTable = Boolean(row.allocations);
  const hasView = Boolean(row.view);

  const columnResult = await runner.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_name = 'deposit_allocations' AND column_name = 'job_item_id'`
  );

  const hasJobItemColumn = columnResult.rows.length > 0;

  return {
    hasDepositsTable,
    hasAllocationsTable,
    hasView,
    hasJobItemColumn,
    ready: hasDepositsTable && hasAllocationsTable && hasView && hasJobItemColumn
  };
};

const ensureSchemaReady = async (client?: PoolClient) => {
  const state = await getSchemaState(client);
  if (!state.ready) {
    const missing = [];
    if (!state.hasDepositsTable) missing.push('deposits table');
    if (!state.hasAllocationsTable) missing.push('deposit_allocations table');
    if (!state.hasView) missing.push('deposits_with_balance view');
    if (!state.hasJobItemColumn) missing.push('deposit_allocations.job_item_id column');

    throw new DepositServiceError(
      503,
      `Deposit tables are not initialized (${missing.join(', ')} missing). Run the latest database migrations to enable deposit tracking.`,
      'DEPOSITS_NOT_READY'
    );
  }
};

const getJobColumnState = async (client?: PoolClient): Promise<JobColumnState> => {
  const runner = client ?? pool;
  const result = await runner.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_name = 'jobs' AND column_name = ANY($1)`,
    [[
      'name',
      'title',
      'status',
      'total_amount',
      'total_deposits',
      'balance_due',
      'updated_at',
      'created_at'
    ]]
  );

  const columns = result.rows.map((row) => row.column_name as string);
  const has = (column: string) => columns.includes(column);

  return {
    name: has('name'),
    title: has('title'),
    status: has('status'),
    totalAmount: has('total_amount'),
    totalDeposits: has('total_deposits'),
    balanceDue: has('balance_due'),
    updatedAt: has('updated_at'),
    createdAt: has('created_at')
  };
};

const getJobItemColumnState = async (client?: PoolClient): Promise<JobItemColumnState> => {
  const runner = client ?? pool;
  const result = await runner.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_name = 'job_items' AND column_name = ANY($1)`,
    [[
      'title',
      'status',
      'description',
      'total_amount',
      'created_at'
    ]]
  );

  const columns = result.rows.map((row) => row.column_name as string);
  const has = (column: string) => columns.includes(column);

  return {
    title: has('title'),
    status: has('status'),
    description: has('description'),
    totalAmount: has('total_amount'),
    createdAt: has('created_at')
  };
};

const mapDepositRow = (row: DepositRow): DepositSummary => ({
  id: row.id,
  customerId: row.customer_id,
  paymentMethod: row.payment_method,
  referenceNumber: row.reference_number,
  paymentDate: row.payment_date,
  totalAmount: Number(row.total_amount),
  depositDate: row.deposit_date,
  notes: row.notes,
  createdBy: row.created_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  unallocatedAmount: Number(row.unallocated_amount ?? 0),
  allocations: []
});

const mapAllocationRow = (row: AllocationRow): AllocationRecord => ({
  id: row.id,
  depositId: row.deposit_id,
  jobId: row.job_id,
  jobItemId: row.job_item_id,
  jobItemTitle: row.job_item_title,
  amount: Number(row.amount),
  allocationDate: row.allocation_date,
  notes: row.notes,
  createdBy: row.created_by,
  createdAt: row.created_at
});

const MONEY_EPSILON = 0.005;

const validateAllocations = async (
  client: PoolClient,
  customerId: number,
  allocations: AllocationInput[],
  maxAllocationAmount: number
) => {
  // Basic amount validation and aggregate requested total
  let allocationTotal = 0;
  for (const allocation of allocations) {
    if (allocation.amount <= 0) {
      throw new DepositServiceError(400, 'Allocation amount must be greater than zero');
    }
    allocationTotal += allocation.amount;
  }

  // Ensure the total requested does not exceed the available amount on the deposit
  if (allocationTotal > maxAllocationAmount + MONEY_EPSILON) {
    throw new DepositServiceError(
      400,
      `Cannot allocate ${allocationTotal.toFixed(2)}. Total exceeds available amount ${maxAllocationAmount.toFixed(2)}`,
      'OVER_ALLOCATION'
    );
  }

  // Build per-item aggregates for validation (handles duplicate entries for same item within one request)
  const byItem = new Map<number, { jobId: number; requested: number }>();
  for (const a of allocations) {
    const entry = byItem.get(a.jobItemId) ?? { jobId: a.jobId, requested: 0 };
    entry.requested += a.amount;
    byItem.set(a.jobItemId, entry);
  }

  const jobItemIds = Array.from(byItem.keys());
  if (jobItemIds.length === 0) return;

  // Lock the referenced job items for share to reduce race conditions
  // Also pull customer_id, job_id, and total_amount (if the column exists)
  const columnState = await getJobItemColumnState(client);

  const selectTotalAmount = columnState.totalAmount ? 'ji.total_amount' : 'NULL::numeric';

  const { rows } = await client.query(
    `WITH alloc AS (
       SELECT job_item_id, COALESCE(SUM(amount), 0) AS allocated
       FROM deposit_allocations
       WHERE job_item_id = ANY($1)
       GROUP BY job_item_id
     )
     SELECT ji.id,
            ji.job_id,
            ji.customer_id,
            ${selectTotalAmount} AS total_amount,
            COALESCE(a.allocated, 0) AS allocated
     FROM job_items ji
     LEFT JOIN alloc a ON a.job_item_id = ji.id
     WHERE ji.id = ANY($1)
     FOR SHARE`,
    [jobItemIds]
  );

  // Build lookup for fetched items
  interface ItemRow {
    id: number;
    job_id: number;
    customer_id: number;
    total_amount: string | null;
    allocated: string | null;
  }
  const itemsById = new Map<number, ItemRow>();
  for (const r of rows as ItemRow[]) {
    itemsById.set(r.id, r);
  }

  // Validate each requested item exists and belongs to the right job/customer
  for (const [jobItemId, { jobId, requested }] of byItem.entries()) {
    const row = itemsById.get(jobItemId);
    if (!row) {
      throw new DepositServiceError(400, `Job item ${jobItemId} not found`, 'INVALID_JOB_ITEM');
    }

    if (row.job_id !== jobId) {
      throw new DepositServiceError(400, `Job item ${jobItemId} does not belong to job ${jobId}`, 'INVALID_JOB_ITEM');
    }

    if (row.customer_id !== customerId) {
      throw new DepositServiceError(400, `Job item ${jobItemId} does not belong to the specified customer`, 'INVALID_JOB_ITEM');
    }

    // Per-item cap: only enforce if job_items.total_amount exists and is > 0
    if (columnState.totalAmount) {
      const itemTotal = Number(row.total_amount ?? 0);
      if (itemTotal > 0) {
        const alreadyAllocated = Number(row.allocated ?? 0);
        if (alreadyAllocated + requested > itemTotal + MONEY_EPSILON) {
          const remaining = Math.max(itemTotal - alreadyAllocated, 0).toFixed(2);
          throw new DepositServiceError(
            400,
            `Cannot allocate ${requested.toFixed(2)} to item ${jobItemId}. Remaining balance is ${remaining}.`,
            'OVER_ALLOCATION'
          );
        }
      }
    }
  }
};

export const createDeposit = async (input: CreateDepositInput): Promise<DepositSummary> => {
  if (!input.totalAmount || input.totalAmount <= 0) {
    throw new DepositServiceError(400, 'Deposit amount must be greater than zero');
  }

  const paymentMethod = normalizePaymentMethod(input.paymentMethod);
  const referenceNumber = input.referenceNumber?.trim() || null;
  const paymentDate = input.paymentDate ?? null;
  const depositDate = input.depositDate ?? null;
  const notes = input.notes ?? null;

  const client = await pool.connect();

  try {
    await ensureSchemaReady(client);

    await client.query('BEGIN');

    if (input.initialAllocations && input.initialAllocations.length > 0) {
      await validateAllocations(client, input.customerId, input.initialAllocations, input.totalAmount);
    }

    const depositResult = await client.query(
      `INSERT INTO deposits (
         customer_id,
         payment_method,
         reference_number,
         payment_date,
         total_amount,
         deposit_date,
         notes,
         created_by
       ) VALUES ($1, $2, $3, $4, $5, COALESCE($6, CURRENT_TIMESTAMP), $7, $8)
       RETURNING id`,
      [
        input.customerId,
        paymentMethod,
        referenceNumber,
        paymentDate,
        input.totalAmount,
        depositDate,
        notes,
        input.userId
      ]
    );

    const depositId: number = depositResult.rows[0].id;

    if (input.initialAllocations && input.initialAllocations.length > 0) {
      const allocationInserts = input.initialAllocations.map((allocation) => [
        depositId,
        allocation.jobId,
        allocation.jobItemId,
        allocation.amount,
        allocation.notes ?? null,
        input.userId
      ]);

      const insertValues = allocationInserts
        .map((_, index) => {
          const offset = index * 6;
          return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`;
        })
        .join(', ');

      const flatValues = allocationInserts.flat();

      await client.query(
        `INSERT INTO deposit_allocations (
           deposit_id,
           job_id,
           job_item_id,
           amount,
           notes,
           created_by
         ) VALUES ${insertValues}`,
        flatValues
      );
    }

    const depositRowResult = await client.query(
      'SELECT * FROM deposits_with_balance WHERE id = $1',
      [depositId]
    );

    if (depositRowResult.rows.length === 0) {
      throw new DepositServiceError(500, 'Failed to load newly created deposit');
    }

    const deposit = mapDepositRow(depositRowResult.rows[0]);

    const allocationsResult = await client.query(
      `SELECT da.id,
              da.deposit_id,
              da.job_id,
              da.job_item_id,
              ji.title AS job_item_title,
              da.amount,
              da.allocation_date,
              da.notes,
              da.created_by,
              da.created_at
       FROM deposit_allocations da
       LEFT JOIN job_items ji ON ji.id = da.job_item_id
       WHERE da.deposit_id = $1
       ORDER BY da.created_at ASC`,
      [depositId]
    );

    deposit.allocations = allocationsResult.rows.map(mapAllocationRow);

    await client.query('COMMIT');

    return deposit;
  } catch (error: any) {
    await client.query('ROLLBACK');

    if (error.code === '23505') {
      throw new DepositServiceError(409, 'Duplicate reference number for this customer', 'DUPLICATE_REFERENCE');
    }

    if (error.code === '23514') {
      // Preserve the underlying database message for clarity (may be deposit-level or item-level cap)
      throw new DepositServiceError(400, String(error.message || 'Total allocations exceed allowed amount'), 'OVER_ALLOCATION');
    }

    if (error.code === '23503') {
      throw new DepositServiceError(400, 'Referenced record not found for deposit allocation', 'INVALID_REFERENCE');
    }

    if (error instanceof DepositServiceError) {
      throw error;
    }

    throw error;
  } finally {
    client.release();
  }
};

const determineStatus = (totalAmount: number, unallocatedAmount: number): DepositStatus => {
  if (Math.abs(unallocatedAmount - totalAmount) < MONEY_EPSILON) {
    return 'unallocated';
  }

  if (Math.abs(unallocatedAmount) < MONEY_EPSILON) {
    return 'allocated';
  }

  return 'partial';
};

export const getDeposits = async (options: GetDepositsOptions = {}): Promise<DepositListItem[]> => {
  const schemaState = await getSchemaState();
  if (!schemaState.ready) {
    throw new DepositServiceError(
      503,
      'Deposit tables are not initialized. Run the latest database migrations to enable deposit tracking.',
      'DEPOSITS_NOT_READY'
    );
  }

  const conditions: string[] = [];
  const params: Array<string | number> = [];

  if (options.customerId) {
    params.push(options.customerId);
    conditions.push(`customer_id = $${params.length}`);
  }

  if (options.paymentMethod) {
    params.push(options.paymentMethod);
    conditions.push(`payment_method = $${params.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  let limitClause = '';
  if (options.limit && options.limit > 0) {
    params.push(options.limit);
    limitClause += ` LIMIT $${params.length}`;
  }

  if (options.offset && options.offset > 0) {
    params.push(options.offset);
    limitClause += ` OFFSET $${params.length}`;
  }

  const result = await pool.query(
    `SELECT * FROM deposits_with_balance ${whereClause} ORDER BY deposit_date DESC${limitClause}`,
    params
  );

  const deposits = result.rows.map((row) => {
    const deposit = mapDepositRow(row as DepositRow);
    const allocatedAmount = Number((deposit.totalAmount - deposit.unallocatedAmount).toFixed(2));
    const { allocations: _ignored, ...summary } = deposit;

    const listItem: DepositListItem = {
      ...summary,
      allocatedAmount,
      status: determineStatus(deposit.totalAmount, deposit.unallocatedAmount)
    };

    return listItem;
  });

  if (options.status) {
    return deposits.filter((deposit) => deposit.status === options.status);
  }

  return deposits;
};

export const getDepositById = async (depositId: number): Promise<DepositSummary> => {
  await ensureSchemaReady();

  const result = await pool.query('SELECT * FROM deposits_with_balance WHERE id = $1', [depositId]);

  if (result.rows.length === 0) {
    throw new DepositServiceError(404, `Deposit ${depositId} not found`);
  }

  const deposit = mapDepositRow(result.rows[0] as DepositRow);

  const allocationsResult = await pool.query(
    `SELECT da.id,
            da.deposit_id,
            da.job_id,
            da.job_item_id,
            ji.title AS job_item_title,
            da.amount,
            da.allocation_date,
            da.notes,
            da.created_by,
            da.created_at
     FROM deposit_allocations da
     LEFT JOIN job_items ji ON ji.id = da.job_item_id
     WHERE da.deposit_id = $1
     ORDER BY da.allocation_date ASC, da.id ASC`,
    [depositId]
  );

  deposit.allocations = allocationsResult.rows.map(mapAllocationRow);

  return deposit;
};

export const allocateDeposit = async ({
  depositId,
  allocations,
  userId
}: AllocateDepositInput): Promise<DepositSummary> => {
  if (!allocations.length) {
    throw new DepositServiceError(400, 'At least one allocation is required');
  }

  const client = await pool.connect();

  try {
    await ensureSchemaReady(client);

    await client.query('BEGIN');

    const depositResult = await client.query(
      `SELECT id, customer_id, total_amount
       FROM deposits
       WHERE id = $1
       FOR UPDATE`,
      [depositId]
    );

    if (depositResult.rows.length === 0) {
      throw new DepositServiceError(404, `Deposit ${depositId} not found`);
    }

    const depositRow = depositResult.rows[0];
    const totalAmount = Number(depositRow.total_amount);

    const currentAllocationsResult = await client.query(
      'SELECT COALESCE(SUM(amount), 0) AS allocated FROM deposit_allocations WHERE deposit_id = $1',
      [depositId]
    );

    const allocatedAmount = Number(currentAllocationsResult.rows[0].allocated);
    const remainingAmount = Number((totalAmount - allocatedAmount).toFixed(2));

    if (remainingAmount <= 0) {
      throw new DepositServiceError(400, 'Deposit has no remaining balance to allocate', 'OVER_ALLOCATION');
    }

    await validateAllocations(client, depositRow.customer_id, allocations, remainingAmount);

    const allocationInserts = allocations.map((allocation) => [
      depositId,
      allocation.jobId,
      allocation.jobItemId,
      allocation.amount,
      allocation.notes ?? null,
      userId
    ]);

    const insertValues = allocationInserts
      .map((_, index) => {
        const offset = index * 6;
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`;
      })
      .join(', ');

    await client.query(
      `INSERT INTO deposit_allocations (
         deposit_id,
         job_id,
         job_item_id,
         amount,
         notes,
         created_by
       ) VALUES ${insertValues}`,
      allocationInserts.flat()
    );

    await client.query('COMMIT');

    return getDepositById(depositId);
  } catch (error: any) {
    await client.query('ROLLBACK');

    if (error instanceof DepositServiceError) {
      throw error;
    }

    if (error.code === '23514') {
      // Preserve item/deposit cap violation message
      throw new DepositServiceError(400, String(error.message || 'Total allocations exceed allowed amount'), 'OVER_ALLOCATION');
    }

    if (error.code === '23503') {
      throw new DepositServiceError(400, 'Referenced record not found for deposit allocation', 'INVALID_REFERENCE');
    }

    throw error;
  } finally {
    client.release();
  }
};

export const removeAllocation = async (allocationId: number): Promise<RemoveAllocationResult> => {
  const client = await pool.connect();

  try {
    await ensureSchemaReady(client);

    await client.query('BEGIN');

    const allocationResult = await client.query(
      `SELECT deposit_id
       FROM deposit_allocations
       WHERE id = $1
       FOR UPDATE`,
      [allocationId]
    );

    if (allocationResult.rows.length === 0) {
      throw new DepositServiceError(404, `Allocation ${allocationId} not found`);
    }

    const depositId = allocationResult.rows[0].deposit_id as number;

    await client.query('DELETE FROM deposit_allocations WHERE id = $1', [allocationId]);

    await client.query('COMMIT');

    return { depositId };
  } catch (error) {
    await client.query('ROLLBACK');

    if (error instanceof DepositServiceError) {
      throw error;
    }

    throw error;
  } finally {
    client.release();
  }
};

export const getCustomerJobs = async (customerId: number): Promise<CustomerJobSummary[]> => {
  await ensureSchemaReady();

  const columnState = await getJobColumnState();
  const jobItemState = await getJobItemColumnState();

  const jobNameExpr = columnState.name
    ? "COALESCE(j.name, 'Job ' || j.id::text)"
    : columnState.title
      ? "COALESCE(j.title, 'Job ' || j.id::text)"
      : "'Job ' || j.id::text";

  const hasInvoiceExpr = jobItemState.status ? "BOOL_OR(ji.status = 'invoice')" : 'FALSE';
  const hasOrderExpr = jobItemState.status ? "BOOL_OR(ji.status = 'order')" : 'FALSE';
  const hasQuoteExpr = jobItemState.status ? "BOOL_OR(ji.status = 'quote')" : 'FALSE';
  const totalAmountExpr = jobItemState.totalAmount ? 'COALESCE(SUM(ji.total_amount), 0)' : '0::numeric';

  const orderPieces = [];
  if (columnState.updatedAt) {
    orderPieces.push('j.updated_at DESC NULLS LAST');
  }
  if (columnState.createdAt) {
    orderPieces.push('j.created_at DESC NULLS LAST');
  }
  orderPieces.push('j.id DESC');
  const orderClause = orderPieces.join(', ');

  const result = await pool.query(
    `WITH job_item_totals AS (
       SELECT
         ji.job_id,
         ${totalAmountExpr} AS total_amount,
         ${hasInvoiceExpr} AS has_invoice,
         ${hasOrderExpr} AS has_order,
         ${hasQuoteExpr} AS has_quote
       FROM job_items ji
       GROUP BY ji.job_id
     ),
     deposit_totals AS (
       SELECT
         da.job_id,
         COALESCE(SUM(da.amount), 0) AS total_deposits
       FROM deposit_allocations da
       GROUP BY da.job_id
     )
     SELECT
       j.id,
       ${jobNameExpr} AS job_name,
       CASE
         WHEN jit.has_invoice THEN 'invoice'
         WHEN jit.has_order THEN 'order'
         WHEN jit.has_quote THEN 'quote'
         ELSE NULL
       END AS status,
       COALESCE(jit.total_amount, 0) AS total_amount,
       COALESCE(dt.total_deposits, 0) AS total_deposits,
       COALESCE(jit.total_amount, 0) - COALESCE(dt.total_deposits, 0) AS balance_due
     FROM jobs j
     LEFT JOIN job_item_totals jit ON jit.job_id = j.id
     LEFT JOIN deposit_totals dt ON dt.job_id = j.id
     WHERE j.customer_id = $1
     ORDER BY ${orderClause}`,
    [customerId]
  );

  return result.rows.map((row) => ({
    jobId: row.id,
    jobName: row.job_name,
    status: row.status ?? null,
    totalAmount: Number(row.total_amount ?? 0),
    totalDeposits: Number(row.total_deposits ?? 0),
    balanceDue: Number(row.balance_due ?? 0)
  }));
};

export const getJobItems = async (jobId: number): Promise<JobItemSummary[]> => {
  await ensureSchemaReady();

  const { rows: jobCheckRows } = await pool.query('SELECT id FROM jobs WHERE id = $1', [jobId]);
  if (jobCheckRows.length === 0) {
    throw new DepositServiceError(404, `Job ${jobId} not found`);
  }

  const columnState = await getJobItemColumnState();

  const titleExpr = columnState.title
    ? "COALESCE(ji.title, 'Job Item ' || ji.id::text)"
    : "'Job Item ' || ji.id::text";
  const statusExpr = columnState.status ? 'ji.status' : 'NULL::text';
  const descriptionExpr = columnState.description ? 'ji.description' : 'NULL::text';
  const totalAmountExpr = columnState.totalAmount ? 'COALESCE(ji.total_amount, 0)' : '0::numeric';
  const orderExpr = columnState.createdAt ? 'ji.created_at DESC, ji.id DESC' : 'ji.id DESC';

  const result = await pool.query(
    `WITH allocation_totals AS (
       SELECT job_item_id, SUM(amount) AS allocated
       FROM deposit_allocations
       GROUP BY job_item_id
     )
     SELECT ji.id,
            ji.job_id,
            ${titleExpr} AS title,
            ${statusExpr} AS status,
            ${descriptionExpr} AS description,
            ${totalAmountExpr} AS total_amount,
            COALESCE(at.allocated, 0) AS allocated_amount
     FROM job_items ji
     LEFT JOIN allocation_totals at ON at.job_item_id = ji.id
     WHERE ji.job_id = $1
     ORDER BY ${orderExpr}`,
    [jobId]
  );

  return result.rows.map((row) => {
    const total = Number(row.total_amount ?? 0);
    const allocated = Number(row.allocated_amount ?? 0);
    const balance = Number((total - allocated).toFixed(2));

    return {
      id: row.id,
      jobId: row.job_id,
      title: row.title,
      status: row.status ?? null,
      description: row.description ?? null,
      totalAmount: total,
      allocatedAmount: allocated,
      balanceDue: balance
    } satisfies JobItemSummary;
  });
};
