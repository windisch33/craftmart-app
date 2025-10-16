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

function createReq(query = {}) { return { query }; }

describe('reportsController (more endpoints)', () => {
  beforeEach(() => { jest.resetModules(); });

  test('salesBySalesman JSON + CSV', async () => {
    const salesQueriesId = path.resolve(__dirname, '../dist/services/reports/data/salesQueries.js');
    const csvId = path.resolve(__dirname, '../dist/services/reports/format/csv.js');
    const rows = [{ key_id: 9, key_name: 'Sam Seller', invoices: 2, subtotal: 100, tax: 6, total: 106, avg_invoice: 53, last_invoice_date: '2025-01-05' }];
    jest.doMock(salesQueriesId, () => ({ __esModule: true, getSalesBySalesman: jest.fn(async () => rows) }));
    let controller = require(path.resolve(__dirname, '../dist/controllers/reportsController.js'));
    let res = createRes();
    await controller.salesBySalesman(createReq({ start: '2025-01-01', end: '2025-01-31' }), res, (e) => { throw e; });
    expect(Array.isArray(res.body)).toBe(true);

    jest.resetModules();
    jest.doMock(salesQueriesId, () => ({ __esModule: true, getSalesBySalesman: jest.fn(async () => rows) }));
    jest.doMock(csvId, () => ({ __esModule: true, toCsv: jest.fn(() => 'csv-salesman'), sendCsv: (res, name, data) => { res.setHeader('Content-Type', 'text/csv'); res.send(data); return res; } }));
    controller = require(path.resolve(__dirname, '../dist/controllers/reportsController.js'));
    res = createRes();
    await controller.salesBySalesman(createReq({ start: '2025-01-01', end: '2025-01-31', export: 'csv' }), res, (e) => { throw e; });
    expect(res.headers['Content-Type']).toBe('text/csv');
    expect(res.body).toBe('csv-salesman');
  });

  test('salesByCustomer JSON + CSV', async () => {
    const salesQueriesId = path.resolve(__dirname, '../dist/services/reports/data/salesQueries.js');
    const csvId = path.resolve(__dirname, '../dist/services/reports/format/csv.js');
    const rows = [{ key_id: 101, key_name: 'Acme', invoices: 4, subtotal: 400, tax: 24, total: 424, avg_invoice: 106, last_invoice_date: '2025-01-09' }];
    jest.doMock(salesQueriesId, () => ({ __esModule: true, getSalesByCustomer: jest.fn(async () => rows) }));
    let controller = require(path.resolve(__dirname, '../dist/controllers/reportsController.js'));
    let res = createRes();
    await controller.salesByCustomer(createReq({ start: '2025-01-01', end: '2025-01-31' }), res, (e) => { throw e; });
    expect(Array.isArray(res.body)).toBe(true);

    jest.resetModules();
    jest.doMock(salesQueriesId, () => ({ __esModule: true, getSalesByCustomer: jest.fn(async () => rows) }));
    jest.doMock(csvId, () => ({ __esModule: true, toCsv: jest.fn(() => 'csv-customer'), sendCsv: (res, name, data) => { res.setHeader('Content-Type', 'text/csv'); res.send(data); return res; } }));
    controller = require(path.resolve(__dirname, '../dist/controllers/reportsController.js'));
    res = createRes();
    await controller.salesByCustomer(createReq({ start: '2025-01-01', end: '2025-01-31', export: 'csv' }), res, (e) => { throw e; });
    expect(res.headers['Content-Type']).toBe('text/csv');
    expect(res.body).toBe('csv-customer');
  });

  test('taxByState JSON + CSV', async () => {
    const taxQueriesId = path.resolve(__dirname, '../dist/services/reports/data/taxQueries.js');
    const csvId = path.resolve(__dirname, '../dist/services/reports/format/csv.js');
    const rows = [{ state: 'OH', invoices: 10, subtotal: 1000, tax: 60, total: 1060 }];
    jest.doMock(taxQueriesId, () => ({ __esModule: true, getTaxByState: jest.fn(async () => rows) }));
    let controller = require(path.resolve(__dirname, '../dist/controllers/reportsController.js'));
    let res = createRes();
    await controller.taxByState(createReq({ start: '2025-01-01', end: '2025-01-31' }), res, (e) => { throw e; });
    expect(res.body[0].state).toBe('OH');

    jest.resetModules();
    jest.doMock(taxQueriesId, () => ({ __esModule: true, getTaxByState: jest.fn(async () => rows) }));
    jest.doMock(csvId, () => ({ __esModule: true, toCsv: jest.fn(() => 'csv-tax'), sendCsv: (res, name, data) => { res.setHeader('Content-Type', 'text/csv'); res.send(data); return res; } }));
    controller = require(path.resolve(__dirname, '../dist/controllers/reportsController.js'));
    res = createRes();
    await controller.taxByState(createReq({ start: '2025-01-01', end: '2025-01-31', export: 'csv' }), res, (e) => { throw e; });
    expect(res.headers['Content-Type']).toBe('text/csv');
    expect(res.body).toBe('csv-tax');
  });

  test('arUnpaid JSON + CSV', async () => {
    const arQueriesId = path.resolve(__dirname, '../dist/services/reports/data/arQueries.js');
    const csvId = path.resolve(__dirname, '../dist/services/reports/format/csv.js');
    const rows = [{ invoice_id: 1, invoice_number: 'INV-1', order_id: 5, order_number: '#5', po_number: null, job_title: 'Lot A', customer_id: 101, customer_name: 'Acme', salesman_id: 9, salesman_name: 'Sam', invoice_date: '2025-01-10', due_date: '2025-02-10', amount: 100, paid: 0, balance: 100 }];
    jest.doMock(arQueriesId, () => ({ __esModule: true, getUnpaid: jest.fn(async () => rows), getAging: jest.fn() }));
    let controller = require(path.resolve(__dirname, '../dist/controllers/reportsController.js'));
    let res = createRes();
    await controller.arUnpaid(createReq({ start: '2025-01-01', end: '2025-01-31' }), res, (e) => { throw e; });
    expect(res.body[0].invoice_id).toBe(1);

    jest.resetModules();
    jest.doMock(arQueriesId, () => ({ __esModule: true, getUnpaid: jest.fn(async () => rows), getAging: jest.fn() }));
    jest.doMock(csvId, () => ({ __esModule: true, toCsv: jest.fn(() => 'csv-unpaid'), sendCsv: (res, name, data) => { res.setHeader('Content-Type', 'text/csv'); res.send(data); return res; } }));
    controller = require(path.resolve(__dirname, '../dist/controllers/reportsController.js'));
    res = createRes();
    await controller.arUnpaid(createReq({ start: '2025-01-01', end: '2025-01-31', export: 'csv' }), res, (e) => { throw e; });
    expect(res.headers['Content-Type']).toBe('text/csv');
    expect(res.body).toBe('csv-unpaid');
  });

  test('arAging JSON + CSV', async () => {
    const arQueriesId = path.resolve(__dirname, '../dist/services/reports/data/arQueries.js');
    const csvId = path.resolve(__dirname, '../dist/services/reports/format/csv.js');
    const rows = [{ customer_id: 101, customer_name: 'Acme', current: 100, d1_30: 50, d31_60: 0, d61_90: 0, d90_plus: 0, invoices: 2, total: 150 }];
    jest.doMock(arQueriesId, () => ({ __esModule: true, getAging: jest.fn(async () => rows) }));
    let controller = require(path.resolve(__dirname, '../dist/controllers/reportsController.js'));
    let res = createRes();
    await controller.arAging(createReq({ asOf: '2025-01-31' }), res, (e) => { throw e; });
    expect(res.body[0].customer_id).toBe(101);

    jest.resetModules();
    jest.doMock(arQueriesId, () => ({ __esModule: true, getAging: jest.fn(async () => rows) }));
    jest.doMock(csvId, () => ({ __esModule: true, toCsv: jest.fn(() => 'csv-aging'), sendCsv: (res, name, data) => { res.setHeader('Content-Type', 'text/csv'); res.send(data); return res; } }));
    controller = require(path.resolve(__dirname, '../dist/controllers/reportsController.js'));
    res = createRes();
    await controller.arAging(createReq({ asOf: '2025-01-31', export: 'csv' }), res, (e) => { throw e; });
    expect(res.headers['Content-Type']).toBe('text/csv');
    expect(res.body).toBe('csv-aging');
  });

  test('listInvoices JSON + CSV', async () => {
    const dbId = path.resolve(__dirname, '../dist/config/database.js');
    const csvId = path.resolve(__dirname, '../dist/services/reports/format/csv.js');
    const row = { invoice_id: 1, invoice_number: 'INV-1', order_id: 5, order_number: 'O-5', po_number: null, job_title: 'Job A', customer_id: 101, customer_name: 'Acme', salesman_id: 9, salesman_name: 'Sam', invoice_date: '2025-01-10', due_date: '2025-02-10', paid_date: null, subtotal: 100, labor_total: 0, tax: 6, total: 106, paid_amount: 50, open_balance: 56 };
    jest.doMock(dbId, () => ({ __esModule: true, default: { query: jest.fn(async () => ({ rows: [row] })) } }));
    let controller = require(path.resolve(__dirname, '../dist/controllers/reportsController.js'));
    let res = createRes();
    await controller.listInvoices(createReq({ start: '2025-01-01', end: '2025-01-31' }), res, (e) => { throw e; });
    expect(res.body[0]).toMatchObject({ invoice_id: 1, order_id: 5, total: 106, open_balance: 56 });

    jest.resetModules();
    jest.doMock(dbId, () => ({ __esModule: true, default: { query: jest.fn(async () => ({ rows: [row] })) } }));
    jest.doMock(csvId, () => ({ __esModule: true, toCsv: jest.fn(() => 'csv-invoices'), sendCsv: (res, name, data) => { res.setHeader('Content-Type', 'text/csv'); res.send(data); return res; } }));
    controller = require(path.resolve(__dirname, '../dist/controllers/reportsController.js'));
    res = createRes();
    await controller.listInvoices(createReq({ start: '2025-01-01', end: '2025-01-31', export: 'csv' }), res, (e) => { throw e; });
    expect(res.headers['Content-Type']).toBe('text/csv');
    expect(res.body).toBe('csv-invoices');
  });
});

