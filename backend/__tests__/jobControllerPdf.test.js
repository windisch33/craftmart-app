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

function createReq({ params = {}, query = {} } = {}) { return { params, query }; }

describe('jobController PDF endpoints', () => {
  beforeEach(() => { jest.resetModules(); });

  test('generateJobPDFEndpoint 404 when job not found', async () => {
    const dbId = path.resolve(__dirname, '../dist/config/database.js');
    jest.doMock(dbId, () => ({ __esModule: true, default: { query: jest.fn(async () => ({ rows: [] })) } }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/jobController.js'));
    const res = createRes();
    await controller.generateJobPDFEndpoint(createReq({ params: { id: '999' } }), res, (e) => { throw e; });
    expect(res.statusCode).toBe(404);
  });

  test('generateJobPDFEndpoint returns PDF with headers', async () => {
    const dbId = path.resolve(__dirname, '../dist/config/database.js');
    const pdfServiceId = path.resolve(__dirname, '../dist/services/pdfService.js');
    jest.doMock(dbId, () => ({ __esModule: true, default: { query: jest.fn(async (sql, params) => {
      if (String(sql).includes('FROM job_items j') && String(sql).includes('WHERE j.id =')) {
        return { rows: [ { id: 7, status: 'order', customer_name: 'Acme', project_name: 'Subdivision' } ] };
      }
      return { rows: [] };
    }) } }));
    jest.doMock(pdfServiceId, () => ({ __esModule: true, generateJobPDF: jest.fn(async () => Buffer.from('PDF')), getJobPDFFilename: jest.fn(() => 'Job_7.pdf') }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/jobController.js'));
    const res = createRes();
    await controller.generateJobPDFEndpoint(createReq({ params: { id: '7' }, query: { showLinePricing: 'false' } }), res, (e) => { throw e; });
    expect(res.statusCode).toBe(200);
    expect(res.headers['Content-Type']).toBe('application/pdf');
    expect(Buffer.isBuffer(res.body)).toBe(true);
  });

  test('clearPDFCacheEndpoint clears by jobId and all', async () => {
    const controller = require(path.resolve(__dirname, '../dist/controllers/jobController.js'));
    // specific job
    let res = createRes();
    await controller.clearPDFCacheEndpoint(createReq({ params: { jobId: '5' } }), res, (e) => { throw e; });
    expect(res.statusCode).toBe(200);
    expect(String(res.body.message || '')).toMatch(/cleared for job 5/);
    // all
    res = createRes();
    await controller.clearPDFCacheEndpoint(createReq({ params: {} }), res, (e) => { throw e; });
    expect(res.statusCode).toBe(200);
    expect(String(res.body.message || '')).toMatch(/All PDF cache cleared/);
  });
});

