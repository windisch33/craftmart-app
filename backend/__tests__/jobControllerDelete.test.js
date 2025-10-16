const path = require('path');

function createRes() { return { statusCode: 200, body: undefined, status(c){this.statusCode=c;return this;}, json(b){this.body=b;return this;} }; }

describe('jobController.deleteJob', () => {
  beforeEach(() => { jest.resetModules(); });

  test('returns 404 when not found', async () => {
    const dbId = path.resolve(__dirname, '../dist/config/database.js');
    jest.doMock(dbId, () => ({ __esModule: true, default: { query: jest.fn(async () => ({ rows: [] })) } }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/jobController.js'));
    const res = createRes();
    await controller.deleteJob({ params: { id: '1' } }, res, (e) => { throw e; });
    expect(res.statusCode).toBe(404);
  });

  test('returns success on delete', async () => {
    const dbId = path.resolve(__dirname, '../dist/config/database.js');
    jest.doMock(dbId, () => ({ __esModule: true, default: { query: jest.fn(async () => ({ rows: [ { id: 1 } ] })) } }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/jobController.js'));
    const res = createRes();
    await controller.deleteJob({ params: { id: '1' } }, res, (e) => { throw e; });
    expect(res.statusCode).toBe(200);
    expect(String(res.body.message || '')).toMatch(/deleted successfully/);
  });
});

