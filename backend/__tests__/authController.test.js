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

  test('register rejects short password', async () => {
    const controller = require(path.resolve(__dirname, '../dist/controllers/authController.js'));
    const res = createRes();
    await controller.register(createReq({ body: { email: 'a@b.c', password: '123', first_name: 'A', last_name: 'B' } }), res, (e) => { throw e; });
    expect(res.statusCode).toBe(400);
    expect(String(res.body.error || '')).toMatch(/Password must be at least 6/);
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

  test('login 400 when missing credentials', async () => {
    const controller = require(path.resolve(__dirname, '../dist/controllers/authController.js'));
    const res = createRes();
    await controller.login(createReq({ body: {} }), res, (e) => { throw e; });
    expect(res.statusCode).toBe(400);
  });

  test('login 401 when user not found', async () => {
    const dbId = path.resolve(__dirname, '../dist/config/database.js');
    jest.doMock(dbId, () => ({ __esModule: true, default: { query: jest.fn(async () => ({ rows: [] })) } }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/authController.js'));
    const res = createRes();
    await controller.login(createReq({ body: { email: 'x@y.z', password: 'p' } }), res, (e) => { throw e; });
    expect(res.statusCode).toBe(401);
  });

  test('login 401 when password invalid', async () => {
    const dbId = path.resolve(__dirname, '../dist/config/database.js');
    const hashed = await bcrypt.hash('correct', 1);
    jest.doMock(dbId, () => ({ __esModule: true, default: { query: jest.fn(async (sql) => {
      if (String(sql).includes('FROM users WHERE email =')) return { rows: [ { id: 1, email: 'u@e.com', password_hash: hashed, role: 'employee', is_active: true } ] };
      return { rows: [] };
    }) } }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/authController.js'));
    const res = createRes();
    await controller.login(createReq({ body: { email: 'u@e.com', password: 'wrong' } }), res, (e) => { throw e; });
    expect(res.statusCode).toBe(401);
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

  test('getProfile 404 when not found', async () => {
    const dbId = path.resolve(__dirname, '../dist/config/database.js');
    jest.doMock(dbId, () => ({ __esModule: true, default: { query: jest.fn(async () => ({ rows: [] })) } }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/authController.js'));
    const res = createRes();
    await controller.getProfile(createReq({ user: { userId: 99 } }), res, (e) => { throw e; });
    expect(res.statusCode).toBe(404);
  });

  test('getAllUsers requires admin', async () => {
    const controller = require(path.resolve(__dirname, '../dist/controllers/authController.js'));
    const res = createRes();
    await controller.getAllUsers(createReq({ user: { role: 'employee' } }), res, (e) => { throw e; });
    expect(res.statusCode).toBe(403);
  });

  test('getAllUsers returns list for admin', async () => {
    await new Promise((resolve, reject) => {
      jest.isolateModules(async () => {
        try {
          const dbId = path.resolve(__dirname, '../dist/config/database.js');
          jest.doMock(dbId, () => ({ __esModule: true, default: { query: jest.fn(async () => ({ rows: [ { id: 1, email: 'a@b.c', password_hash: 'h' } ] })) } }));
          const controller = require(path.resolve(__dirname, '../dist/controllers/authController.js'));
          const res = createRes();
          await controller.getAllUsers(createReq({ user: { role: 'admin' } }), res, (e) => { throw e; });
          expect(res.statusCode).toBe(200);
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(1);
          expect(res.body[0]).not.toHaveProperty('password_hash');
          resolve();
        } catch (err) { reject(err); }
      });
    });
  });

  test('updateUser enforces auth and updates', async () => {
    const dbId = path.resolve(__dirname, '../dist/config/database.js');
    jest.doMock(dbId, () => ({ __esModule: true, default: { query: jest.fn(async (sql, params) => ({ rows: [ { id: 3, first_name: 'N' } ] })) } }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/authController.js'));
    const res = createRes();
    await controller.updateUser(createReq({ params: { id: '3' }, user: { userId: 3, role: 'employee' }, body: { first_name: 'N' } }), res, (e) => { throw e; });
    expect(res.statusCode).toBe(200);
  });

  test('updateUser unauthorized when not admin and not self', async () => {
    const controller = require(path.resolve(__dirname, '../dist/controllers/authController.js'));
    const res = createRes();
    await controller.updateUser(createReq({ params: { id: '4' }, user: { userId: 3, role: 'employee' }, body: { first_name: 'X' } }), res, (e) => { throw e; });
    expect(res.statusCode).toBe(403);
  });

  test('updateUser 400 when no valid fields', async () => {
    const controller = require(path.resolve(__dirname, '../dist/controllers/authController.js'));
    const res = createRes();
    await controller.updateUser(createReq({ params: { id: '3' }, user: { userId: 1, role: 'admin' }, body: {} }), res, (e) => { throw e; });
    expect(res.statusCode).toBe(400);
  });

  test('updateUser 404 when not found', async () => {
    const dbId = path.resolve(__dirname, '../dist/config/database.js');
    jest.doMock(dbId, () => ({ __esModule: true, default: { query: jest.fn(async () => ({ rows: [] })) } }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/authController.js'));
    const res = createRes();
    await controller.updateUser(createReq({ params: { id: '3' }, user: { userId: 1, role: 'admin' }, body: { first_name: 'X' } }), res, (e) => { throw e; });
    expect(res.statusCode).toBe(404);
  });

  test('updateUser admin can update role and is_active', async () => {
    await new Promise((resolve, reject) => {
      jest.isolateModules(async () => {
        try {
          const dbId = path.resolve(__dirname, '../dist/config/database.js');
          jest.doMock(dbId, () => ({ __esModule: true, default: { query: jest.fn(async () => ({ rows: [ { id: 3, email: 'x@y.z', role: 'manager', is_active: false } ] })) } }));
          const controller = require(path.resolve(__dirname, '../dist/controllers/authController.js'));
          const res = createRes();
          await controller.updateUser(createReq({ params: { id: '3' }, user: { userId: 1, role: 'admin' }, body: { role: 'manager', is_active: false } }), res, (e) => { throw e; });
          expect(res.statusCode).toBe(200);
          expect(res.body).not.toHaveProperty('password_hash');
          resolve();
        } catch (err) { reject(err); }
      });
    });
  });

  test('createUser only admin', async () => {
    const controller = require(path.resolve(__dirname, '../dist/controllers/authController.js'));
    let res = createRes();
    await controller.createUser(createReq({ user: { role: 'employee' } }), res, (e) => { throw e; });
    expect(res.statusCode).toBe(403);
  });

  test('createUser rejects invalid email, short password, and missing fields', async () => {
    const controller = require(path.resolve(__dirname, '../dist/controllers/authController.js'));
    let res = createRes();
    await controller.createUser(createReq({ user: { role: 'admin' }, body: {} }), res, (e) => { throw e; });
    expect(res.statusCode).toBe(400);
    res = createRes();
    await controller.createUser(createReq({ user: { role: 'admin' }, body: { email: 'bad', password: 'password8', first_name: 'A', last_name: 'B' } }), res, (e) => { throw e; });
    expect(res.statusCode).toBe(400);
    res = createRes();
    await controller.createUser(createReq({ user: { role: 'admin' }, body: { email: 'ok@a.b', password: 'short', first_name: 'A', last_name: 'B' } }), res, (e) => { throw e; });
    expect(res.statusCode).toBe(400);
  });

  test('createUser 409 when email exists; 201 on success', async () => {
    const dbId = path.resolve(__dirname, '../dist/config/database.js');
    // conflict branch
    await new Promise((resolve, reject) => {
      jest.isolateModules(async () => {
        try {
          jest.doMock(dbId, () => ({ __esModule: true, default: { query: jest.fn(async (sql) => {
            if (String(sql).includes('SELECT id FROM users WHERE email =')) return { rows: [ { id: 1 } ] };
            return { rows: [] };
          }) } }));
          const controllerA = require(path.resolve(__dirname, '../dist/controllers/authController.js'));
          const resA = createRes();
          await controllerA.createUser(createReq({ user: { role: 'admin' }, body: { email: 'a@b.c', password: 'password8', first_name: 'A', last_name: 'B' } }), resA, (e) => { throw e; });
          expect(resA.statusCode).toBe(409);
          resolve();
        } catch (err) { reject(err); }
      });
    });

    // success branch
    await new Promise((resolve, reject) => {
      jest.isolateModules(async () => {
        try {
          jest.doMock(dbId, () => ({ __esModule: true, default: { query: jest.fn(async (sql) => {
            if (String(sql).includes('SELECT id FROM users WHERE email =')) return { rows: [] };
            if (String(sql).includes('INSERT INTO users')) return { rows: [ { id: 5, email: 'a@b.c', password_hash: 'h' } ] };
            return { rows: [] };
          }) } }));
          const controllerB = require(path.resolve(__dirname, '../dist/controllers/authController.js'));
          const resB = createRes();
          await controllerB.createUser(createReq({ user: { role: 'admin' }, body: { email: 'a@b.c', password: 'password8', first_name: 'A', last_name: 'B' } }), resB, (e) => { throw e; });
          expect(resB.statusCode).toBe(201);
          expect(resB.body.user).not.toHaveProperty('password_hash');
          resolve();
        } catch (err) { reject(err); }
      });
    });
  });

  test('deleteUser rejects self-delete', async () => {
    const controller = require(path.resolve(__dirname, '../dist/controllers/authController.js'));
    const res = createRes();
    await controller.deleteUser(createReq({ params: { id: '7' }, user: { role: 'admin', userId: 7 } }), res, (e) => { throw e; });
    expect(res.statusCode).toBe(400);
  });

  test('deleteUser requires admin', async () => {
    const controller = require(path.resolve(__dirname, '../dist/controllers/authController.js'));
    const res = createRes();
    await controller.deleteUser(createReq({ params: { id: '2' }, user: { role: 'employee', userId: 1 } }), res, (e) => { throw e; });
    expect(res.statusCode).toBe(403);
  });

  test('deleteUser 404 when not found', async () => {
    await new Promise((resolve, reject) => {
      jest.isolateModules(async () => {
        try {
          const dbId = path.resolve(__dirname, '../dist/config/database.js');
          jest.doMock(dbId, () => ({ __esModule: true, default: { query: jest.fn(async () => ({ rows: [] })) } }));
          const controller = require(path.resolve(__dirname, '../dist/controllers/authController.js'));
          const res = createRes();
          await controller.deleteUser(createReq({ params: { id: '9' }, user: { role: 'admin', userId: 1 } }), res, (e) => { throw e; });
          expect(res.statusCode).toBe(404);
          resolve();
        } catch (err) { reject(err); }
      });
    });
  });

  test('deleteUser success', async () => {
    await new Promise((resolve, reject) => {
      jest.isolateModules(async () => {
        try {
          const dbId = path.resolve(__dirname, '../dist/config/database.js');
          jest.doMock(dbId, () => ({ __esModule: true, default: { query: jest.fn(async () => ({ rows: [ { id: 9 } ] })) } }));
          const controller = require(path.resolve(__dirname, '../dist/controllers/authController.js'));
          const res = createRes();
          await controller.deleteUser(createReq({ params: { id: '9' }, user: { role: 'admin', userId: 1 } }), res, (e) => { throw e; });
          expect(res.statusCode).toBe(200);
          expect(String(res.body.message || '')).toMatch(/deactivated successfully|User deactivated successfully/);
          resolve();
        } catch (err) { reject(err); }
      });
    });
  });

  test('resetUserPassword enforces admin and ok', async () => {
    const dbId = path.resolve(__dirname, '../dist/config/database.js');
    jest.doMock(dbId, () => ({ __esModule: true, default: { query: jest.fn(async () => ({ rows: [ { id: 4 } ] })) } }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/authController.js'));
    const res = createRes();
    await controller.resetUserPassword(createReq({ params: { id: '4' }, user: { role: 'admin' }, body: { newPassword: 'password8' } }), res, (e) => { throw e; });
    expect(res.statusCode).toBe(200);
  });

  test('resetUserPassword rejects non-admin', async () => {
    const controller = require(path.resolve(__dirname, '../dist/controllers/authController.js'));
    const res = createRes();
    await controller.resetUserPassword(createReq({ params: { id: '4' }, user: { role: 'employee' }, body: { newPassword: 'password8' } }), res, (e) => { throw e; });
    expect(res.statusCode).toBe(403);
  });

  test('resetUserPassword short password', async () => {
    const controller = require(path.resolve(__dirname, '../dist/controllers/authController.js'));
    const res = createRes();
    await controller.resetUserPassword(createReq({ params: { id: '4' }, user: { role: 'admin' }, body: { newPassword: 'short' } }), res, (e) => { throw e; });
    expect(res.statusCode).toBe(400);
  });

  test('resetUserPassword 404 when missing', async () => {
    await new Promise((resolve, reject) => {
      jest.isolateModules(async () => {
        try {
          const dbId = path.resolve(__dirname, '../dist/config/database.js');
          jest.doMock(dbId, () => ({ __esModule: true, default: { query: jest.fn(async () => ({ rows: [] })) } }));
          const controller = require(path.resolve(__dirname, '../dist/controllers/authController.js'));
          const res = createRes();
          await controller.resetUserPassword(createReq({ params: { id: '4' }, user: { role: 'admin' }, body: { newPassword: 'password8' } }), res, (e) => { throw e; });
          expect(res.statusCode).toBe(404);
          resolve();
        } catch (err) { reject(err); }
      });
    });
  });
});
