const path = require('path');

function resObj() { return { statusCode: 200, body: undefined, status(c){this.statusCode=c;return this;}, json(b){this.body=b;return this;} }; }

describe('customerController', () => {
  beforeEach(() => { jest.resetModules(); });

  test('getAllCustomers recent=true and paginated branches', async () => {
    const calls = [];
    const dbId = path.resolve(__dirname, '../dist/config/database.js');
    jest.doMock(dbId, () => ({ __esModule: true, default: { query: jest.fn(async (sql, params) => { calls.push(String(sql)); return { rows: [] }; }) } }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/customerController.js'));
    // recent=true
    let res = resObj();
    await controller.getAllCustomers({ query: { recent: 'true' } }, res, (e) => { throw e; });
    expect(calls[0]).toMatch(/last_visited_at/);
    // paginated
    res = resObj();
    calls.length = 0;
    await controller.getAllCustomers({ query: { page: '1', pageSize: '10', sortBy: 'created_at', sortDir: 'desc', state: 'OH', hasEmail: 'true' } }, res, (e) => { throw e; });
    expect(calls[0]).toMatch(/SELECT COUNT\(\*\)/);
  });

  test('getCustomerById updates last_visited_at and fetches', async () => {
    const dbId = path.resolve(__dirname, '../dist/config/database.js');
    const mock = { query: jest.fn(async (sql, params) => {
      if (String(sql).includes('UPDATE customers SET last_visited_at')) return { rows: [] };
      if (String(sql).includes('SELECT * FROM customers WHERE id =')) return { rows: [ { id: 1, name: 'Acme' } ] };
      return { rows: [] };
    }) };
    jest.doMock(dbId, () => ({ __esModule: true, default: mock }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/customerController.js'));
    const res = resObj();
    await controller.getCustomerById({ params: { id: '1' } }, res, (e) => { throw e; });
    expect(res.body.name).toBe('Acme');
  });

  test('create/update/delete customers', async () => {
    const dbId = path.resolve(__dirname, '../dist/config/database.js');
    jest.doMock(dbId, () => ({ __esModule: true, default: { query: jest.fn(async () => ({ rows: [ { id: 2, name: 'Beta' } ] })) } }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/customerController.js'));
    let res = resObj();
    await controller.createCustomer({ body: { name: ' Beta ' } }, res, (e) => { throw e; });
    expect(res.statusCode).toBe(201);

    res = resObj();
    await controller.updateCustomer({ params: { id: '2' }, body: { name: ' Gamma ' } }, res, (e) => { throw e; });
    expect(res.statusCode).toBe(200);

    res = resObj();
    await controller.deleteCustomer({ params: { id: '2' } }, res, (e) => { throw e; });
    expect(res.statusCode).toBe(200);
  });
});

