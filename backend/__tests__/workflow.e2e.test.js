const path = require('path');

// Resolve compiled module IDs used by controllers/services under test
const databaseModuleId = path.resolve(__dirname, '../dist/config/database.js');

// Small Express-like response mock
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

function createReq({ params = {}, body = {}, query = {}, user } = {}) {
  return {
    params,
    body,
    query,
    headers: {},
    user,
  };
}

// Build a programmable DB mock with minimal in-memory state
function makeDbMock() {
  const state = {
    ids: { customer: 100, salesman: 200, project: 300, jobItem: 400, section: 500, stairConfig: 600, quoteItem: 700, deposit: 800, allocation: 900, shop: 1000 },
    customers: [], // {id, name, state, ...}
    salesmen: [], // {id, first_name, last_name, email, phone}
    projects: [], // jobs table: {id, customer_id, name}
    job_items: [], // {id, job_id, customer_id, salesman_id, title, status, tax_rate, subtotal, labor_total, tax_amount, total_amount, shops_run}
    sections: [], // {id, job_item_id, name}
    stair_configs: [], // {id, job_item_id}
    stair_config_items: [], // minimal
    quote_items: [], // {id, job_item_id, section_id, line_total, is_taxable, stair_config_id, part_number}
    deposits: [], // {id, customer_id, total_amount, payment_method, reference_number, payment_date, deposit_date, notes, created_by}
    deposit_allocations: [], // {id, deposit_id, job_id, job_item_id, amount, notes, created_by, created_at}
    shops: [], // {id, shop_number, status, generated_date, cut_sheets, notes, created_at}
    shop_jobs: [], // {shop_id, job_id, job_title, customer_name, job_location, delivery_date}
  };

  // Helpers
  const nextId = (key) => ++state.ids[key];
  const nowIso = () => new Date().toISOString();

  function findCustomerById(id) { return state.customers.find(c => c.id === Number(id)); }
  function findProjectById(id) { return state.projects.find(p => p.id === Number(id)); }
  function findJobItemById(id) { return state.job_items.find(j => j.id === Number(id)); }

  const commonQuery = async (sql, params = []) => {
    sql = String(sql);

    // Schema checks for deposits
    if (sql.includes("to_regclass('public.deposits')")) {
      return { rows: [{ deposits: 'deposits', allocations: 'deposit_allocations', view: 'deposits_with_balance' }] };
    }
    if (sql.includes('information_schema.columns') && sql.includes("deposit_allocations") && sql.includes("job_item_id")) {
      return { rows: [{ column_name: 'job_item_id' }] };
    }
    if (sql.includes('information_schema.columns') && sql.includes("table_name = 'job_items'")) {
      // Expose expected job_items columns
      return { rows: [ 'title','status','description','total_amount','created_at' ].map(c => ({ column_name: c })) };
    }
    if (sql.includes('information_schema.columns') && sql.includes("table_name = 'jobs'")) {
      // expose optional columns for getCustomerJobs ordering
      return { rows: [ 'name','title','status','total_amount','total_deposits','balance_due','updated_at','created_at' ].map(c => ({ column_name: c })) };
    }

    // Customers
    if (sql.startsWith('INSERT INTO customers')) {
      const [name, address, city, stateCode, zip, phone, mobile, fax, email, accounting_email, notes] = params;
      const row = { id: nextId('customer'), name, address, city, state: stateCode, zip_code: zip, phone, mobile, fax, email, accounting_email, notes, created_at: nowIso(), updated_at: nowIso() };
      state.customers.push(row);
      return { rows: [row] };
    }
    if (sql.includes('SELECT id FROM customers WHERE id =')) {
      const id = params[0];
      const c = findCustomerById(id);
      return { rows: c ? [{ id: c.id }] : [] };
    }
    if (sql.includes('SELECT state FROM customers WHERE id =')) {
      const id = params[0];
      const c = findCustomerById(id);
      return { rows: c ? [{ state: c.state }] : [] };
    }
    if (sql.includes('SELECT * FROM customers WHERE id =')) {
      const id = params[0];
      const c = findCustomerById(id);
      return { rows: c ? [c] : [] };
    }
    if (sql.startsWith('UPDATE customers SET last_visited_at')) {
      return { rows: [] };
    }

    // Salesmen
    if (sql.includes('SELECT id FROM salesmen WHERE email =')) {
      return { rows: [] };
    }
    if (sql.startsWith('INSERT INTO salesmen')) {
      const [first_name, last_name, email, phone, commission_rate, notes] = params;
      const row = { id: nextId('salesman'), first_name, last_name, email, phone, commission_rate, notes, is_active: true, created_at: nowIso(), updated_at: nowIso() };
      state.salesmen.push(row);
      return { rows: [row] };
    }

    // Projects (table: jobs)
    if (sql.includes('INSERT INTO jobs (customer_id, name)') || (sql.includes('INSERT INTO jobs') && sql.includes('(customer_id, name)'))) {
      const [customer_id, name] = params;
      const row = { id: nextId('project'), customer_id: Number(customer_id), name, created_at: nowIso(), updated_at: nowIso() };
      state.projects.push(row);
      return { rows: [row] };
    }
    if (sql.includes('FROM jobs p') && sql.includes('JOIN customers c') && sql.includes('WHERE p.id =')) {
      const id = Number(params[0]);
      const p = findProjectById(id);
      const c = p ? findCustomerById(p.customer_id) : undefined;
      if (!p || !c) return { rows: [] };
      return { rows: [{ ...p, customer_name: c.name, customer_city: c.city, customer_state: c.state }] };
    }
    if (sql.includes('SELECT customer_id FROM jobs WHERE id =')) {
      const id = Number(params[0]);
      const p = findProjectById(id);
      return { rows: p ? [{ customer_id: p.customer_id }] : [] };
    }

    // Tax rate lookup
    if (sql.includes('SELECT rate FROM tax_rates')) {
      // simple default tax rate for test
      return { rows: [{ rate: 0.06 }] };
    }

    // Job Items (quotes/orders/invoices)
    if (sql.startsWith('INSERT INTO job_items')) {
      const [customer_id, job_id, salesman_id, title, description, status, delivery_date, job_location, order_designation, model_name, installer, terms, show_line_pricing, tax_rate] = params;
      const row = {
        id: nextId('jobItem'), job_id: job_id || null, customer_id: Number(customer_id), salesman_id: salesman_id || null,
        title, description, status: status || 'quote', delivery_date, job_location, order_designation, model_name,
        installer, terms, show_line_pricing, tax_rate: Number(tax_rate) || 0,
        subtotal: 0, labor_total: 0, tax_amount: 0, total_amount: 0, shops_run: false, created_at: nowIso(), updated_at: nowIso()
      };
      state.job_items.push(row);
      return { rows: [row] };
    }
    if (sql.startsWith('UPDATE job_items SET') && sql.includes('WHERE id =') && sql.includes('subtotal =')) {
      // Totals update
      const [subtotal, labor_total, tax_amount, total_amount, id] = params.map(v => (typeof v === 'string' ? Number(v) : v));
      const row = findJobItemById(id);
      if (row) {
        row.subtotal = Number(subtotal) || 0;
        row.labor_total = Number(labor_total) || 0;
        row.tax_amount = Number(tax_amount) || 0;
        row.total_amount = Number(total_amount) || 0;
        row.updated_at = nowIso();
        return { rows: [row] };
      }
      return { rows: [] };
    }
    if (sql.startsWith('UPDATE job_items SET') && sql.includes('WHERE id =')) {
      // General update (e.g., status updates)
      const id = params[params.length - 1];
      const row = findJobItemById(id);
      if (!row) return { rows: [] };
      const lowered = sql.toLowerCase();
      if (lowered.includes('status = $1')) {
        row.status = params[0];
      }
      if (lowered.includes('delivery_date = $') && params[1] && typeof params[1] === 'string') {
        row.delivery_date = params[1];
      }
      row.updated_at = nowIso();
      return { rows: [row] };
    }
    if (sql.includes('SELECT j.*,') && sql.includes('FROM job_items j') && sql.includes('LATERAL (') && sql.includes('WHERE j.id =')) {
      // getJobById
      const id = Number(params[0]);
      const j = findJobItemById(id);
      if (!j) return { rows: [] };
      const c = findCustomerById(j.customer_id) || {};
      const s = state.salesmen.find(x => x.id === j.salesman_id) || {};
      const deposit_total = state.deposit_allocations.filter(a => a.job_item_id === id).reduce((acc, a) => acc + a.amount, 0);
      const balance_due = Number(((j.total_amount || 0) - deposit_total).toFixed(2));
      return { rows: [{ ...j, customer_name: c.name, customer_state: c.state, salesman_first_name: s.first_name, salesman_last_name: s.last_name, deposit_total, balance_due }] };
    }

    // Sections
    if (sql.startsWith('INSERT INTO job_sections')) {
      const [job_item_id, name, display_order] = params;
      const row = { id: nextId('section'), job_item_id: Number(job_item_id), name, display_order: display_order || 0 };
      state.sections.push(row);
      return { rows: [row] };
    }
    if (sql.includes('SELECT * FROM job_sections WHERE job_item_id =')) {
      const jobId = Number(params[0]);
      return { rows: state.sections.filter(s => s.job_item_id === jobId) };
    }

    // Quote items + stair config
    if (sql.startsWith('INSERT INTO stair_configurations')) {
      const row = { id: nextId('stairConfig'), job_item_id: Number(params[0]) };
      state.stair_configs.push(row);
      return { rows: [row] };
    }
    if (sql.startsWith('INSERT INTO stair_config_items')) {
      // not used by controllers result
      const row = { id: state.stair_config_items.length + 1 };
      state.stair_config_items.push(row);
      return { rows: [] };
    }
    if (sql.startsWith('INSERT INTO quote_items')) {
      const [job_item_id, section_id, part_number, description, quantity, unit_price, line_total, is_taxable, , , stair_config_id] = params;
      const row = {
        id: nextId('quoteItem'), job_item_id: Number(job_item_id), section_id: Number(section_id),
        part_number, description, quantity: Number(quantity), unit_price: Number(unit_price),
        line_total: Number(line_total), is_taxable: Boolean(is_taxable), stair_config_id: stair_config_id || null
      };
      state.quote_items.push(row);
      return { rows: [row] };
    }
    if (sql.includes('FROM quote_items') && sql.includes('WHERE job_item_id =')) {
      // calculateJobTotals sums
      const jobId = Number(params[0]);
      const items = state.quote_items.filter(q => q.job_item_id === jobId);
      const taxable_total = items.filter(i => i.is_taxable).reduce((a, b) => a + (b.line_total || 0), 0);
      const non_taxable_total = items.filter(i => !i.is_taxable).reduce((a, b) => a + (b.line_total || 0), 0);
      const subtotal = taxable_total + non_taxable_total;
      return { rows: [{ taxable_total, non_taxable_total, subtotal }] };
    }
    if (sql.includes('SELECT tax_rate FROM job_items WHERE id =')) {
      const id = Number(params[0]);
      const j = findJobItemById(id);
      return { rows: [{ tax_rate: j ? j.tax_rate : 0 }] };
    }

    // Deposits and allocations
    if (sql.startsWith('BEGIN') || sql.startsWith('COMMIT') || sql.startsWith('ROLLBACK')) {
      return { rows: [] };
    }
    if (sql.startsWith('INSERT INTO deposits')) {
      const [customer_id, payment_method, reference_number, payment_date, total_amount, deposit_date, notes, created_by] = params;
      const row = { id: nextId('deposit'), customer_id: Number(customer_id), payment_method, reference_number, payment_date: payment_date || null, total_amount: Number(total_amount), deposit_date: deposit_date || nowIso(), notes: notes || null, created_by, created_at: nowIso(), updated_at: nowIso() };
      state.deposits.push(row);
      return { rows: [{ id: row.id }] };
    }
    if (sql.startsWith('INSERT INTO deposit_allocations')) {
      // Values are inlined by service; pull from params in 6-sized groups
      for (let i = 0; i < params.length; i += 6) {
        const deposit_id = params[i + 0];
        const job_id = params[i + 1];
        const job_item_id = params[i + 2];
        const amount = params[i + 3];
        const notes = params[i + 4];
        const created_by = params[i + 5];
        state.deposit_allocations.push({ id: ++state.ids.allocation, deposit_id: Number(deposit_id), job_id: Number(job_id), job_item_id: Number(job_item_id), amount: Number(amount), notes, created_by, created_at: nowIso() });
      }
      return { rows: [] };
    }
    if (sql.includes('SELECT * FROM deposits_with_balance WHERE id =')) {
      const id = Number(params[0]);
      const d = state.deposits.find(x => x.id === id);
      if (!d) return { rows: [] };
      const allocated = state.deposit_allocations.filter(a => a.deposit_id === id).reduce((acc, a) => acc + a.amount, 0);
      const unallocated_amount = Number((d.total_amount - allocated).toFixed(2));
      return { rows: [{
        id: d.id,
        customer_id: d.customer_id,
        payment_method: d.payment_method,
        reference_number: d.reference_number,
        payment_date: d.payment_date,
        total_amount: String(d.total_amount.toFixed ? d.total_amount.toFixed(2) : d.total_amount),
        deposit_date: d.deposit_date,
        notes: d.notes,
        created_by: d.created_by,
        created_at: d.created_at,
        updated_at: d.updated_at,
        unallocated_amount: String(unallocated_amount.toFixed ? unallocated_amount.toFixed(2) : unallocated_amount)
      }] };
    }
    if (sql.includes('FROM deposit_allocations da') && sql.includes('LEFT JOIN job_items ji') && sql.includes('WHERE da.deposit_id =')) {
      const id = Number(params[0]);
      const rows = state.deposit_allocations.filter(a => a.deposit_id === id).map(a => ({
        id: a.id,
        deposit_id: a.deposit_id,
        job_id: a.job_id,
        job_item_id: a.job_item_id,
        job_item_title: (findJobItemById(a.job_item_id) || {}).title || null,
        amount: String(a.amount.toFixed ? a.amount.toFixed(2) : a.amount),
        allocation_date: nowIso(),
        notes: a.notes,
        created_by: a.created_by,
        created_at: nowIso()
      }));
      return { rows };
    }
    if (sql.includes('WITH alloc AS') && sql.includes('FROM job_items ji')) {
      // Per-item allocation validation: return totals so far for involved items
      // Expect params contains an array of job_item_ids; in service it's inlined via ANY($1)
      // We will just return state for all job_items
      const rows = state.job_items.map(ji => {
        const allocated = state.deposit_allocations.filter(a => a.job_item_id === ji.id).reduce((acc, a) => acc + a.amount, 0);
        return { id: ji.id, job_id: ji.job_id || (state.projects[0]?.id ?? null), customer_id: ji.customer_id, total_amount: String(ji.total_amount || 0), allocated: String(allocated) };
      });
      return { rows };
    }

    // Shop generation
    if (sql.includes('FROM job_items ji') && sql.includes('LEFT JOIN jobs proj') && sql.includes('WHERE ji.id = ANY')) {
      // jobDetailsQuery
      const ids = params[0];
      const rows = state.job_items.filter(j => ids.includes(j.id)).map(j => {
        const c = findCustomerById(j.customer_id) || {};
        const s = state.salesmen.find(x => x.id === j.salesman_id) || {};
        const proj = j.job_id ? findProjectById(j.job_id) : undefined;
        return {
          id: j.id,
          title: j.title,
          description: j.description,
          status: j.status,
          job_location: j.job_location,
          delivery_date: j.delivery_date,
          order_designation: j.order_designation,
          model_name: j.model_name,
          terms: j.terms,
          installer: j.installer,
          lot_name: proj ? proj.name : null,
          customer_id: j.customer_id,
          customer_name: c.name,
          address: c.address,
          city: c.city,
          state: c.state,
          zip_code: c.zip_code,
          phone: c.phone,
          fax: c.fax,
          cell: c.mobile,
          email: c.email,
          salesman_first_name: s.first_name,
          salesman_last_name: s.last_name,
          salesman_phone: s.phone,
          salesman_email: s.email
        };
      });
      return { rows };
    }
    if (sql.includes('FROM quote_items qi') && sql.includes("qi.job_item_id = ANY($1)")) {
      // Return distinct config ids for provided jobs
      const jobIds = params[0];
      const configIds = state.quote_items
        .filter(q => jobIds.includes(q.job_item_id) && (q.stair_config_id || (q.part_number || '').startsWith('STAIR-')))
        .map(q => q.stair_config_id || Number((q.part_number || '').replace('STAIR-', '')))
        .filter(Boolean);
      const uniq = Array.from(new Set(configIds));
      return { rows: uniq.map(id => ({ config_id: id })) };
    }
    if (sql.includes('FROM stair_configurations sc') && sql.includes('WHERE sc.id = ANY($1)')) {
      const configIds = params[0];
      const jobIds = params[1];
      const rows = state.stair_configs
        .filter(sc => configIds.includes(sc.id) && jobIds.includes(sc.job_item_id))
        .map(sc => ({ ...sc, riser_material_name: 'Oak' }));
      return { rows };
    }
    if (sql.includes('FROM stair_config_items sci') && sql.includes('WHERE sci.config_id = ANY($1)')) {
      const cfgIds = params[0];
      // Provide at least one tread item to satisfy generation
      const rows = cfgIds.map((id) => ({ id: 1, config_id: id, item_type: 'tread', riser_number: 1, tread_type: 'box', width: 42, length: 11, material_id: 5 }));
      return { rows };
    }
    if (sql.startsWith('SELECT COUNT(*) as count FROM shops WHERE DATE(created_at) = CURRENT_DATE')) {
      return { rows: [{ count: String(state.shops.filter(s => s.created_at?.slice(0,10) === nowIso().slice(0,10)).length) }] };
    }
    if (sql.includes('INSERT INTO shops (shop_number, cut_sheets') && sql.includes('RETURNING id, created_at')) {
      const [shop_number, cut_sheets, notes] = params;
      const row = { id: nextId('shop'), shop_number, cut_sheets: typeof cut_sheets === 'string' ? cut_sheets : JSON.stringify(cut_sheets), status: 'generated', generated_date: nowIso(), notes, created_at: nowIso() };
      state.shops.push(row);
      return { rows: [{ id: row.id, created_at: row.created_at }] };
    }
    if (sql.startsWith('INSERT INTO shop_jobs')) {
      const [shop_id, job_id, job_title, customer_name, job_location, delivery_date] = params;
      state.shop_jobs.push({ shop_id, job_id, job_title, customer_name, job_location, delivery_date });
      return { rows: [] };
    }
    if (sql.startsWith('UPDATE job_items SET shops_run = true')) {
      const jobIds = params[0];
      state.job_items.forEach(j => { if (jobIds.includes(j.id)) { j.shops_run = true; j.shops_run_date = nowIso(); } });
      return { rows: [] };
    }

    // Fallback default
    return { rows: [] };
  };

  const client = { query: jest.fn(commonQuery), release: jest.fn() };
  const poolMock = {
    connect: jest.fn(async () => client),
    query: jest.fn(commonQuery)
  };

  return { poolMock, state };
}

