const path = require('path');

describe('jobController.getAllJobs', () => {
  beforeEach(() => { jest.resetModules(); });

  test('builds WHERE and ORDER BY clauses from filters', async () => {
    const calls = [];
    const dbId = path.resolve(__dirname, '../dist/config/database.js');
    jest.doMock(dbId, () => ({ __esModule: true, default: { query: jest.fn(async (sql, params) => { calls.push({ sql: String(sql), params }); return { rows: [] }; }) } }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/jobController.js'));

    const req = {
      query: {
        status: 'order',
        salesman_id: '3',
        customer_id: '5',
        project_id: '7',
        searchTerm: 'Lot',
        searchField: 'title',
        searchOperator: 'startsWith',
        statusFilter: ['order','invoice'],
        dateRangeType: 'updated',
        dateRangeStart: '2025-01-01',
        dateRangeEnd: '2025-01-31',
        amountRangeType: 'total',
        amountRangeMin: '100',
        amountRangeMax: '2000',
        sortBy: 'total_amount',
        sortOrder: 'asc'
      }
    };

    const res = { json: (b) => { res.body = b; return res; } };
    await controller.getAllJobs(req, res, (e) => { throw e; });

    const { sql } = calls[0];
    expect(sql).toMatch(/WHERE/);
    expect(sql).toMatch(/j\.status = \$1/);
    expect(sql).toMatch(/j\.salesman_id = \$2/);
    expect(sql).toMatch(/j\.customer_id = \$3/);
    expect(sql).toMatch(/j\.job_id = \$4/);
    expect(sql).toMatch(/j\.title ILIKE \$5/);
    expect(sql).toMatch(/j\.status IN \(\$6, \$7\)/);
    expect(sql).toMatch(/j\.updated_at::date >= \$8/);
    expect(sql).toMatch(/j\.updated_at::date <= \$9/);
    expect(sql).toMatch(/j\.total_amount >= \$10/);
    expect(sql).toMatch(/j\.total_amount <= \$11/);
    expect(sql).toMatch(/ORDER BY j\.total_amount ASC/);
  });

  test('recent=true uses alternate query', async () => {
    const calls = [];
    const dbId = path.resolve(__dirname, '../dist/config/database.js');
    jest.doMock(dbId, () => ({ __esModule: true, default: { query: jest.fn(async (sql, params) => { calls.push({ sql: String(sql), params }); return { rows: [] }; }) } }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/jobController.js'));

    const req = { query: { recent: 'true' } };
    const res = { json: (b) => { res.body = b; return res; } };
    await controller.getAllJobs(req, res, (e) => { throw e; });

    const { sql } = calls[0];
    expect(sql).toMatch(/ORDER BY j\.updated_at DESC/);
    expect(sql).toMatch(/LIMIT 10/);
  });
});

