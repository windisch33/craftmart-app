const path = require('path');
const bcrypt = require('bcryptjs');

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

function createReq({ params = {}, body = {}, user } = {}) { return { params, body, user }; }

describe('authController', () => {
  beforeEach(() => { jest.resetModules(); });

  test('register validates input and uniqueness', async () => {
    // First: missing input
    const controllerA = require(path.resolve(__dirname, '../dist/controllers/authController.js'));
    let res = createRes();
    await controllerA.register(createReq({ body: {} }), res, (e) => { throw e; });
    expect(res.statusCode).toBe(400);

    // Second: uniqueness check with DB mocked in isolated module context
    await new Promise((resolve, reject) => {
      jest.isolateModules(async () => {
        try {
          const dbId = path.resolve(__dirname, '../dist/config/database.js');
          jest.doMock(dbId, () => ({ __esModule: true, default: { query: jest.fn(async () => ({ rows: [ { id: 1 } ] })) } }));
          const controllerB = require(path.resolve(__dirname, '../dist/controllers/authController.js'));
          res = createRes();
          await controllerB.register(createReq({ body: { email: 'a@b.c', password: 'secret', first_name: 'A', last_name: 'B' } }), res, (e) => { throw e; });
          expect(res.statusCode).toBe(409);
          resolve();
        } catch (err) { reject(err); }
      });
    });
  });

  test('login validates and returns token', async () => {
    const dbId = path.resolve(__dirname, '../dist/config/database.js');
    const userRow = { id: 9, email: 'a@b.c', password_hash: await bcrypt.hash('s3cret', 1), role: 'admin' };
    jest.doMock(dbId, () => ({ __esModule: true, default: { query: jest.fn(async (sql, params) => {
      if (String(sql).includes('FROM users WHERE email =')) return { rows: [ userRow ] };
      return { rows: [] };
    }) } }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/authController.js'));
    const res = createRes();
    await controller.login(createReq({ body: { email: 'a@b.c', password: 's3cret' } }), res, (e) => { throw e; });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  test('getProfile returns user sans password', async () => {
    const dbId = path.resolve(__dirname, '../dist/config/database.js');
    jest.doMock(dbId, () => ({ __esModule: true, default: { query: jest.fn(async () => ({ rows: [ { id: 2, email: 'x@y.z', password_hash: 'h' } ] })) } }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/authController.js'));
    const res = createRes();
    await controller.getProfile(createReq({ user: { userId: 2 } }), res, (e) => { throw e; });
    expect(res.statusCode).toBe(200);
    expect(res.body).not.toHaveProperty('password_hash');
  });

  test('updateUser enforces auth and updates', async () => {
    const dbId = path.resolve(__dirname, '../dist/config/database.js');
    jest.doMock(dbId, () => ({ __esModule: true, default: { query: jest.fn(async (sql, params) => ({ rows: [ { id: 3, first_name: 'N' } ] })) } }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/authController.js'));
    const res = createRes();
    await controller.updateUser(createReq({ params: { id: '3' }, user: { userId: 3, role: 'employee' }, body: { first_name: 'N' } }), res, (e) => { throw e; });
    expect(res.statusCode).toBe(200);
  });

  test('createUser only admin', async () => {
    const controller = require(path.resolve(__dirname, '../dist/controllers/authController.js'));
    let res = createRes();
    await controller.createUser(createReq({ user: { role: 'employee' } }), res, (e) => { throw e; });
    expect(res.statusCode).toBe(403);
  });

  test('deleteUser rejects self-delete', async () => {
    const controller = require(path.resolve(__dirname, '../dist/controllers/authController.js'));
    const res = createRes();
    await controller.deleteUser(createReq({ params: { id: '7' }, user: { role: 'admin', userId: 7 } }), res, (e) => { throw e; });
    expect(res.statusCode).toBe(400);
  });

  test('resetUserPassword enforces admin and ok', async () => {
    const dbId = path.resolve(__dirname, '../dist/config/database.js');
    jest.doMock(dbId, () => ({ __esModule: true, default: { query: jest.fn(async () => ({ rows: [ { id: 4 } ] })) } }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/authController.js'));
    const res = createRes();
    await controller.resetUserPassword(createReq({ params: { id: '4' }, user: { role: 'admin' }, body: { newPassword: 'password8' } }), res, (e) => { throw e; });
    expect(res.statusCode).toBe(200);
  });
});
