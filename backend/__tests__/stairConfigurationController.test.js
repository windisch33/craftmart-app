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

function createReq({ params = {}, body = {} } = {}) { return { params, body }; }

describe('stairConfigurationController', () => {
  beforeEach(() => { jest.resetModules(); });

  test('createStairConfiguration inserts config + items in tx', async () => {
    const dbId = path.resolve(__dirname, '../dist/config/database.js');
    const client = {
      query: jest.fn(async (sql, params) => {
        const s = String(sql);
        if (s.startsWith('INSERT INTO stair_configurations') && s.includes('RETURNING *')) {
          return { rows: [ { id: 55, job_id: 100, config_name: 'Main' } ] };
        }
        return { rows: [] };
      }),
      release: jest.fn(),
    };
    const poolMock = { connect: jest.fn(async () => client) };
    jest.doMock(dbId, () => ({ __esModule: true, default: poolMock }));

    const controller = require(path.resolve(__dirname, '../dist/controllers/stairConfigurationController.js'));
    const res = createRes();
    await controller.createStairConfiguration(createReq({ body: { jobId: 100, configName: 'Main', floorToFloor: 112, numRisers: 14, treadMaterialId: 5, riserMaterialId: 4, roughCutWidth: 10, noseSize: 1.25, items: [ { itemType: 'tread', riserNumber: 1, treadType: 'box', stairWidth: 42, totalWidth: 11.25, materialId: 5, quantity: 1, unitPrice: 0, totalPrice: 0 } ] } }), res, () => {});
    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({ id: 55 });
    expect(client.query).toHaveBeenCalledWith('BEGIN');
    expect(client.query).toHaveBeenCalledWith('COMMIT');
  });

  test('getStairConfiguration 404 when not found', async () => {
    const dbId = path.resolve(__dirname, '../dist/config/database.js');
    jest.doMock(dbId, () => ({ __esModule: true, default: { query: jest.fn(async () => ({ rows: [] })) } }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/stairConfigurationController.js'));
    const res = createRes();
    await controller.getStairConfiguration(createReq({ params: { id: '1' } }), res, () => {});
    expect(res.statusCode).toBe(404);
  });

  test('getStairConfiguration returns config with items', async () => {
    const dbId = path.resolve(__dirname, '../dist/config/database.js');
    const poolMock = { query: jest.fn(async (sql, params) => {
      const s = String(sql);
      if (s.includes('FROM stair_configurations c') && s.includes('WHERE c.id =')) {
        return { rows: [ { id: 70, config_name: 'Main', tread_material_name: 'Oak', riser_material_name: 'Primed' } ] };
      }
      if (s.includes('FROM stair_config_items ci') && s.includes('WHERE ci.config_id =')) {
        return { rows: [ { id: 1, item_type: 'tread', material_name: 'Oak' } ] };
      }
      return { rows: [] };
    }) };
    jest.doMock(dbId, () => ({ __esModule: true, default: poolMock }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/stairConfigurationController.js'));
    const res = createRes();
    await controller.getStairConfiguration(createReq({ params: { id: '70' } }), res, () => {});
    expect(res.statusCode).toBe(200);
    expect(res.body.items).toHaveLength(1);
  });

  test('getJobStairConfigurations returns rows', async () => {
    const dbId = path.resolve(__dirname, '../dist/config/database.js');
    jest.doMock(dbId, () => ({ __esModule: true, default: { query: jest.fn(async () => ({ rows: [ { id: 1 }, { id: 2 } ] })) } }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/stairConfigurationController.js'));
    const res = createRes();
    await controller.getJobStairConfigurations(createReq({ params: { jobId: '100' } }), res, () => {});
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('deleteStairConfiguration happy path', async () => {
    const dbId = path.resolve(__dirname, '../dist/config/database.js');
    jest.doMock(dbId, () => ({ __esModule: true, default: { query: jest.fn(async () => ({ rows: [ { id: 9 } ] })) } }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/stairConfigurationController.js'));
    const res = createRes();
    await controller.deleteStairConfiguration(createReq({ params: { id: '9' } }), res, () => {});
    expect(res.statusCode).toBe(200);
    expect(String(res.body.message || '')).toMatch(/deleted successfully/);
  });
});
