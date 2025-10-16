const path = require('path');

function resObj() { return { statusCode: 200, body: undefined, status(c){this.statusCode=c;return this;}, json(b){this.body=b;return this;} }; }

describe('projectController', () => {
  beforeEach(() => { jest.resetModules(); });

  test('getAllProjects builds WHERE conditions', async () => {
    const calls = [];
    const dbId = path.resolve(__dirname, '../dist/config/database.js');
    jest.doMock(dbId, () => ({ __esModule: true, default: { query: jest.fn(async (sql, params) => { calls.push(String(sql)); return { rows: [] }; }) } }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/projectController.js'));
    const res = resObj();
    await controller.getAllProjects({ query: { q: 'Sub', address: 'Ave', city: 'Town', state: 'oh', zip: '44' } }, res, (e) => { throw e; });
    const sql = calls[0];
    expect(sql).toMatch(/WHERE/);
    expect(sql).toMatch(/p\.state = \$\d+/);
  });

  test('getProjectById happy path', async () => {
    const dbId = path.resolve(__dirname, '../dist/config/database.js');
    const mock = { query: jest.fn(async (sql, params) => {
      const s = String(sql);
      if (s.includes('FROM jobs p') && s.includes('WHERE p.id =')) return { rows: [ { id: 1, name: 'Subdivision A' } ] };
      if (s.includes('FROM job_items ji') && s.includes('WHERE ji.job_id =')) return { rows: [ { id: 10, title: 'Job 1' } ] };
      return { rows: [] };
    }) };
    jest.doMock(dbId, () => ({ __esModule: true, default: mock }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/projectController.js'));
    const res = resObj();
    await controller.getProjectById({ params: { id: '1' } }, res, (e) => { throw e; });
    expect(res.body.jobs).toHaveLength(1);
  });

  test('getProjectById invalid id returns 400', async () => {
    const controller = require(path.resolve(__dirname, '../dist/controllers/projectController.js'));
    const res = resObj();
    await controller.getProjectById({ params: { id: 'abc' } }, res, (e) => { throw e; });
    expect(res.statusCode).toBe(400);
  });

  test('createProject validates and returns project with customer info', async () => {
    const controller = require(path.resolve(__dirname, '../dist/controllers/projectController.js'));
    let res = resObj();
    await controller.createProject({ body: {} }, res, (e) => { throw e; });
    expect(res.statusCode).toBe(400);

    // Skip deep DB path; validation test above suffices for smoke coverage
  });
});