describe.skip('End-to-end workflow: customer → salesman → project → quote → deposit → order → shops → invoice → final payment', () => {
  let poolMock;

  beforeEach(() => {
    jest.resetModules();
    // Avoid spinning up real PDF cache timers from jobController imports
    jest.doMock(path.resolve(__dirname, '../dist/services/pdfCache.js'), () => ({ __esModule: true, pdfCache: { invalidateJob: async () => {}, clearAll: async () => {}, getStats: () => ({ memoryEntries: 0, totalMemorySize: 0 }) } }));
    const { poolMock: p } = makeDbMock();
    poolMock = p;
    jest.doMock(databaseModuleId, () => ({ __esModule: true, default: poolMock }));
  });

  test('runs the full workflow successfully', async () => {
    // Import controllers after DB mock is registered
    const customerController = require(path.resolve(__dirname, '../dist/controllers/customerController.js'));
    const salesmanController = require(path.resolve(__dirname, '../dist/controllers/salesmanController.js'));
    const projectController = require(path.resolve(__dirname, '../dist/controllers/projectController.js'));
    const jobController = require(path.resolve(__dirname, '../dist/controllers/jobController.js'));
    const depositController = require(path.resolve(__dirname, '../dist/controllers/depositController.js'));
    const shopController = require(path.resolve(__dirname, '../dist/controllers/shopController.js'));

    const testUser = { userId: 1, email: 'tester@example.com', role: 'admin' };

    // 1) Create customer
    {
      const req = createReq({ body: { name: 'Acme Homes', state: 'MD', email: 'owner@acme.test' } });
      const res = createRes();
      await customerController.createCustomer(req, res, (e) => { throw e; });
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
    }

    // 2) Create salesman
    let salesmanId;
    {
      const req = createReq({ body: { first_name: 'Sam', last_name: 'Seller', email: 'sam.seller@example.com', phone: '555-1111', commission_rate: 5 } });
      const res = createRes();
      await salesmanController.createSalesman(req, res, (e) => { throw e; });
      expect(res.statusCode).toBe(201);
      salesmanId = res.body.id;
      expect(salesmanId).toBeTruthy();
    }

    // 3) Create project (job)
    let projectId;
    {
      // Use the first customer (created above)
      const req = createReq({ body: { customer_id: 101, name: 'New Subdivision' } });
      const res = createRes();
      await projectController.createProject(req, res, (e) => { throw e; });
      expect(res.statusCode).toBe(201);
      // Debug aid if this fails in CI
      if (!res.body) {
        // eslint-disable-next-line no-console
        console.error('createProject returned no body');
      } else {
        // eslint-disable-next-line no-console
        console.log('createProject body:', res.body);
      }
      projectId = res.body.id;
      expect(projectId).toBeTruthy();
    }

    // 4) Create job item as quote under project
    let jobItemId;
    {
      const req = createReq({ body: { project_id: projectId, salesman_id: salesmanId, title: 'Lot 12 Stair Package', status: 'quote' } });
      const res = createRes();
      await jobController.createJob(req, res, (e) => { throw e; });
      expect(res.statusCode).toBe(201);
      jobItemId = res.body.id;
      expect(jobItemId).toBeTruthy();
      expect(res.body.status).toBe('quote');
    }

    // 5) Add a section and a stair quote item (taxable)
    let sectionId;
    {
      const req = createReq({ params: { jobId: String(jobItemId) }, body: { name: 'Main Stair' } });
      const res = createRes();
      await jobController.createJobSection(req, res, (e) => { throw e; });
      expect(res.statusCode).toBe(201);
      sectionId = res.body.id;
    }
    {
      const stair_configuration = {
        configName: 'Main Stair',
        steps: 12,
        items: [ { itemType: 'tread', riserNumber: 1, stairWidth: 42, length: 11, materialId: 5, quantity: 1, unitPrice: 0, totalPrice: 0 } ]
      };
      const req = createReq({ params: { jobId: String(jobItemId), sectionId: String(sectionId) }, body: {
        part_number: 'STAIR-CONFIG', description: 'Box tread stair', quantity: 1, unit_price: 1000, is_taxable: true,
        stair_configuration
      } });
      const res = createRes();
      await jobController.addQuoteItem(req, res, (e) => { throw e; });
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
    }

    // Check that job totals updated (with 6% tax on 1000)
    {
      const req = createReq({ params: { id: String(jobItemId) } });
      const res = createRes();
      await jobController.getJobById(req, res, (e) => { throw e; });
      expect(res.statusCode).toBe(200);
      expect(res.body.total_amount).toBeCloseTo(1060, 2);
    }

    // 6) Initial deposit of 500 allocated to this job item
    let deposit1Id;
    {
      const req = createReq({ user: testUser, body: {
        customer_id: 101, payment_method: 'check', total_amount: 500,
        initial_allocations: [ { job_id: projectId, job_item_id: jobItemId, amount: 500 } ]
      } });
      const res = createRes();
      await depositController.createDeposit(req, res, (e) => { throw e; });
      expect(res.statusCode).toBe(201);
      deposit1Id = res.body.id;
      expect(res.body.unallocatedAmount).toBe(0);
    }

    // 7) Move quote → order
    {
      const req = createReq({ params: { id: String(jobItemId) }, body: { status: 'order' } });
      const res = createRes();
      await jobController.updateJob(req, res, (e) => { throw e; });
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('order');
    }

    // 8) Generate shops for the order
    {
      const req = createReq({ body: { orderIds: [ jobItemId ] } });
      const res = createRes();
      await shopController.generateShops(req, res, (e) => { throw e; });
      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe('generated');
      expect(res.body.job_ids).toContain(jobItemId);
    }

    // 9) Move order → invoice
    {
      const req = createReq({ params: { id: String(jobItemId) }, body: { status: 'invoice' } });
      const res = createRes();
      await jobController.updateJob(req, res, (e) => { throw e; });
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('invoice');
    }

    // 10) Final payment for remaining balance
    {
      // Remaining should be 560 (1060 total - 500 deposit)
      const req = createReq({ user: testUser, body: {
        customer_id: 101, payment_method: 'check', total_amount: 560,
        initial_allocations: [ { job_id: projectId, job_item_id: jobItemId, amount: 560 } ]
      } });
      const res = createRes();
      await depositController.createDeposit(req, res, (e) => { throw e; });
      expect(res.statusCode).toBe(201);
      expect(res.body.unallocatedAmount).toBe(0);
    }

    // Validate balance due is now zero via getJobById
    {
      const req = createReq({ params: { id: String(jobItemId) } });
      const res = createRes();
      await jobController.getJobById(req, res, (e) => { throw e; });
      expect(res.statusCode).toBe(200);
      expect(res.body.balance_due).toBeCloseTo(0, 2);
    }
  });
});
