const path = require('path');

const databaseModuleId = path.resolve(__dirname, '../dist/config/database.js');
const serviceModuleId = path.resolve(__dirname, '../dist/services/depositService.js');

describe('depositService.getDeposits list + filters', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('maps status and supports status filter', async () => {
    const poolMock = {
      query: jest.fn(async (sql, params) => {
        const s = String(sql);
        if (s.includes("to_regclass('public.deposits')")) {
          return { rows: [{ deposits: 'deposits', allocations: 'deposit_allocations', view: 'deposits_with_balance' }] };
        }
        if (s.includes('information_schema.columns') && s.includes("deposit_allocations") && s.includes("job_item_id")) {
          return { rows: [{ column_name: 'job_item_id' }] };
        }
        if (s.includes('SELECT * FROM deposits_with_balance')) {
          return {
            rows: [
              { id: 1, customer_id: 10, payment_method: 'check', total_amount: '1000.00', deposit_date: '2025-01-01', unallocated_amount: '1000.00', created_at: 'ts', updated_at: 'ts' }, // unallocated
              { id: 2, customer_id: 11, payment_method: 'cash', total_amount: '1000.00', deposit_date: '2025-01-02', unallocated_amount: '400.00', created_at: 'ts', updated_at: 'ts' },  // partial
              { id: 3, customer_id: 12, payment_method: 'check', total_amount: '1000.00', deposit_date: '2025-01-03', unallocated_amount: '0.00', created_at: 'ts', updated_at: 'ts' },     // allocated
            ]
          };
        }
        return { rows: [] };
      })
    };
    jest.doMock(databaseModuleId, () => ({ __esModule: true, default: poolMock }));

    const { getDeposits } = require(serviceModuleId);

    const all = await getDeposits();
    expect(all.map(d => d.status)).toEqual(['unallocated', 'partial', 'allocated']);

    const partialOnly = await getDeposits({ status: 'partial' });
    expect(partialOnly).toHaveLength(1);
    expect(partialOnly[0].id).toBe(2);
  });
});

