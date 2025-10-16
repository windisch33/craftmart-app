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

function createReq({ query = {} } = {}) {
  return { query };
}

describe('depositController.listDeposits', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('passes validated query to service and returns list', async () => {
    const serviceModuleId = path.resolve(__dirname, '../dist/services/depositService.js');
    const mockGetDeposits = jest.fn(async () => [{ id: 1 }, { id: 2 }]);
    jest.doMock(serviceModuleId, () => ({ __esModule: true, getDeposits: mockGetDeposits, SUPPORTED_PAYMENT_METHODS: ['check','cash','credit_card','ach','wire','other'] }));

    const controller = require(path.resolve(__dirname, '../dist/controllers/depositController.js'));
    const req = createReq({ query: { customer_id: '123', payment_method: 'check', status: 'partial', limit: '10', offset: '5' } });
    const res = createRes();
    await controller.listDeposits(req, res, (e) => { throw e; });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(mockGetDeposits).toHaveBeenCalledWith({ customerId: 123, paymentMethod: 'check', status: 'partial', limit: 10, offset: 5 });
  });

  test('rejects invalid payment_method', async () => {
    const controller = require(path.resolve(__dirname, '../dist/controllers/depositController.js'));
    const req = createReq({ query: { payment_method: 'bitcoin' } });
    const res = createRes();
    await controller.listDeposits(req, res, (e) => { throw e; });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/payment_method must be one of/);
  });

  test('rejects invalid status', async () => {
    const controller = require(path.resolve(__dirname, '../dist/controllers/depositController.js'));
    const req = createReq({ query: { status: 'weird' } });
    const res = createRes();
    await controller.listDeposits(req, res, (e) => { throw e; });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/status must be one of/);
  });
});

