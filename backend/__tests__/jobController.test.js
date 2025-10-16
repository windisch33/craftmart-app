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

function createReq({ params = {}, body = {}, query = {} } = {}) {
  return { params, body, query };
}

describe('jobController basic flows', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('createJob validates title and project/customer presence', async () => {
    const controller = require(path.resolve(__dirname, '../dist/controllers/jobController.js'));
    let res = createRes();
    await controller.createJob(createReq({ body: {} }), res, (e) => { throw e; });
    expect(res.statusCode).toBe(400);
    expect(String(res.body.error || '')).toMatch(/Title is required/);
  });

  test('createJob happy path with project -> derives customer and tax, inserts job', async () => {
    const databaseModuleId = path.resolve(__dirname, '../dist/config/database.js');
    const poolMock = {
      query: jest.fn(async (sql, params) => {
        const s = String(sql);
        if (s.includes('SELECT customer_id FROM jobs WHERE id =')) {
          return { rows: [ { customer_id: 10 } ] };
        }
        if (s.includes('SELECT state FROM customers WHERE id =')) {
          return { rows: [ { state: 'OH' } ] };
        }
        if (s.includes('SELECT rate FROM tax_rates WHERE state_code')) {
          return { rows: [ { rate: 0.06 } ] };
        }
        if (s.includes('INSERT INTO job_items') && s.includes('RETURNING *')) {
          return { rows: [ { id: 123, customer_id: 10, title: 'New Job', status: 'quote', tax_rate: 0.06 } ] };
        }
        return { rows: [] };
      })
    };
    jest.doMock(databaseModuleId, () => ({ __esModule: true, default: poolMock }));

    const controller = require(path.resolve(__dirname, '../dist/controllers/jobController.js'));
    const res = createRes();
    await controller.createJob(createReq({ body: { project_id: 99, title: 'New Job' } }), res, (e) => { throw e; });
    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({ id: 123, customer_id: 10, status: 'quote' });
  });

  test('createJobSection validates name and inserts', async () => {
    const controller = require(path.resolve(__dirname, '../dist/controllers/jobController.js'));
    let res = createRes();
    await controller.createJobSection(createReq({ params: { jobId: '123' }, body: {} }), res, (e) => { throw e; });
    expect(res.statusCode).toBe(400);

    await new Promise((resolve, reject) => {
      jest.isolateModules(async () => {
        try {
          const databaseModuleId = path.resolve(__dirname, '../dist/config/database.js');
          const poolMock = { query: jest.fn(async (sql, params) => ({ rows: [ { id: 5, job_item_id: 123, name: 'Main', display_order: 0 } ] })) };
          jest.doMock(databaseModuleId, () => ({ __esModule: true, default: poolMock }));
          const controller2 = require(path.resolve(__dirname, '../dist/controllers/jobController.js'));
          res = createRes();
          await controller2.createJobSection(createReq({ params: { jobId: '123' }, body: { name: 'Main' } }), res, (e) => { throw e; });
          expect(res.statusCode).toBe(201);
          resolve();
        } catch (err) { reject(err); }
      });
    });
  });

  test('addQuoteItem rejects when section does not belong to job', async () => {
    const databaseModuleId = path.resolve(__dirname, '../dist/config/database.js');
    const poolMock = { query: jest.fn(async (sql, params) => {
      if (String(sql).includes('SELECT 1 FROM job_sections WHERE id') && String(sql).includes('AND job_item_id')) {
        return { rowCount: 0, rows: [] };
      }
      return { rows: [] };
    }) };
    jest.doMock(databaseModuleId, () => ({ __esModule: true, default: poolMock }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/jobController.js'));
    const res = createRes();
    await controller.addQuoteItem(createReq({ params: { jobId: '200', sectionId: '5' }, body: { description: 'Rail', quantity: 1, unit_price: 100 } }), res, (e) => { throw e; });
    expect(res.statusCode).toBe(400);
    expect(String(res.body.error || '')).toMatch(/Section does not belong/);
  });

  test('addQuoteItem happy path inserts and updates totals', async () => {
    const databaseModuleId = path.resolve(__dirname, '../dist/config/database.js');
    const poolMock = { query: jest.fn(async (sql, params) => {
      const s = String(sql);
      if (s.includes('SELECT 1 FROM job_sections WHERE id') && s.includes('AND job_item_id')) {
        return { rowCount: 1, rows: [ { '?column?': 1 } ] };
      }
      if (s.startsWith('INSERT INTO quote_items')) {
        return { rows: [ { id: 900, job_item_id: 200, section_id: 5, description: 'Item' } ] };
      }
      if (s.includes('FROM quote_items') && s.includes('WHERE job_item_id =')) {
        return { rows: [ { taxable_total: 100, non_taxable_total: 50, subtotal: 150 } ] };
      }
      if (s.includes('SELECT tax_rate FROM job_items WHERE id =')) {
        return { rows: [ { tax_rate: 0.06 } ] };
      }
      if (s.startsWith('UPDATE job_items SET subtotal =')) {
        return { rows: [] };
      }
      return { rows: [] };
    }) };
    jest.doMock(databaseModuleId, () => ({ __esModule: true, default: poolMock }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/jobController.js'));
    const res = createRes();
    await controller.addQuoteItem(createReq({ params: { jobId: '200', sectionId: '5' }, body: { description: 'Tread', quantity: 1, unit_price: 100, is_taxable: true } }), res, (e) => { throw e; });
    expect(res.statusCode).toBe(201);
    expect(res.body.id).toBe(900);
  });

  test('updateJob updates fields, recalculates totals and invalidates cache', async () => {
    const databaseModuleId = path.resolve(__dirname, '../dist/config/database.js');
    const poolMock = { query: jest.fn(async (sql, params) => {
      const s = String(sql);
      if (s.startsWith('UPDATE job_items SET') && s.includes('RETURNING *')) {
        return { rows: [ { id: 321, status: 'order' } ] };
      }
      if (s.includes('FROM quote_items') && s.includes('WHERE job_item_id =')) {
        return { rows: [ { taxable_total: 0, non_taxable_total: 0, subtotal: 0 } ] };
      }
      if (s.includes('SELECT tax_rate FROM job_items WHERE id =')) {
        return { rows: [ { tax_rate: 0.06 } ] };
      }
      if (s.startsWith('UPDATE job_items SET subtotal =')) {
        return { rows: [] };
      }
      return { rows: [] };
    }) };
    jest.doMock(databaseModuleId, () => ({ __esModule: true, default: poolMock }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/jobController.js'));
    const res = createRes();
    await controller.updateJob(createReq({ params: { id: '321' }, body: { status: 'order' } }), res, (e) => { throw e; });
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('order');
  });

  test('updateQuoteItem rejects invalid handrail length', async () => {
    const databaseModuleId = path.resolve(__dirname, '../dist/config/database.js');
    const poolMock = { query: jest.fn(async (sql, params) => {
      const s = String(sql);
      if (s.includes('SELECT product_type FROM products WHERE id =')) {
        return { rows: [ { product_type: 'handrail' } ] };
      }
      if (s.includes('SELECT job_item_id as job_id FROM quote_items WHERE id =')) {
        return { rows: [ { job_id: 1 } ] };
      }
      return { rows: [] };
    }) };
    jest.doMock(databaseModuleId, () => ({ __esModule: true, default: poolMock }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/jobController.js'));
    const res = createRes();
    await controller.updateQuoteItem(createReq({ params: { itemId: '10' }, body: { product_id: 5, length_inches: 7 } }), res, (e) => { throw e; });
    expect(res.statusCode).toBe(400);
    expect(String(res.body.error || '')).toMatch(/Handrail length/);
  });

  test('deleteQuoteItem deletes item and updates totals', async () => {
    const databaseModuleId = path.resolve(__dirname, '../dist/config/database.js');
    const poolMock = { query: jest.fn(async (sql, params) => {
      const s = String(sql);
      if (s.includes('SELECT job_item_id as job_id FROM quote_items WHERE id =')) {
        return { rows: [ { job_id: 333 } ] };
      }
      if (s.startsWith('DELETE FROM quote_items WHERE id =')) {
        return { rows: [ { id: 77 } ] };
      }
      if (s.includes('FROM quote_items') && s.includes('WHERE job_item_id =')) {
        return { rows: [ { taxable_total: 0, non_taxable_total: 0, subtotal: 0 } ] };
      }
      if (s.includes('SELECT tax_rate FROM job_items WHERE id =')) {
        return { rows: [ { tax_rate: 0 } ] };
      }
      if (s.startsWith('UPDATE job_items SET subtotal =')) {
        return { rows: [] };
      }
      return { rows: [] };
    }) };
    jest.doMock(databaseModuleId, () => ({ __esModule: true, default: poolMock }));
    const controller = require(path.resolve(__dirname, '../dist/controllers/jobController.js'));
    const res = createRes();
    await controller.deleteQuoteItem(createReq({ params: { itemId: '77' } }), res, (e) => { throw e; });
    expect(res.statusCode).toBe(200);
    expect(String(res.body.message || '')).toMatch(/deleted successfully/);
  });
});
