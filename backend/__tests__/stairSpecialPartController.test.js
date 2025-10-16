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

function createReq({ params = {}, body = {}, query = {} } = {}) { return { params, body, query }; }

describe('stairSpecialPartController', () => {
  beforeEach(() => { jest.resetModules(); });

  test('getStairSpecialParts supports material filter', async () => {
    const dbId = path.resolve(__dirname, '../dist/config/database.js');
    const calls = [];
    const poolMock = { query: jest.fn(async (sql, params) => { calls.push({ sql: String(sql), params }); return { rows: [ { id: 1, stpar_desc: 'Landing Tread' } ] }; }) };
    jest.doMock(dbId, () => ({ __esModule: true, default: poolMock }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/stairSpecialPartController.js'));
    const res = createRes();
    await controller.getStairSpecialParts(createReq({ query: { materialId: '5' } }), res, () => {});
    expect(calls[0].sql).toMatch(/sp\.mat_seq_n = \$1/);
    expect(res.body[0].id).toBe(1);
  });

  test('createSpecialPart inserts and returns 201', async () => {
    const dbId = path.resolve(__dirname, '../dist/config/database.js');
    const poolMock = { query: jest.fn(async () => ({ rows: [ { id: 9, stpar_desc: 'Custom Part' } ] })) };
    jest.doMock(dbId, () => ({ __esModule: true, default: poolMock }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/stairSpecialPartController.js'));
    const res = createRes();
    await controller.createSpecialPart(createReq({ body: { stpart_id: 300, stpar_desc: 'Custom Part', mat_seq_n: 7, position: 'left', unit_cost: 50 } }), res, () => {});
    expect(res.statusCode).toBe(201);
    expect(res.body.id).toBe(9);
  });

  test('updateSpecialPart returns 404 when missing', async () => {
    const dbId = path.resolve(__dirname, '../dist/config/database.js');
    jest.doMock(dbId, () => ({ __esModule: true, default: { query: jest.fn(async () => ({ rows: [] })) } }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/stairSpecialPartController.js'));
    const res = createRes();
    await controller.updateSpecialPart(createReq({ params: { id: '12' }, body: { unit_cost: 60 } }), res, () => {});
    expect(res.statusCode).toBe(404);
  });

  test('updateSpecialPart updates row when found', async () => {
    await new Promise((resolve, reject) => {
      jest.isolateModules(async () => {
        try {
          const dbId = path.resolve(__dirname, '../dist/config/database.js');
          const poolMock = { query: jest.fn(async () => ({ rows: [ { id: 12, unit_cost: 60 } ] })) };
          jest.doMock(dbId, () => ({ __esModule: true, default: poolMock }));
          const controller = require(path.resolve(__dirname, '../dist/controllers/stairSpecialPartController.js'));
          const res = createRes();
          await controller.updateSpecialPart(createReq({ params: { id: '12' }, body: { unit_cost: 60 } }), res, () => {});
          expect(res.statusCode).toBe(200);
          resolve();
        } catch (err) { reject(err); }
      });
    });
  });

  test('deleteSpecialPart returns 404 when missing', async () => {
    const dbId = path.resolve(__dirname, '../dist/config/database.js');
    jest.doMock(dbId, () => ({ __esModule: true, default: { query: jest.fn(async () => ({ rows: [] })) } }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/stairSpecialPartController.js'));
    const res = createRes();
    await controller.deleteSpecialPart(createReq({ params: { id: '77' } }), res, () => {});
    expect(res.statusCode).toBe(404);
  });

  test('deleteSpecialPart returns success when found', async () => {
    await new Promise((resolve, reject) => {
      jest.isolateModules(async () => {
        try {
          const dbId = path.resolve(__dirname, '../dist/config/database.js');
          const poolMock = { query: jest.fn(async () => ({ rows: [ { id: 77 } ] })) };
          jest.doMock(dbId, () => ({ __esModule: true, default: poolMock }));
          const controller = require(path.resolve(__dirname, '../dist/controllers/stairSpecialPartController.js'));
          const res = createRes();
          await controller.deleteSpecialPart(createReq({ params: { id: '77' } }), res, () => {});
          expect(res.statusCode).toBe(200);
          expect(String(res.body.message || '')).toMatch(/deleted successfully/);
          resolve();
        } catch (err) { reject(err); }
      });
    });
  });
});
