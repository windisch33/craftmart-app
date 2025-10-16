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

function createReq({ params = {}, body = {} } = {}) {
  return { params, body };
}

describe('shopController.updateShopStatus', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('validates and calls service; returns success', async () => {
    const serviceModuleId = path.resolve(__dirname, '../dist/services/shopService.js');
    jest.doMock(serviceModuleId, () => ({ __esModule: true, updateShopStatus: jest.fn(async () => {}) }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/shopController.js'));

    const req = createReq({ params: { id: '88' }, body: { status: 'completed' } });
    const res = createRes();
    await controller.updateShopStatus(req, res, (e) => { throw e; });
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ message: 'Shop status updated successfully' });
  });

  test('rejects invalid status', async () => {
    const controller = require(path.resolve(__dirname, '../dist/controllers/shopController.js'));
    const req = createReq({ params: { id: '88' }, body: { status: 'bad' } });
    const res = createRes();
    await controller.updateShopStatus(req, res, (e) => { throw e; });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/Invalid status/);
  });

  test('rejects invalid id param', async () => {
    const controller = require(path.resolve(__dirname, '../dist/controllers/shopController.js'));
    const req = { params: { id: 'abc' }, body: { status: 'generated' } };
    const res = { statusCode: 200, body: undefined, status(c){this.statusCode=c;return this;}, json(b){this.body=b;return this;} };
    await controller.updateShopStatus(req, res, (e) => { throw e; });
    expect(res.statusCode).toBe(400);
  });
});
