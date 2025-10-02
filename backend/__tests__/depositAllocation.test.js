const path = require('path');

// Resolve compiled module IDs used by the service under test
const databaseModuleId = path.resolve(__dirname, '../dist/config/database.js');
const serviceModuleId = path.resolve(__dirname, '../dist/services/depositService.js');

// Helper to create a mock client with programmable responses based on SQL
const createMockClient = (handlers = {}) => {
  const query = jest.fn(async (sql, params) => {
    // Allow test to intercept by substring keys
    for (const key of Object.keys(handlers)) {
      if (sql.includes(key)) {
        const res = handlers[key];
        if (typeof res === 'function') return res(sql, params);
        return res;
      }
    }
    // Default fallbacks for common statements
    if (/^BEGIN/i.test(sql) || /^COMMIT/i.test(sql) || /^ROLLBACK/i.test(sql)) {
      return { rows: [] };
    }
    // Default: empty result
    return { rows: [] };
  });

  return {
    query,
    release: jest.fn()
  };
};

describe('allocateDeposit per-item cap validation', () => {
  let poolMock;

  beforeEach(() => {
    jest.resetModules();

    // Fresh client per test
    const client = createMockClient();
    poolMock = {
      connect: jest.fn(async () => client),
      query: jest.fn()
    };

    // Mock the compiled database module default export
    jest.doMock(databaseModuleId, () => ({ __esModule: true, default: poolMock }));
  });

  test('createDeposit with initial allocations returns detail with allocations', async () => {
    const client = await poolMock.connect();

    client.query.mockImplementation(async (sql, params) => {
      // Schema ready
      if (sql.includes("to_regclass('public.deposits')")) {
        return { rows: [{ deposits: 'deposits', allocations: 'deposit_allocations', view: 'deposits_with_balance' }] };
      }
      if (sql.includes("information_schema.columns") && sql.includes("deposit_allocations") && sql.includes("job_item_id")) {
        return { rows: [{ column_name: 'job_item_id' }] };
      }
      if (sql.startsWith('BEGIN') || sql.startsWith('COMMIT') || sql.startsWith('ROLLBACK')) {
        return { rows: [] };
      }
      // validateAllocations: job_items columns
      if (sql.includes("information_schema.columns") && sql.includes("table_name = 'job_items'")) {
        return { rows: [ { column_name: 'total_amount' } ] };
      }
      // validateAllocations: fetch items
      if (sql.includes('WITH alloc AS') && sql.includes('FROM job_items ji')) {
        // Two items: remaining 700 each (total 1000, allocated 300)
        return { rows: [
          { id: 101, job_id: 70, customer_id: 400, total_amount: '1000.00', allocated: '300.00' },
          { id: 102, job_id: 70, customer_id: 400, total_amount: '1000.00', allocated: '300.00' }
        ] };
      }
      // Insert deposit
      if (sql.includes('INSERT INTO deposits') && sql.includes('RETURNING id')) {
        return { rows: [{ id: 20 }] };
      }
      // Insert allocations
      if (sql.includes('INSERT INTO deposit_allocations')) {
        return { rows: [] };
      }
      // Load deposit via view
      if (sql.includes('SELECT * FROM deposits_with_balance WHERE id =')) {
        return { rows: [
          {
            id: 20,
            customer_id: 400,
            payment_method: 'check',
            reference_number: null,
            payment_date: '2025-01-01',
            total_amount: '1000.00',
            deposit_date: '2025-01-02T00:00:00Z',
            notes: null,
            created_by: 9,
            created_at: '2025-01-02T00:00:00Z',
            updated_at: '2025-01-02T00:00:00Z',
            unallocated_amount: '600.00' // allocated 400 in initial allocations
          }
        ] };
      }
      // Load allocations for the new deposit
      if (sql.includes('FROM deposit_allocations da') && sql.includes('LEFT JOIN job_items ji')) {
        return { rows: [
          { id: 201, deposit_id: 20, job_id: 70, job_item_id: 101, job_item_title: 'Item 101', amount: '250.00', allocation_date: '2025-01-02T00:00:00Z', notes: null, created_by: 9, created_at: '2025-01-02T00:00:00Z' },
          { id: 202, deposit_id: 20, job_id: 70, job_item_id: 102, job_item_title: 'Item 102', amount: '150.00', allocation_date: '2025-01-02T00:00:00Z', notes: null, created_by: 9, created_at: '2025-01-02T00:00:00Z' }
        ] };
      }
      return { rows: [] };
    });

    const { createDeposit } = require(serviceModuleId);

    const result = await createDeposit({
      customerId: 400,
      paymentMethod: 'check',
      totalAmount: 1000,
      userId: 9,
      initialAllocations: [
        { jobId: 70, jobItemId: 101, amount: 250 },
        { jobId: 70, jobItemId: 102, amount: 150 }
      ]
    });

    expect(result).toMatchObject({ id: 20, customerId: 400, unallocatedAmount: 600 });
    expect(result.allocations).toHaveLength(2);
    expect(result.allocations[0]).toMatchObject({ jobId: 70, jobItemId: 101, amount: 250 });
    expect(result.allocations[1]).toMatchObject({ jobId: 70, jobItemId: 102, amount: 150 });
  });

  test('allocateDeposit succeeds for multiple items within caps', async () => {
    const client = await poolMock.connect();

    client.query.mockImplementation(async (sql, params) => {
      if (sql.includes("to_regclass('public.deposits')")) {
        return { rows: [{ deposits: 'deposits', allocations: 'deposit_allocations', view: 'deposits_with_balance' }] };
      }
      if (sql.includes("information_schema.columns") && sql.includes("deposit_allocations") && sql.includes("job_item_id")) {
        return { rows: [{ column_name: 'job_item_id' }] };
      }
      if (sql.startsWith('BEGIN') || sql.startsWith('COMMIT') || sql.startsWith('ROLLBACK')) {
        return { rows: [] };
      }
      if (sql.includes('FROM deposits') && sql.includes('FOR UPDATE')) {
        return { rows: [{ id: 33, customer_id: 500, total_amount: 1200 }] };
      }
      if (sql.includes('SELECT COALESCE(SUM(amount), 0) AS allocated FROM deposit_allocations WHERE deposit_id')) {
        return { rows: [{ allocated: 100 }] }; // remaining 1100
      }
      if (sql.includes("information_schema.columns") && sql.includes("table_name = 'job_items'")) {
        return { rows: [ { column_name: 'total_amount' } ] };
      }
      if (sql.includes('WITH alloc AS') && sql.includes('FROM job_items ji')) {
        return { rows: [
          { id: 301, job_id: 80, customer_id: 500, total_amount: '1000.00', allocated: '100.00' },
          { id: 302, job_id: 80, customer_id: 500, total_amount: '1000.00', allocated: '100.00' }
        ] };
      }
      if (sql.includes('INSERT INTO deposit_allocations')) {
        return { rows: [] };
      }
      return { rows: [] };
    });

    poolMock.query.mockImplementation(async (sql, params) => {
      if (sql.includes('SELECT * FROM deposits_with_balance WHERE id =')) {
        return { rows: [
          {
            id: 33,
            customer_id: 500,
            payment_method: 'check',
            reference_number: null,
            payment_date: '2025-01-01',
            total_amount: '1200.00',
            deposit_date: '2025-01-02T00:00:00Z',
            notes: null,
            created_by: 9,
            created_at: '2025-01-02T00:00:00Z',
            updated_at: '2025-01-02T00:00:00Z',
            unallocated_amount: '800.00'
          }
        ] };
      }
      if (sql.includes('FROM deposit_allocations da') && sql.includes('LEFT JOIN job_items ji')) {
        return { rows: [
          { id: 1, deposit_id: 33, job_id: 80, job_item_id: 301, job_item_title: 'Item 301', amount: '200.00', allocation_date: '2025-01-02T00:00:00Z', notes: null, created_by: 9, created_at: '2025-01-02T00:00:00Z' },
          { id: 2, deposit_id: 33, job_id: 80, job_item_id: 302, job_item_title: 'Item 302', amount: '200.00', allocation_date: '2025-01-02T00:00:00Z', notes: null, created_by: 9, created_at: '2025-01-02T00:00:00Z' }
        ] };
      }
      if (sql.includes("to_regclass('public.deposits')")) {
        return { rows: [{ deposits: 'deposits', allocations: 'deposit_allocations', view: 'deposits_with_balance' }] };
      }
      if (sql.includes("information_schema.columns") && sql.includes("deposit_allocations") && sql.includes("job_item_id")) {
        return { rows: [{ column_name: 'job_item_id' }] };
      }
      return { rows: [] };
    });

    const { allocateDeposit } = require(serviceModuleId);

    const result = await allocateDeposit({
      depositId: 33,
      userId: 9,
      allocations: [
        { jobId: 80, jobItemId: 301, amount: 200 },
        { jobId: 80, jobItemId: 302, amount: 200 }
      ]
    });

    expect(result.id).toBe(33);
    expect(result.unallocatedAmount).toBe(800);
    expect(result.allocations).toHaveLength(2);
  });

  test('throws when allocation exceeds item remaining balance', async () => {
    const client = await poolMock.connect();

    // Schema ready checks
    client.query.mockImplementation(async (sql, params) => {
      if (sql.includes("to_regclass('public.deposits')")) {
        return { rows: [{ deposits: 'deposits', allocations: 'deposit_allocations', view: 'deposits_with_balance' }] };
      }
      if (sql.includes("information_schema.columns") && sql.includes("deposit_allocations") && sql.includes("job_item_id")) {
        return { rows: [{ column_name: 'job_item_id' }] };
      }
      if (sql.startsWith('BEGIN') || sql.startsWith('COMMIT') || sql.startsWith('ROLLBACK')) {
        return { rows: [] };
      }
      // Lock deposit row
      if (sql.includes('FROM deposits') && sql.includes('FOR UPDATE')) {
        return { rows: [{ id: 1, customer_id: 123, total_amount: 1500 }] };
      }
      // Current allocations on deposit
      if (sql.includes('SELECT COALESCE(SUM(amount), 0) AS allocated FROM deposit_allocations WHERE deposit_id')) {
        return { rows: [{ allocated: 0 }] };
      }
      // job_items columns probe
      if (sql.includes("information_schema.columns") && sql.includes("table_name = 'job_items'")) {
        return { rows: [
          { column_name: 'total_amount' },
        ] };
      }
      // Per-item allocation validation CTE
      if (sql.includes('WITH alloc AS') && sql.includes('FROM job_items ji')) {
        return { rows: [
          { id: 42, job_id: 7, customer_id: 123, total_amount: '1000.00', allocated: '800.00' }
        ] };
      }
      return { rows: [] };
    });

    const { allocateDeposit } = require(serviceModuleId);

    await expect(
      allocateDeposit({
        depositId: 1,
        userId: 9,
        allocations: [
          { jobId: 7, jobItemId: 42, amount: 300 } // exceeds remaining 200
        ]
      })
    ).rejects.toMatchObject({
      code: 'OVER_ALLOCATION'
    });
  });

  test('aggregates multiple entries for the same item before validating', async () => {
    const client = await poolMock.connect();

    client.query.mockImplementation(async (sql, params) => {
      if (sql.includes("to_regclass('public.deposits')")) {
        return { rows: [{ deposits: 'deposits', allocations: 'deposit_allocations', view: 'deposits_with_balance' }] };
      }
      if (sql.includes("information_schema.columns") && sql.includes("deposit_allocations") && sql.includes("job_item_id")) {
        return { rows: [{ column_name: 'job_item_id' }] };
      }
      if (sql.startsWith('BEGIN') || sql.startsWith('COMMIT') || sql.startsWith('ROLLBACK')) {
        return { rows: [] };
      }
      if (sql.includes('FROM deposits') && sql.includes('FOR UPDATE')) {
        return { rows: [{ id: 1, customer_id: 123, total_amount: 1500 }] };
      }
      if (sql.includes('SELECT COALESCE(SUM(amount), 0) AS allocated FROM deposit_allocations WHERE deposit_id')) {
        return { rows: [{ allocated: 0 }] };
      }
      if (sql.includes("information_schema.columns") && sql.includes("table_name = 'job_items'")) {
        return { rows: [ { column_name: 'total_amount' } ] };
      }
      if (sql.includes('WITH alloc AS') && sql.includes('FROM job_items ji')) {
        return { rows: [ { id: 42, job_id: 7, customer_id: 123, total_amount: '1000.00', allocated: '800.00' } ] };
      }
      return { rows: [] };
    });

    const { allocateDeposit } = require(serviceModuleId);

    await expect(
      allocateDeposit({
        depositId: 1,
        userId: 9,
        allocations: [
          { jobId: 7, jobItemId: 42, amount: 150 },
          { jobId: 7, jobItemId: 42, amount: 100 } // total 250 > remaining 200
        ]
      })
    ).rejects.toMatchObject({ code: 'OVER_ALLOCATION' });
  });

  test('maps DB constraint error (23514) message on insert', async () => {
    const client = await poolMock.connect();

    client.query.mockImplementation(async (sql, params) => {
      if (sql.includes("to_regclass('public.deposits')")) {
        return { rows: [{ deposits: 'deposits', allocations: 'deposit_allocations', view: 'deposits_with_balance' }] };
      }
      if (sql.includes("information_schema.columns") && sql.includes("deposit_allocations") && sql.includes("job_item_id")) {
        return { rows: [{ column_name: 'job_item_id' }] };
      }
      if (sql.startsWith('BEGIN') || sql.startsWith('COMMIT') || sql.startsWith('ROLLBACK')) {
        return { rows: [] };
      }
      if (sql.includes('FROM deposits') && sql.includes('FOR UPDATE')) {
        return { rows: [{ id: 1, customer_id: 123, total_amount: 1500 }] };
      }
      if (sql.includes('SELECT COALESCE(SUM(amount), 0) AS allocated FROM deposit_allocations WHERE deposit_id')) {
        return { rows: [{ allocated: 0 }] };
      }
      if (sql.includes("information_schema.columns") && sql.includes("table_name = 'job_items'")) {
        return { rows: [ { column_name: 'total_amount' } ] };
      }
      if (sql.includes('WITH alloc AS') && sql.includes('FROM job_items ji')) {
        // Validation passes (remaining = 300, requested = 200)
        return { rows: [ { id: 42, job_id: 7, customer_id: 123, total_amount: '1000.00', allocated: '800.00' } ] };
      }
      if (sql.includes('INSERT INTO deposit_allocations')) {
        const err = new Error('Item allocations (1200) would exceed item total (1000)');
        err.code = '23514';
        throw err;
      }
      return { rows: [] };
    });

    const { allocateDeposit } = require(serviceModuleId);

    await expect(
      allocateDeposit({
        depositId: 1,
        userId: 9,
        allocations: [ { jobId: 7, jobItemId: 42, amount: 200 } ]
      })
    ).rejects.toMatchObject({
      code: 'OVER_ALLOCATION',
      message: expect.stringContaining('Item allocations (1200) would exceed item total (1000)')
    });
  });

  test('allocates successfully and returns updated deposit detail', async () => {
    const client = await poolMock.connect();

    // Client-level queries during allocateDeposit
    client.query.mockImplementation(async (sql, params) => {
      if (sql.includes("to_regclass('public.deposits')")) {
        return { rows: [{ deposits: 'deposits', allocations: 'deposit_allocations', view: 'deposits_with_balance' }] };
      }
      if (sql.includes("information_schema.columns") && sql.includes("deposit_allocations") && sql.includes("job_item_id")) {
        return { rows: [{ column_name: 'job_item_id' }] };
      }
      if (sql.startsWith('BEGIN') || sql.startsWith('COMMIT') || sql.startsWith('ROLLBACK')) {
        return { rows: [] };
      }
      if (sql.includes('FROM deposits') && sql.includes('FOR UPDATE')) {
        return { rows: [{ id: 10, customer_id: 321, total_amount: 1000 }] };
      }
      if (sql.includes('SELECT COALESCE(SUM(amount), 0) AS allocated FROM deposit_allocations WHERE deposit_id')) {
        return { rows: [{ allocated: 0 }] };
      }
      if (sql.includes("information_schema.columns") && sql.includes("table_name = 'job_items'")) {
        return { rows: [ { column_name: 'total_amount' }, { column_name: 'status' }, { column_name: 'description' }, { column_name: 'created_at' } ] };
      }
      if (sql.includes('WITH alloc AS') && sql.includes('FROM job_items ji')) {
        return { rows: [ { id: 77, job_id: 55, customer_id: 321, total_amount: '1000.00', allocated: '100.00' } ] };
      }
      if (sql.includes('INSERT INTO deposit_allocations')) {
        // Success path for insert
        return { rows: [] };
      }
      return { rows: [] };
    });

    // Pool-level queries used by getDepositById (called after COMMIT)
    poolMock.query.mockImplementation(async (sql, params) => {
      if (sql.includes("to_regclass('public.deposits')")) {
        return { rows: [{ deposits: 'deposits', allocations: 'deposit_allocations', view: 'deposits_with_balance' }] };
      }
      if (sql.includes("information_schema.columns") && sql.includes("deposit_allocations") && sql.includes("job_item_id")) {
        return { rows: [{ column_name: 'job_item_id' }] };
      }
      if (sql.includes('SELECT * FROM deposits_with_balance WHERE id =')) {
        return { rows: [
          {
            id: 10,
            customer_id: 321,
            payment_method: 'check',
            reference_number: null,
            payment_date: '2025-01-01',
            total_amount: '1000.00',
            deposit_date: '2025-01-02T00:00:00Z',
            notes: null,
            created_by: 9,
            created_at: '2025-01-02T00:00:00Z',
            updated_at: '2025-01-02T00:00:00Z',
            unallocated_amount: '850.00'
          }
        ] };
      }
      if (sql.includes('FROM deposit_allocations da') && sql.includes('LEFT JOIN job_items ji')) {
        return { rows: [
          {
            id: 999,
            deposit_id: 10,
            job_id: 55,
            job_item_id: 77,
            job_item_title: 'Item A',
            amount: '150.00',
            allocation_date: '2025-01-02T00:00:00Z',
            notes: null,
            created_by: 9,
            created_at: '2025-01-02T00:00:00Z'
          }
        ] };
      }
      return { rows: [] };
    });

    const { allocateDeposit } = require(serviceModuleId);

    const result = await allocateDeposit({
      depositId: 10,
      userId: 9,
      allocations: [ { jobId: 55, jobItemId: 77, amount: 150 } ]
    });

    expect(result).toMatchObject({
      id: 10,
      customerId: 321,
      unallocatedAmount: 850,
    });
    expect(Array.isArray(result.allocations)).toBe(true);
    expect(result.allocations.length).toBe(1);
    expect(result.allocations[0]).toMatchObject({ jobId: 55, jobItemId: 77, amount: 150 });
  });

  test('throws when total requested exceeds deposit remaining amount', async () => {
    const client = await poolMock.connect();

    client.query.mockImplementation(async (sql, params) => {
      if (sql.includes("to_regclass('public.deposits')")) {
        return { rows: [{ deposits: 'deposits', allocations: 'deposit_allocations', view: 'deposits_with_balance' }] };
      }
      if (sql.includes("information_schema.columns") && sql.includes("deposit_allocations") && sql.includes("job_item_id")) {
        return { rows: [{ column_name: 'job_item_id' }] };
      }
      if (sql.startsWith('BEGIN') || sql.startsWith('COMMIT') || sql.startsWith('ROLLBACK')) {
        return { rows: [] };
      }
      if (sql.includes('FROM deposits') && sql.includes('FOR UPDATE')) {
        return { rows: [{ id: 2, customer_id: 222, total_amount: 1000 }] };
      }
      if (sql.includes('SELECT COALESCE(SUM(amount), 0) AS allocated FROM deposit_allocations WHERE deposit_id')) {
        return { rows: [{ allocated: 900 }] }; // remaining 100
      }
      // validateAllocations will throw before checking job items
      return { rows: [] };
    });

    const { allocateDeposit } = require(serviceModuleId);

    await expect(
      allocateDeposit({
        depositId: 2,
        userId: 1,
        allocations: [ { jobId: 5, jobItemId: 50, amount: 200 } ] // > remaining 100
      })
    ).rejects.toMatchObject({
      code: 'OVER_ALLOCATION',
      message: expect.stringContaining('exceeds available amount')
    });
  });
});
