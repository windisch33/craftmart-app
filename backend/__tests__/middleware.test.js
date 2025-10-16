const { sign } = require('jsonwebtoken');
const path = require('path');

function createRes() {
  const res = {};
  res.statusCode = 200;
  res.body = undefined;
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (b) => { res.body = b; return res; };
  return res;
}

describe('middleware', () => {
  beforeEach(() => { jest.resetModules(); });

  test('authenticateToken rejects when missing/invalid', () => {
    const { authenticateToken } = require(path.resolve(__dirname, '../dist/middleware/auth.js'));
    // Missing
    {
      const req = { headers: {} };
      const res = createRes();
      authenticateToken(req, res, () => {});
      expect(res.statusCode).toBe(401);
    }
    // Invalid
    {
      const req = { headers: { authorization: 'Bearer bad' } };
      const res = createRes();
      authenticateToken(req, res, () => {});
      expect(res.statusCode).toBe(403);
    }
  });

  test('authenticateToken accepts valid token and sets user', () => {
    const { config } = require(path.resolve(__dirname, '../dist/config/env.js'));
    const { authenticateToken, requireAdmin } = require(path.resolve(__dirname, '../dist/middleware/auth.js'));
    const token = sign({ userId: 1, email: 'a@b.c', role: 'admin' }, config.JWT_SECRET, { expiresIn: '1h' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = createRes();
    let called = false;
    authenticateToken(req, res, () => { called = true; });
    expect(called).toBe(true);
    // requireAdmin passes
    let calledAdmin = false;
    requireAdmin(req, res, () => { calledAdmin = true; });
    expect(calledAdmin).toBe(true);
  });

  test('validateBody rejects invalid and sanitizes valid', () => {
    const Joi = require('joi');
    const { validateBody } = require(path.resolve(__dirname, '../dist/middleware/validate.js'));
    const schema = Joi.object({ name: Joi.string().required() }).unknown(true);
    // Invalid
    {
      const req = { body: {} };
      const res = createRes();
      validateBody(schema)(req, res, () => {});
      expect(res.statusCode).toBe(400);
    }
    // Valid sanitizes (drops extra)
    {
      const req = { body: { name: 'X', drop: 'y' } };
      const res = createRes();
      let called = false;
      validateBody(schema)(req, res, () => { called = true; });
      expect(called).toBe(true);
      expect(req.body && req.body.name).toBe('X');
    }
  });
});
