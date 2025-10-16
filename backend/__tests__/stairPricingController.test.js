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

function createReq({ query = {}, body = {} } = {}) { return { query, body }; }

describe('stairPricingController', () => {
  beforeEach(() => { jest.resetModules(); });

  test('getStairPriceRules returns rows and respects boardTypeId', async () => {
    const dbId = path.resolve(__dirname, '../dist/config/database.js');
    const calls = [];
    jest.doMock(dbId, () => ({ __esModule: true, default: { query: jest.fn(async (sql, params) => { calls.push({ sql: String(sql), params }); return { rows: [ { id: 1, board_type_id: 2 } ] }; }) } }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/stairPricingController.js'));
    const res = createRes();
    await controller.getStairPriceRules(createReq({ query: { boardTypeId: '2' } }), res, () => {});
    expect(res.statusCode).toBe(200);
    const select = calls.find(c => c.sql.includes('FROM stair_pricing_simple'));
    expect(select.params).toContain('2');
  });

  test('calculateStairPrice aggregates totals using simplified function', async () => {
    const dbId = path.resolve(__dirname, '../dist/config/database.js');
    jest.doMock(dbId, () => ({ __esModule: true, default: { query: jest.fn(async (sql, params) => {
      const s = String(sql);
      if (s.includes('calculate_stair_price_simple')) {
        // Return deterministic price parts
        return { rows: [ { base_price: 10, length_charge: 2, width_charge: 3, mitre_charge: 0, material_multiplier: 1, unit_price: 15, total_price: 15 * (params?.[4] || 1) } ] };
      }
      if (s.includes('FROM calculate_stair_price_simple') || s.includes('SELECT')) {
        return { rows: [ ] };
      }
      return { rows: [] };
    }) } }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/stairPricingController.js'));
    const res = createRes();
    await controller.calculateStairPrice(createReq({ body: {
      floorToFloor: 112,
      jobId: 1,
      numRisers: 14,
      treads: [ { riserNumber: 1, type: 'box', stairWidth: 42 } ],
      treadMaterialId: 5,
      riserMaterialId: 4,
      roughCutWidth: 10,
      noseSize: 1.25,
      stringerType: '1x9.25_Poplar',
      stringerMaterialId: 7,
      includeLandingTread: true,
      individualStringers: { left: { width: 9.25, thickness: 1, materialId: 7 }, right: { width: 9.25, thickness: 1, materialId: 7 } }
    } }), res, () => {});
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('subtotal');
    expect(res.body).toHaveProperty('total');
  });
});

