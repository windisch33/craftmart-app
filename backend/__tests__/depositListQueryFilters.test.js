const path = require('path');

const databaseModuleId = path.resolve(__dirname, '../dist/config/database.js');
const serviceModuleId = path.resolve(__dirname, '../dist/services/depositService.js');

describe('depositService.getDeposits SQL filters', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('includes customerId and paymentMethod in SQL when provided', async () => {
    const calls = [];
    const poolMock = {
      query: jest.fn(async (sql, params) => {
        const s = String(sql);
        calls.push({ sql: s, params });
        if (s.includes("to_regclass('public.deposits')")) {
          return { rows: [{ deposits: 'deposits', allocations: 'deposit_allocations', view: 'deposits_with_balance' }] };
        }
        if (s.includes('information_schema.columns') && s.includes("deposit_allocations") && s.includes("job_item_id")) {
          return { rows: [{ column_name: 'job_item_id' }] };
        }
        if (s.startsWith('SELECT * FROM deposits_with_balance')) {
          // Return two rows (function will filter status in JS if requested)
          return { rows: [
            { id: 10, customer_id: 123, payment_method: 'check', total_amount: '100.00', deposit_date: '2025-01-01', unallocated_amount: '0.00', created_at: 'ts', updated_at: 'ts' },
            { id: 11, customer_id: 124, payment_method: 'cash', total_amount: '200.00', deposit_date: '2025-01-02', unallocated_amount: '200.00', created_at: 'ts', updated_at: 'ts' },
          ] };
        }
        return { rows: [] };
      })
    };
    jest.doMock(databaseModuleId, () => ({ __esModule: true, default: poolMock }));

    const { getDeposits } = require(serviceModuleId);
    const result = await getDeposits({ customerId: 123, paymentMethod: 'check' });

    expect(Array.isArray(result)).toBe(true);
    const selectCall = calls.find(c => c.sql.startsWith('SELECT * FROM deposits_with_balance'));
    expect(selectCall).toBeTruthy();
    expect(selectCall.sql).toMatch(/WHERE/i);
    expect(selectCall.sql).toMatch(/customer_id/);
    expect(selectCall.sql).toMatch(/payment_method/);
  });
});

