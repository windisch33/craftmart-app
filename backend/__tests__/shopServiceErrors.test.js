const path = require('path');

const databaseModuleId = path.resolve(__dirname, '../dist/config/database.js');
const serviceModuleId = path.resolve(__dirname, '../dist/services/shopService.js');

const createMockClient = () => {
  const query = jest.fn(async (sql, params = []) => {
    sql = String(sql);
    // Job details exists and is eligible (status order)
    if (sql.includes('FROM job_items ji') && sql.includes('LEFT JOIN jobs proj') && sql.includes('WHERE ji.id = ANY($1)')) {
      const jobIds = params[0] || [];
      return {
        rows: jobIds.map((id) => ({
          id,
          title: `Job ${id}`,
          description: 'Test job',
          status: 'order',
          job_location: null,
          delivery_date: null,
          order_designation: null,
          model_name: null,
          terms: null,
          installer: null,
          lot_name: null,
          customer_id: 1,
          customer_name: 'Acme',
          address: null,
          city: null,
          state: null,
          zip_code: null,
          phone: null,
          fax: null,
          cell: null,
          email: null,
          salesman_first_name: null,
          salesman_last_name: null,
          salesman_phone: null,
          salesman_email: null,
        }))
      };
    }
    // No quoted configs found
    if (sql.includes('FROM quote_items qi') && sql.includes('qi.job_item_id = ANY($1)')) {
      return { rows: [] };
    }
    return { rows: [] };
  });
  return { query, release: jest.fn() };
};

describe('shopService.generateCutSheets error handling', () => {
  let poolMock;
  beforeEach(() => {
    jest.resetModules();
    const client = createMockClient();
    poolMock = { connect: jest.fn(async () => client), query: jest.fn(client.query) };
    jest.doMock(databaseModuleId, () => ({ __esModule: true, default: poolMock }));
  });

  test('throws when no quoted stair configurations found', async () => {
    const { generateCutSheets } = require(serviceModuleId);
    await expect(generateCutSheets([123])).rejects.toThrow('No quoted stair configurations found');
  });

  test('throws when job status is not order', async () => {
    // Remock with job status = quote
    jest.resetModules();
    const client = {
      query: jest.fn(async (sql, params = []) => {
        const s = String(sql);
        if (s.includes('FROM job_items ji') && s.includes('WHERE ji.id = ANY($1)')) {
          const jobIds = params[0] || [];
          return { rows: jobIds.map(id => ({ id, title: `Job ${id}`, description: '', status: 'quote', job_location: null, delivery_date: null, order_designation: null, model_name: null, terms: null, installer: null, lot_name: null, customer_id: 1, customer_name: 'Acme', address: null, city: null, state: null, zip_code: null, phone: null, fax: null, cell: null, email: null, salesman_first_name: null, salesman_last_name: null, salesman_phone: null, salesman_email: null })) };
        }
        return { rows: [] };
      }),
      release: jest.fn(),
    };
    poolMock = { connect: jest.fn(async () => client), query: jest.fn(client.query) };
    jest.doMock(databaseModuleId, () => ({ __esModule: true, default: poolMock }));

    const { generateCutSheets } = require(serviceModuleId);
    await expect(generateCutSheets([1])).rejects.toThrow('not eligible for shops');
  });
});
