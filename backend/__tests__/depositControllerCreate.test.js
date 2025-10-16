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

function createReq({ body = {}, user } = {}) {
  return { body, user };
}

describe('depositController.createDeposit', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('returns 401 without user', async () => {
    const controller = require(path.resolve(__dirname, '../dist/controllers/depositController.js'));
    const res = createRes();
    await controller.createDeposit(createReq({ body: {} }), res, (e) => { throw e; });
    expect(res.statusCode).toBe(401);
  });

  test('validates required fields and payment method', async () => {
    const controller = require(path.resolve(__dirname, '../dist/controllers/depositController.js'));
    // missing customer_id
    let res = createRes();
    await controller.createDeposit(createReq({ user: { userId: 1 }, body: { payment_method: 'check', total_amount: '100' } }), res, (e) => { throw e; });
    expect(res.statusCode).toBe(400);
    // invalid payment method
    res = createRes();
    await controller.createDeposit(createReq({ user: { userId: 1 }, body: { customer_id: '1', payment_method: 'crypto', total_amount: '100' } }), res, (e) => { throw e; });
    expect(res.statusCode).toBe(400);
  });

  test('calls service on success', async () => {
    const serviceModuleId = path.resolve(__dirname, '../dist/services/depositService.js');
    const mockCreate = jest.fn(async () => ({ id: 88, customerId: 1, totalAmount: 100, unallocatedAmount: 0, allocations: [] }));
    jest.doMock(serviceModuleId, () => ({ __esModule: true, createDeposit: mockCreate, SUPPORTED_PAYMENT_METHODS: ['check','cash','credit_card','ach','wire','other'] }));

    const controller = require(path.resolve(__dirname, '../dist/controllers/depositController.js'));
    const res = createRes();
    await controller.createDeposit(createReq({ user: { userId: 9 }, body: { customer_id: '123', payment_method: 'check', total_amount: '100' } }), res, (e) => { throw e; });
    expect(res.statusCode).toBe(201);
    expect(res.body.id).toBe(88);
    expect(mockCreate).toHaveBeenCalled();
  });
});

