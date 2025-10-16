const path = require('path');

const databaseModuleId = path.resolve(__dirname, '../dist/config/database.js');
const serviceModuleId = path.resolve(__dirname, '../dist/services/depositService.js');

describe('depositService.getJobItems', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('maps job items and computes balances', async () => {
    const poolMock = {
      query: jest.fn(async (sql, params) => {
        const s = String(sql);
        if (s.includes("to_regclass('public.deposits')")) {
          return { rows: [{ deposits: 'deposits', allocations: 'deposit_allocations', view: 'deposits_with_balance' }] };
        }
        if (s.includes('information_schema.columns') && s.includes("deposit_allocations") && s.includes("job_item_id")) {
          return { rows: [{ column_name: 'job_item_id' }] };
        }
        if (s.includes('SELECT id FROM jobs WHERE id =')) {
          return { rows: [ { id: 321 } ] };
        }
        if (s.includes('information_schema.columns') && s.includes("table_name = 'job_items'")) {
          return { rows: [ 'title','status','description','total_amount','created_at' ].map(c => ({ column_name: c })) };
        }
        if (s.includes('FROM job_items ji') && s.includes('LEFT JOIN allocation_totals at')) {
          return { rows: [
            { id: 900, job_id: 321, title: 'Item A', status: 'order', description: null, total_amount: '1000.00', allocated_amount: '250.00' },
            { id: 901, job_id: 321, title: 'Item B', status: 'order', description: null, total_amount: '500.00', allocated_amount: '500.00' },
          ] };
        }
        return { rows: [] };
      })
    };
    jest.doMock(databaseModuleId, () => ({ __esModule: true, default: poolMock }));

    const { getJobItems } = require(serviceModuleId);
    const rows = await getJobItems(321);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ id: 900, balanceDue: 750 });
    expect(rows[1]).toMatchObject({ id: 901, balanceDue: 0 });
  });
});

