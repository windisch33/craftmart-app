const path = require('path');

function resObj() { return { statusCode: 200, body: undefined, status(c){this.statusCode=c;return this;}, json(b){this.body=b;return this;} }; }

describe('materialController', () => {
  beforeEach(() => { jest.resetModules(); });

  test('getAllMaterials returns rows', async () => {
    const dbId = path.resolve(__dirname, '../dist/config/database.js');
    jest.doMock(dbId, () => ({ __esModule: true, default: { query: jest.fn(async () => ({ rows: [ { id: 1, name: 'Oak' } ] })) } }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/materialController.js'));
    const res = resObj();
    await controller.getAllMaterials({}, res, (e) => { throw e; });
    expect(res.body[0].name).toBe('Oak');
  });

  test('getMaterialById 404 when missing', async () => {
    const dbId = path.resolve(__dirname, '../dist/config/database.js');
    jest.doMock(dbId, () => ({ __esModule: true, default: { query: jest.fn(async () => ({ rows: [] })) } }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/materialController.js'));
    const res = resObj();
    await controller.getMaterialById({ params: { id: '1' } }, res, (e) => { throw e; });
    expect(res.statusCode).toBe(404);
  });

  test('createMaterial validates and inserts', async () => {
    const controller = require(path.resolve(__dirname, '../dist/controllers/materialController.js'));
    let res = resObj();
    await controller.createMaterial({ body: {} }, res, (e) => { throw e; });
    expect(res.statusCode).toBe(400);

    await new Promise((resolve, reject) => {
      jest.isolateModules(async () => {
        try {
          const dbId = path.resolve(__dirname, '../dist/config/database.js');
          jest.doMock(dbId, () => ({ __esModule: true, default: { query: jest.fn(async () => ({ rows: [ { id: 3, name: 'Pine' } ] })) } }));
          const controller2 = require(path.resolve(__dirname, '../dist/controllers/materialController.js'));
          res = resObj();
          await controller2.createMaterial({ body: { name: 'Pine', multiplier: 1.2 } }, res, (e) => { throw e; });
          expect(res.statusCode).toBe(201);
          resolve();
        } catch (err) { reject(err); }
      });
    });
  });

  test('updateMaterial validates and updates', async () => {
    const controller = require(path.resolve(__dirname, '../dist/controllers/materialController.js'));
    let res = resObj();
    await controller.updateMaterial({ params: { id: '2' }, body: {} }, res, (e) => { throw e; });
    expect(res.statusCode).toBe(400);

    await new Promise((resolve, reject) => {
      jest.isolateModules(async () => {
        try {
          const dbId = path.resolve(__dirname, '../dist/config/database.js');
          jest.doMock(dbId, () => ({ __esModule: true, default: { query: jest.fn(async () => ({ rows: [ { id: 2, name: 'Oak', multiplier: 1.3 } ] })) } }));
          const controller2 = require(path.resolve(__dirname, '../dist/controllers/materialController.js'));
          res = resObj();
          await controller2.updateMaterial({ params: { id: '2' }, body: { name: 'Oak', multiplier: 1.3 } }, res, (e) => { throw e; });
          expect(res.statusCode).toBe(200);
          resolve();
        } catch (err) { reject(err); }
      });
    });
  });

  test('deleteMaterial prevents deletion when used', async () => {
    await new Promise((resolve, reject) => {
      jest.isolateModules(async () => {
        try {
          const dbId = path.resolve(__dirname, '../dist/config/database.js');
          const mock = { query: jest.fn(async (sql, params) => {
            const s = String(sql);
            if (s.includes('SELECT COUNT(*) FROM quote_items WHERE material_id')) {
              return { rows: [ { count: '1' } ] };
            }
            return { rows: [] };
          }) };
          jest.doMock(dbId, () => ({ __esModule: true, default: mock }));
          const controller = require(path.resolve(__dirname, '../dist/controllers/materialController.js'));
          const res = resObj();
          await controller.deleteMaterial({ params: { id: '2' } }, res, (e) => { throw e; });
          expect(res.statusCode).toBe(409);
          resolve();
        } catch (err) { reject(err); }
      });
    });
  });
});
