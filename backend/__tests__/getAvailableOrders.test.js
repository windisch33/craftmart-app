const path = require('path');

const databaseModuleId = path.resolve(__dirname, '../dist/config/database.js');
const serviceModuleId = path.resolve(__dirname, '../dist/services/shopService.js');

const createMockClient = (rows) => {
  const query = jest.fn(async (sql, params = []) => {
    sql = String(sql);
    if (sql.includes('FROM job_items ji') && sql.includes('JOIN customers c ON ji.customer_id = c.id') && sql.includes('LEFT JOIN stair_configurations sc')) {
      return { rows };
    }
    return { rows: [] };
  });
  return { query, release: jest.fn() };
};

describe('shopService.getAvailableOrders', () => {
  let poolMock;

  beforeEach(() => {
    jest.resetModules();
  });

  test('returns all orders with stair count and shops_run flags', async () => {
    const rows = [
      {
        id: 1,
        job_title: 'Order A',
        customer_id: 10,
        customer_name: 'Acme',
        delivery_date: '2025-01-05',
        shops_run: false,
        shops_run_date: null,
        created_at: '2025-01-01T00:00:00Z',
        job_status: 'order',
        stair_config_count: '2',
      },
      {
        id: 2,
        job_title: 'Order B',
        customer_id: 11,
        customer_name: 'Beta',
        delivery_date: '2025-01-06',
        shops_run: true,
        shops_run_date: '2025-01-02T00:00:00Z',
        created_at: '2025-01-01T00:00:00Z',
        job_status: 'order',
        stair_config_count: '1',
      },
    ];

    const client = createMockClient(rows);
    poolMock = { connect: jest.fn(async () => client), query: jest.fn(client.query) };
    jest.doMock(databaseModuleId, () => ({ __esModule: true, default: poolMock }));

    const { getAvailableOrders } = require(serviceModuleId);
    const result = await getAvailableOrders('all');
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ id: 1, title: 'Order A', customer_name: 'Acme', shops_run: false, stair_config_count: '2', status: 'order' });
    expect(result[1]).toMatchObject({ id: 2, title: 'Order B', customer_name: 'Beta' });
  });

  test('filters to unrun only', async () => {
    const rows = [
      {
        id: 1,
        job_title: 'Order A',
        customer_id: 10,
        name: 'Acme',
        delivery_date: '2025-01-05',
        shops_run: false,
        shops_run_date: null,
        created_at: '2025-01-01T00:00:00Z',
        job_status: 'order',
        stair_config_count: '2',
      },
    ];

    const client = createMockClient(rows);
    poolMock = { connect: jest.fn(async () => client), query: jest.fn(client.query) };
    jest.doMock(databaseModuleId, () => ({ __esModule: true, default: poolMock }));

    const { getAvailableOrders } = require(serviceModuleId);
    const result = await getAvailableOrders('unrun');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 1, shops_run: false });
  });
});
