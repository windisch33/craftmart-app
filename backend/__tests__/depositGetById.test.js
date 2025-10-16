const path = require('path');

const databaseModuleId = path.resolve(__dirname, '../dist/config/database.js');
const serviceModuleId = path.resolve(__dirname, '../dist/services/depositService.js');

describe('depositService.getDepositById', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('returns mapped deposit with allocations', async () => {
    const poolMock = {
      query: jest.fn(async (sql, params) => {
        const s = String(sql);
        if (s.includes("to_regclass('public.deposits')")) {
          return { rows: [{ deposits: 'deposits', allocations: 'deposit_allocations', view: 'deposits_with_balance' }] };
        }
        if (s.includes('information_schema.columns') && s.includes("deposit_allocations") && s.includes("job_item_id")) {
          return { rows: [{ column_name: 'job_item_id' }] };
        }
        if (s.includes('SELECT * FROM deposits_with_balance WHERE id =')) {
          return { rows: [ { id: 44, customer_id: 200, payment_method: 'check', reference_number: null, payment_date: '2025-01-01', total_amount: '1200.00', deposit_date: '2025-01-01', notes: null, created_by: 9, created_at: 'ts', updated_at: 'ts', unallocated_amount: '700.00' } ] };
        }
        if (s.includes('FROM deposit_allocations da') && s.includes('LEFT JOIN job_items ji')) {
          return { rows: [
            { id: 501, deposit_id: 44, job_id: 70, job_item_id: 701, job_item_title: 'Item A', amount: '300.00', allocation_date: '2025-01-02', notes: null, created_by: 9, created_at: 'ts' },
            { id: 502, deposit_id: 44, job_id: 70, job_item_id: 702, job_item_title: 'Item B', amount: '200.00', allocation_date: '2025-01-02', notes: null, created_by: 9, created_at: 'ts' },
          ] };
        }
        return { rows: [] };
      })
    };
    jest.doMock(databaseModuleId, () => ({ __esModule: true, default: poolMock }));

    const { getDepositById } = require(serviceModuleId);
    const dep = await getDepositById(44);
    expect(dep.id).toBe(44);
    expect(dep.totalAmount).toBe(1200);
    expect(dep.unallocatedAmount).toBe(700);
    expect(dep.allocations).toHaveLength(2);
    expect(dep.allocations[0]).toMatchObject({ jobItemId: 701, amount: 300 });
  });
});

