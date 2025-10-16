const path = require('path');

function createRes() {
  const res = {};
  res.statusCode = 200;
  res.headers = {};
  res.body = undefined;
  res.status = (code) => { res.statusCode = code; return res; };
  res.setHeader = (k, v) => { res.headers[k] = v; };
  res.json = (payload) => { res.body = payload; return res; };
  res.send = (payload) => { res.body = payload; return res; };
  return res;
}

function createReq({ params = {}, body = {} } = {}) {
  return { params, body };
}

describe('shopController create/update/delete', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('createShop validates job_id', async () => {
    const controller = require(path.resolve(__dirname, '../dist/controllers/shopController.js'));
    const res = createRes();
    await controller.createShop(createReq({ body: { job_id: 'abc' } }), res, (e) => { throw e; });
    expect(res.statusCode).toBe(400);
  });

  test('createShop inserts and returns 201', async () => {
    const databaseModuleId = path.resolve(__dirname, '../dist/config/database.js');
    const poolMock = {
      query: jest.fn(async (sql, params) => {
        if (String(sql).startsWith('INSERT INTO shops')) {
          return { rows: [ { id: 5, job_id: 1, cut_sheets: null, notes: null } ] };
        }
        return { rows: [] };
      })
    };
    jest.doMock(databaseModuleId, () => ({ __esModule: true, default: poolMock }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/shopController.js'));
    const res = createRes();
    await controller.createShop(createReq({ body: { job_id: 1 } }), res, (e) => { throw e; });
    expect(res.statusCode).toBe(201);
    expect(res.body.id).toBe(5);
  });

  test('updateShop validates shop id and job_id', async () => {
    const controller = require(path.resolve(__dirname, '../dist/controllers/shopController.js'));
    const res = createRes();
    await controller.updateShop(createReq({ params: { id: 'x' }, body: { job_id: 1 } }), res, (e) => { throw e; });
    expect(res.statusCode).toBe(400);
  });

  test('updateShop updates and returns row', async () => {
    const databaseModuleId = path.resolve(__dirname, '../dist/config/database.js');
    const poolMock = {
      query: jest.fn(async (sql, params) => {
        if (String(sql).startsWith('UPDATE shops SET')) {
          return { rows: [ { id: 9, job_id: 2, cut_sheets: null, notes: null } ] };
        }
        return { rows: [] };
      })
    };
    jest.doMock(databaseModuleId, () => ({ __esModule: true, default: poolMock }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/shopController.js'));
    const res = createRes();
    await controller.updateShop(createReq({ params: { id: '9' }, body: { job_id: 2 } }), res, (e) => { throw e; });
    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(9);
  });

  test('deleteShop validates id', async () => {
    const controller = require(path.resolve(__dirname, '../dist/controllers/shopController.js'));
    const res = createRes();
    await controller.deleteShop(createReq({ params: { id: 'NaN' } }), res, (e) => { throw e; });
    expect(res.statusCode).toBe(400);
  });

  test('deleteShop deletes and returns success', async () => {
    await new Promise((resolve, reject) => {
      jest.isolateModules(async () => {
        try {
          const databaseModuleId = path.resolve(__dirname, '../dist/config/database.js');
          const poolMock = { query: jest.fn(async (sql, params) => ({ rows: [ { id: 12 } ] })) };
          jest.doMock(databaseModuleId, () => ({ __esModule: true, default: poolMock }));
          const controller = require(path.resolve(__dirname, '../dist/controllers/shopController.js'));
          const res = createRes();
          await controller.deleteShop(createReq({ params: { id: '12' } }), res, (e) => { throw e; });
          expect(res.statusCode).toBe(200);
          expect(res.body).toMatchObject({ message: 'Shop deleted successfully' });
          resolve();
        } catch (err) { reject(err); }
      });
    });
  });
});
