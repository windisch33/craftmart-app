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

describe('shopController list endpoints', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('getAllShops returns list from service', async () => {
    const serviceModuleId = path.resolve(__dirname, '../dist/services/shopService.js');
    const mockGetAllShops = jest.fn(async () => [{ id: 1 }, { id: 2 }]);
    jest.doMock(serviceModuleId, () => ({ __esModule: true, getAllShops: mockGetAllShops }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/shopController.js'));
    const res = createRes();
    await controller.getAllShops({}, res, (e) => { throw e; });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  test('getAvailableOrders forwards filter to service', async () => {
    const serviceModuleId = path.resolve(__dirname, '../dist/services/shopService.js');
    const mockGetAvailableOrders = jest.fn(async () => [{ id: 10 }]);
    jest.doMock(serviceModuleId, () => ({ __esModule: true, getAvailableOrders: mockGetAvailableOrders }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/shopController.js'));
    const res = createRes();
    const req = createReq({ query: { filter: 'unrun' } });
    await controller.getAvailableOrders(req, res, (e) => { throw e; });
    expect(mockGetAvailableOrders).toHaveBeenCalledWith('unrun');
    expect(res.body[0].id).toBe(10);
  });
});

