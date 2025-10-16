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

describe('shopController PDF downloads', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('downloadShopPaper sets headers and sends buffer', async () => {
    const pdfServiceModuleId = path.resolve(__dirname, '../dist/services/pdfService.js');
    jest.doMock(pdfServiceModuleId, () => ({ __esModule: true, generateShopPaper: jest.fn(async () => Buffer.from('PDFDATA')) }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/shopController.js'));
    const res = createRes();
    await controller.downloadShopPaper(createReq({ params: { id: '5' } }), res, (e) => { throw e; });
    expect(res.headers['Content-Type']).toBe('application/pdf');
    expect(res.body).toBeInstanceOf(Buffer);
  });

  test('downloadCutList sets headers and sends buffer', async () => {
    const pdfServiceModuleId = path.resolve(__dirname, '../dist/services/pdfService.js');
    jest.doMock(pdfServiceModuleId, () => ({ __esModule: true, generateCutList: jest.fn(async () => Buffer.from('PDFDATA2')) }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/shopController.js'));
    const res = createRes();
    await controller.downloadCutList(createReq({ params: { id: '6' } }), res, (e) => { throw e; });
    expect(res.headers['Content-Type']).toBe('application/pdf');
    expect(res.body).toBeInstanceOf(Buffer);
  });
});

