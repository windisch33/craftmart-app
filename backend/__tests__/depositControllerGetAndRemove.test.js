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

function createReq({ params = {} } = {}) {
  return { params };
}

describe('depositController getDepositById and removeAllocation', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('getDepositById validates id', async () => {
    const controller = require(path.resolve(__dirname, '../dist/controllers/depositController.js'));
    const res = createRes();
    await controller.getDepositById(createReq({ params: { id: 'abc' } }), res, (e) => { throw e; });
    expect(res.statusCode).toBe(400);
  });

  test('getDepositById returns deposit via service', async () => {
    const serviceModuleId = path.resolve(__dirname, '../dist/services/depositService.js');
    const mockGet = jest.fn(async (id) => ({ id, customerId: 1, totalAmount: 100, unallocatedAmount: 0, allocations: [] }));
    jest.doMock(serviceModuleId, () => ({ __esModule: true, getDepositById: mockGet }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/depositController.js'));
    const res = createRes();
    await controller.getDepositById(createReq({ params: { id: '77' } }), res, (e) => { throw e; });
    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(77);
  });

  test('removeAllocation validates id', async () => {
    const controller = require(path.resolve(__dirname, '../dist/controllers/depositController.js'));
    const res = createRes();
    await controller.removeAllocation(createReq({ params: { allocationId: 'x' } }), res, (e) => { throw e; });
    expect(res.statusCode).toBe(400);
  });

  test('removeAllocation returns updated deposit via services', async () => {
    const serviceModuleId = path.resolve(__dirname, '../dist/services/depositService.js');
    const mockRemove = jest.fn(async (allocationId) => ({ depositId: 99 }));
    const mockGet = jest.fn(async (id) => ({ id, customerId: 2, totalAmount: 200, unallocatedAmount: 50, allocations: [] }));
    jest.doMock(serviceModuleId, () => ({ __esModule: true, removeAllocation: mockRemove, getDepositById: mockGet }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/depositController.js'));
    const res = createRes();
    await controller.removeAllocation(createReq({ params: { allocationId: '123' } }), res, (e) => { throw e; });
    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(99);
    expect(mockRemove).toHaveBeenCalledWith(123);
  });
});

