const path = require('path');

const databaseModuleId = path.resolve(__dirname, '../dist/config/database.js');
const serviceModuleId = path.resolve(__dirname, '../dist/services/shopService.js');

describe('shopService.updateShopStatus', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('issues UPDATE with status and id', async () => {
    const calls = [];
    const poolMock = {
      query: jest.fn(async (sql, params) => {
        calls.push({ sql: String(sql), params });
        return { rows: [] };
      })
    };
    jest.doMock(databaseModuleId, () => ({ __esModule: true, default: poolMock }));

    const { updateShopStatus } = require(serviceModuleId);
    await expect(updateShopStatus(55, 'in_progress')).resolves.toBeUndefined();
    const call = calls.find(c => c.sql.startsWith('UPDATE shops SET status'));
    expect(call).toBeTruthy();
    expect(call.params).toEqual(['in_progress', 55]);
  });
});

