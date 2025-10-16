const path = require('path');

describe('rateLimiter', () => {
  beforeEach(() => { jest.resetModules(); });

  test('loginRateLimiter skips in test env', async () => {
    const { loginRateLimiter } = require(path.resolve(__dirname, '../dist/middleware/rateLimiter.js'));
    const req = { headers: {}, ip: '127.0.0.1' };
    const res = { status: (c) => { res.statusCode = c; return res; }, json: (b) => { res.body = b; return res; } };
    let called = false;
    await loginRateLimiter(req, res, () => { called = true; });
    expect(called).toBe(true);
  });
});

