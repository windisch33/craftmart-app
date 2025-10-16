const path = require('path');

const databaseModuleId = path.resolve(__dirname, '../dist/config/database.js');
const serviceModuleId = path.resolve(__dirname, '../dist/services/depositService.js');

describe('depositService.getCustomerJobs', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('maps totals, deposits and balance, with columns present', async () => {
    const poolMock = {
      query: jest.fn(async (sql, params) => {
        const s = String(sql);
        if (s.includes("to_regclass('public.deposits')")) {
          return { rows: [{ deposits: 'deposits', allocations: 'deposit_allocations', view: 'deposits_with_balance' }] };
        }
        if (s.includes("to_regclass('public.deposits')")) {
          return { rows: [{ deposits: 'deposits', allocations: 'deposit_allocations', view: 'deposits_with_balance' }] };
        }
        if (s.includes('information_schema.columns') && s.includes("table_name = 'deposit_allocations'")) {
          return { rows: [{ column_name: 'job_item_id' }] };
        }
        if (s.includes('information_schema.columns') && s.includes("table_name = 'jobs'")) {
          // Present columns used to build expressions and ordering
          return { rows: [ 'name','status','total_amount','total_deposits','balance_due','updated_at','created_at' ].map(c => ({ column_name: c })) };
        }
        if (s.includes('information_schema.columns') && s.includes("table_name = 'job_items'")) {
          return { rows: [ 'status','total_amount','created_at' ].map(c => ({ column_name: c })) };
        }
        if (s.includes('FROM jobs j') && s.includes('LEFT JOIN job_item_totals')) {
          return { rows: [
            { id: 700, job_name: 'Subdivision A', status: 'order', total_amount: '1500.00', total_deposits: '500.00', balance_due: '1000.00' },
            { id: 701, job_name: 'Subdivision B', status: 'invoice', total_amount: '2000.00', total_deposits: '2000.00', balance_due: '0.00' },
          ] };
        }
        return { rows: [] };
      })
    };
    jest.doMock(databaseModuleId, () => ({ __esModule: true, default: poolMock }));

    const { getCustomerJobs } = require(serviceModuleId);
    const rows = await getCustomerJobs(123);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ jobId: 700, jobName: 'Subdivision A', status: 'order', totalAmount: 1500, totalDeposits: 500, balanceDue: 1000 });
    expect(rows[1]).toMatchObject({ status: 'invoice', balanceDue: 0 });
  });
});
