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

describe('stairMaterialController', () => {
  beforeEach(() => { jest.resetModules(); });

  test('getStairMaterials returns rows', async () => {
    const dbId = path.resolve(__dirname, '../dist/config/database.js');
    const poolMock = { query: jest.fn(async () => ({ rows: [ { id: 1, material_name: 'Oak', multiplier: 1.1 } ] })) };
    jest.doMock(dbId, () => ({ __esModule: true, default: poolMock }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/stairMaterialController.js'));
    const res = createRes();
    await controller.getStairMaterials(createReq(), res, (e) => { throw e; });
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
  });

  test('createStairMaterial inserts and returns 201', async () => {
    const dbId = path.resolve(__dirname, '../dist/config/database.js');
    const calls = [];
    const poolMock = { query: jest.fn(async (sql, params) => {
      const s = String(sql); calls.push({ s, params });
      if (s.includes('SELECT COALESCE(MAX(material_id), 0) + 1')) {
        return { rows: [ { next_id: 5 } ] };
      }
      if (s.startsWith('INSERT INTO material_multipliers')) {
        return { rows: [ { material_id: 5, material_name: 'Walnut', multiplier: 1.25, is_active: true } ] };
      }
      return { rows: [] };
    }) };
    jest.doMock(dbId, () => ({ __esModule: true, default: poolMock }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/stairMaterialController.js'));
    const res = createRes();
    await controller.createStairMaterial(createReq({ body: { material_name: 'Walnut', multiplier: 1.25 } }), res, (e) => { throw e; });
    expect(res.statusCode).toBe(201);
    expect(res.body.material_id).toBe(5);
  });

  test('updateStairMaterial returns 404 when missing', async () => {
    const dbId = path.resolve(__dirname, '../dist/config/database.js');
    jest.doMock(dbId, () => ({ __esModule: true, default: { query: jest.fn(async () => ({ rows: [] })) } }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/stairMaterialController.js'));
    const res = createRes();
    await controller.updateStairMaterial(createReq({ params: { id: '10' }, body: { multiplier: 1.05 } }), res, (e) => { throw e; });
    expect(res.statusCode).toBe(404);
  });

  test('updateStairMaterial updates row when found', async () => {
    await new Promise((resolve, reject) => {
      jest.isolateModules(async () => {
        try {
          const dbId = path.resolve(__dirname, '../dist/config/database.js');
          const poolMock = { query: jest.fn(async () => ({ rows: [ { material_id: 10, multiplier: 1.05 } ] })) };
          jest.doMock(dbId, () => ({ __esModule: true, default: poolMock }));
          const controller = require(path.resolve(__dirname, '../dist/controllers/stairMaterialController.js'));
          const res = createRes();
          await controller.updateStairMaterial(createReq({ params: { id: '10' }, body: { multiplier: 1.05 } }), res, (e) => { throw e; });
          expect(res.statusCode).toBe(200);
          resolve();
        } catch (err) { reject(err); }
      });
    });
  });

  test('deleteStairMaterial returns 404 when missing', async () => {
    const dbId = path.resolve(__dirname, '../dist/config/database.js');
    jest.doMock(dbId, () => ({ __esModule: true, default: { query: jest.fn(async () => ({ rows: [] })) } }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/stairMaterialController.js'));
    const res = createRes();
    await controller.deleteStairMaterial(createReq({ params: { id: '7' } }), res, (e) => { throw e; });
    expect(res.statusCode).toBe(404);
  });

  test('deleteStairMaterial returns success when found', async () => {
    await new Promise((resolve, reject) => {
      jest.isolateModules(async () => {
        try {
          const dbId = path.resolve(__dirname, '../dist/config/database.js');
          const poolMock = { query: jest.fn(async () => ({ rows: [ { material_id: 7 } ] })) };
          jest.doMock(dbId, () => ({ __esModule: true, default: poolMock }));
          const controller = require(path.resolve(__dirname, '../dist/controllers/stairMaterialController.js'));
          const res = createRes();
          await controller.deleteStairMaterial(createReq({ params: { id: '7' } }), res, (e) => { throw e; });
          expect(res.statusCode).toBe(200);
          expect(String(res.body.message || '')).toMatch(/deleted successfully/);
          resolve();
        } catch (err) { reject(err); }
      });
    });
  });
});
