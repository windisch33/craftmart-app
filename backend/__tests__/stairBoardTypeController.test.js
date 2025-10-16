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

describe('stairBoardTypeController', () => {
  beforeEach(() => { jest.resetModules(); });

  test('getStairBoardTypes returns rows with pricing', async () => {
    const dbId = path.resolve(__dirname, '../dist/config/database.js');
    const poolMock = { query: jest.fn(async () => ({ rows: [ { id: 1, brd_typ_id: 2, brdtyp_des: 'Box Tread', base_price: 100 } ] })) };
    jest.doMock(dbId, () => ({ __esModule: true, default: poolMock }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/stairBoardTypeController.js'));
    const res = createRes();
    await controller.getStairBoardTypes(createReq(), res, () => {});
    expect(res.statusCode).toBe(200);
    expect(res.body[0].brdtyp_des).toBe('Box Tread');
  });

  test('createBoardType inserts type and pricing in tx, returns 201', async () => {
    const dbId = path.resolve(__dirname, '../dist/config/database.js');
    const client = {
      query: jest.fn(async (sql, params) => {
        const s = String(sql);
        if (s === 'BEGIN' || s === 'COMMIT' || s === 'ROLLBACK') return { rows: [] };
        if (s.includes('INSERT INTO stair_board_types') && s.includes('RETURNING *')) {
          return { rows: [ { id: 99, brd_typ_id: 10, brdtyp_des: 'Custom', purpose: 'tread', is_active: true } ] };
        }
        if (s.includes('INSERT INTO stair_pricing_simple')) {
          return { rows: [] };
        }
        return { rows: [] };
      }),
      release: jest.fn()
    };
    const poolMock = {
      connect: jest.fn(async () => client),
      query: jest.fn(async (sql, params) => {
        const s = String(sql);
        if (s.includes('FROM stair_board_types bt') && s.includes('LEFT JOIN stair_pricing_simple')) {
          return { rows: [ { id: 99, brd_typ_id: 10, brdtyp_des: 'Custom', base_price: 250 } ] };
        }
        return { rows: [] };
      })
    };
    jest.doMock(dbId, () => ({ __esModule: true, default: poolMock }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/stairBoardTypeController.js'));
    const res = createRes();
    await controller.createBoardType(createReq({ body: { brd_typ_id: 10, brdtyp_des: 'Custom', purpose: 'tread', base_price: 250 } }), res, () => {});
    expect(res.statusCode).toBe(201);
    expect(res.body.id).toBe(99);
    expect(client.query).toHaveBeenCalledWith('BEGIN');
    expect(client.query).toHaveBeenCalledWith('COMMIT');
  });

  test('updateBoardType returns 404 when not found', async () => {
    const dbId = path.resolve(__dirname, '../dist/config/database.js');
    const client = { query: jest.fn(async (sql) => (String(sql) === 'BEGIN' || String(sql) === 'ROLLBACK') ? { rows: [] } : { rows: [] }), release: jest.fn() };
    const poolMock = { connect: jest.fn(async () => client) };
    jest.doMock(dbId, () => ({ __esModule: true, default: poolMock }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/stairBoardTypeController.js'));
    const res = createRes();
    await controller.updateBoardType(createReq({ params: { id: '77' }, body: { brdtyp_des: 'Updated' } }), res, () => {});
    expect(res.statusCode).toBe(404);
  });

  test('updateBoardType updates type and pricing', async () => {
    const dbId = path.resolve(__dirname, '../dist/config/database.js');
    const client = {
      query: jest.fn(async (sql, params) => {
        const s = String(sql);
        if (s === 'BEGIN' || s === 'COMMIT') return { rows: [] };
        if (s.includes('UPDATE stair_board_types') && s.includes('RETURNING *')) {
          return { rows: [ { id: 77, brd_typ_id: 12, brdtyp_des: 'Updated' } ] };
        }
        if (s.includes('INSERT INTO stair_pricing_simple')) {
          return { rows: [] };
        }
        return { rows: [] };
      }),
      release: jest.fn()
    };
    const poolMock = {
      connect: jest.fn(async () => client),
      query: jest.fn(async (sql, params) => {
        const s = String(sql);
        if (s.includes('FROM stair_board_types bt') && s.includes('LEFT JOIN stair_pricing_simple') && s.includes('WHERE bt.id =')) {
          return { rows: [ { id: 77, brd_typ_id: 12, brdtyp_des: 'Updated', base_price: 300 } ] };
        }
        return { rows: [] };
      })
    };
    jest.doMock(dbId, () => ({ __esModule: true, default: poolMock }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/stairBoardTypeController.js'));
    const res = createRes();
    await controller.updateBoardType(createReq({ params: { id: '77' }, body: { base_price: 300 } }), res, () => {});
    expect(res.statusCode).toBe(200);
    expect(res.body.base_price).toBe(300);
  });

  test('deleteBoardType returns 404 when missing', async () => {
    const dbId = path.resolve(__dirname, '../dist/config/database.js');
    jest.doMock(dbId, () => ({ __esModule: true, default: { query: jest.fn(async () => ({ rows: [] })) } }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/stairBoardTypeController.js'));
    const res = createRes();
    await controller.deleteBoardType(createReq({ params: { id: '5' } }), res, () => {});
    expect(res.statusCode).toBe(404);
  });

  test('deleteBoardType returns success when found', async () => {
    await new Promise((resolve, reject) => {
      jest.isolateModules(async () => {
        try {
          const dbId = path.resolve(__dirname, '../dist/config/database.js');
          const poolMock = { query: jest.fn(async () => ({ rows: [ { id: 5 } ] })) };
          jest.doMock(dbId, () => ({ __esModule: true, default: poolMock }));
          const controller = require(path.resolve(__dirname, '../dist/controllers/stairBoardTypeController.js'));
          const res = createRes();
          await controller.deleteBoardType(createReq({ params: { id: '5' } }), res, () => {});
          expect(res.statusCode).toBe(200);
          expect(String(res.body.message || '')).toMatch(/deleted successfully/);
          resolve();
        } catch (err) { reject(err); }
      });
    });
  });
});
