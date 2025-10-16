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

function createReq({ params = {}, body = {}, user } = {}) {
  return { params, body, user };
}

describe('depositController.allocateDeposit', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('returns 401 without user', async () => {
    const controller = require(path.resolve(__dirname, '../dist/controllers/depositController.js'));
    const req = createReq({ params: { id: '10' }, body: { allocations: [ { job_id: 1, job_item_id: 2, amount: 5 } ] } });
    const res = createRes();
    await controller.allocateDeposit(req, res, (e) => { throw e; });
    expect(res.statusCode).toBe(401);
  });

  test('returns 400 on invalid deposit id', async () => {
    const controller = require(path.resolve(__dirname, '../dist/controllers/depositController.js'));
    const req = createReq({ params: { id: 'abc' }, body: { allocations: [ { job_id: 1, job_item_id: 2, amount: 5 } ] }, user: { userId: 9 } });
    const res = createRes();
    await controller.allocateDeposit(req, res, (e) => { throw e; });
    expect(res.statusCode).toBe(400);
  });

  test('returns 400 on empty allocations', async () => {
    const controller = require(path.resolve(__dirname, '../dist/controllers/depositController.js'));
    const req = createReq({ params: { id: '10' }, body: { allocations: [] }, user: { userId: 9 } });
    const res = createRes();
    await controller.allocateDeposit(req, res, (e) => { throw e; });
    expect(res.statusCode).toBe(400);
    expect(String(res.body.error || '')).toMatch(/allocations/);
  });

  test('calls service and returns 200 on success', async () => {
    const serviceModuleId = path.resolve(__dirname, '../dist/services/depositService.js');
    const mockAllocate = jest.fn(async ({ depositId, allocations, userId }) => ({ id: depositId, customerId: 1, totalAmount: 100, unallocatedAmount: 0, allocations: allocations.map(a => ({ ...a })) }));
    jest.doMock(serviceModuleId, () => ({ __esModule: true, allocateDeposit: mockAllocate }));

    const controller = require(path.resolve(__dirname, '../dist/controllers/depositController.js'));
    const req = createReq({ params: { id: '44' }, user: { userId: 9 }, body: { allocations: [ { job_id: 70, job_item_id: 701, amount: 50 } ] } });
    const res = createRes();
    await controller.allocateDeposit(req, res, (e) => { throw e; });
    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(44);
    expect(Array.isArray(res.body.allocations)).toBe(true);
    expect(mockAllocate).toHaveBeenCalled();
  });
});

