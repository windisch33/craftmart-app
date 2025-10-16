const path = require('path');

const databaseModuleId = path.resolve(__dirname, '../dist/config/database.js');
const serviceModuleId = path.resolve(__dirname, '../dist/services/shopService.js');

describe('shopService.getAvailableOrders SQL filter', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('adds shops_run false to WHERE when filter=unrun', async () => {
    const calls = [];
    const poolMock = {
      query: jest.fn(async (sql, params) => {
        const s = String(sql);
        calls.push(s);
        if (s.includes('FROM job_items ji')) {
          return { rows: [] };
        }
        return { rows: [] };
      })
    };
    jest.doMock(databaseModuleId, () => ({ __esModule: true, default: poolMock }));

    const { getAvailableOrders } = require(serviceModuleId);
    await getAvailableOrders('unrun');

    const sql = calls.find(c => c.includes('FROM job_items ji')) || '';
    expect(sql).toMatch(/COALESCE\(ji\.shops_run, false\) = false/);
    expect(sql).toMatch(/COALESCE\(ji\.status, 'order'\) ILIKE 'order'/);
  });
});

