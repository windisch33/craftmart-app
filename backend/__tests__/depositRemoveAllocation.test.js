const path = require('path');

const databaseModuleId = path.resolve(__dirname, '../dist/config/database.js');
const serviceModuleId = path.resolve(__dirname, '../dist/services/depositService.js');

describe('depositService.removeAllocation', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('deletes allocation and returns depositId', async () => {
    const client = {
      query: jest.fn(async (sql, params) => {
        const s = String(sql);
        if (s.includes("to_regclass('public.deposits')")) {
          return { rows: [{ deposits: 'deposits', allocations: 'deposit_allocations', view: 'deposits_with_balance' }] };
        }
        if (s.includes('information_schema.columns') && s.includes("deposit_allocations") && s.includes("job_item_id")) {
          return { rows: [{ column_name: 'job_item_id' }] };
        }
        if (s.startsWith('BEGIN') || s.startsWith('COMMIT') || s.startsWith('ROLLBACK')) {
          return { rows: [] };
        }
        if (s.includes('SELECT deposit_id') && s.includes('FROM deposit_allocations')) {
          return { rows: [ { deposit_id: 999 } ] };
        }
        if (s.startsWith('DELETE FROM deposit_allocations')) {
          return { rows: [] };
        }
        return { rows: [] };
      }),
      release: jest.fn(),
    };
    const poolMock = { connect: jest.fn(async () => client), query: jest.fn(client.query) };
    jest.doMock(databaseModuleId, () => ({ __esModule: true, default: poolMock }));

    const { removeAllocation } = require(serviceModuleId);
    const res = await removeAllocation(12345);
    expect(res.depositId).toBe(999);
  });
});

