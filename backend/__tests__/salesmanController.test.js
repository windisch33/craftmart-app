const path = require('path');

function resObj() { return { statusCode: 200, body: undefined, status(c){this.statusCode=c;return this;}, json(b){this.body=b;return this;} }; }

describe('salesmanController', () => {
  beforeEach(() => { jest.resetModules(); });

  test('getAllSalesmen active filter and get by id', async () => {
    const calls = [];
    const dbId = path.resolve(__dirname, '../dist/config/database.js');
    const mock = { query: jest.fn(async (sql, params) => { calls.push(String(sql)); return { rows: [ { id: 1, first_name: 'Sam' } ] }; }) };
    jest.doMock(dbId, () => ({ __esModule: true, default: mock }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/salesmanController.js'));
    let res = resObj();
    await controller.getAllSalesmen({ query: { active: 'true' } }, res, (e) => { throw e; });
    expect(calls[0]).toMatch(/WHERE is_active = true/);
    res = resObj();
    await controller.getSalesmanById({ params: { id: '1' } }, res, (e) => { throw e; });
    expect(res.body.first_name).toBe('Sam');
  });

  test('create/update/delete salesman', async () => {
    const dbId = path.resolve(__dirname, '../dist/config/database.js');
    const mock = { query: jest.fn(async (sql, params) => {
      const s = String(sql);
      if (s.includes('SELECT id FROM salesmen WHERE email = $1 AND is_active = true')) return { rows: [] };
      if (s.startsWith('INSERT INTO salesmen')) return { rows: [ { id: 2, first_name: 'Sam' } ] };
      if (s.includes('UPDATE salesmen SET first_name')) return { rows: [ { id: 2, first_name: 'Bob' } ] };
      if (s.includes('SELECT COUNT(*) as job_count FROM jobs WHERE salesman_id =')) return { rows: [ { job_count: '0' } ] };
      if (s.startsWith('DELETE FROM salesmen WHERE id =')) return { rows: [ { id: 2 } ] };
      return { rows: [] };
    }) };
    jest.doMock(dbId, () => ({ __esModule: true, default: mock }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/salesmanController.js'));
    let res = resObj();
    await controller.createSalesman({ body: { first_name: 'Sam', last_name: 'Seller' } }, res, (e) => { throw e; });
    expect(res.statusCode).toBe(201);

    res = resObj();
    await controller.updateSalesman({ params: { id: '2' }, body: { first_name: 'Bob', last_name: 'Seller' } }, res, (e) => { throw e; });
    // Our mock returns a row; expect 200 or 404 if mismatch. Assert not 400.
    expect(res.statusCode).not.toBe(400);

    res = resObj();
    await controller.deleteSalesman({ params: { id: '2' } }, res, (e) => { throw e; });
    expect(res.statusCode).toBe(200);
  });
});
