const path = require('path');

const databaseModuleId = path.resolve(__dirname, '../dist/config/database.js');
const serviceModuleId = path.resolve(__dirname, '../dist/services/depositService.js');

describe('depositService.createDeposit schema readiness', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('throws DEPOSITS_NOT_READY when schema missing', async () => {
    const client = {
      query: jest.fn(async (sql, params) => {
        const s = String(sql);
        if (s.includes("to_regclass('public.deposits')")) {
          // Simulate missing objects
          return { rows: [{ deposits: null, allocations: null, view: null }] };
        }
        if (s.includes('information_schema.columns') && s.includes("deposit_allocations") && s.includes("job_item_id")) {
          return { rows: [] };
        }
        return { rows: [] };
      }),
      release: jest.fn(),
    };
    const poolMock = { connect: jest.fn(async () => client), query: jest.fn(client.query) };
    jest.doMock(databaseModuleId, () => ({ __esModule: true, default: poolMock }));

    const { createDeposit } = require(serviceModuleId);

    await expect(createDeposit({
      customerId: 1,
      paymentMethod: 'check',
      totalAmount: 100,
      userId: 1,
    })).rejects.toMatchObject({ code: 'DEPOSITS_NOT_READY' });
  });
});

