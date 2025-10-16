const path = require('path');

// Resolve compiled module IDs used by the service under test
const databaseModuleId = path.resolve(__dirname, '../dist/config/database.js');
const serviceModuleId = path.resolve(__dirname, '../dist/services/shopService.js');

// Create a mock client with programmable responses
const createMockClient = () => {
  const state = {
    nowIso: () => new Date().toISOString(),
    shops: [],
  };

  const query = jest.fn(async (sql, params = []) => {
    sql = String(sql);

    // Transaction control
    if (/^BEGIN/i.test(sql) || /^COMMIT/i.test(sql) || /^ROLLBACK/i.test(sql)) {
      return { rows: [] };
    }

    // Job details lookup
    if (sql.includes('FROM job_items ji') && sql.includes('LEFT JOIN jobs proj') && sql.includes('WHERE ji.id = ANY($1)')) {
      const jobIds = params[0] || [];
      // Return a single job item (status order)
      return {
        rows: jobIds.map((id) => ({
          id,
          title: `Job ${id}`,
          description: 'Test job',
          status: 'order',
          job_location: 'Main Hall',
          delivery_date: '2025-01-10',
          order_designation: null,
          model_name: null,
          terms: null,
          installer: null,
          lot_name: 'Lot A',
          customer_id: 1,
          customer_name: 'Acme Homes',
          address: '123 Main St',
          city: 'Somewhere',
          state: 'OH',
          zip_code: '44101',
          phone: '555-1111',
          fax: null,
          cell: null,
          email: 'ops@example.com',
          salesman_first_name: 'Sam',
          salesman_last_name: ' Sales',
          salesman_phone: '555-2222',
          salesman_email: 'sam@example.com',
        }))
      };
    }

    // Quoted config ids from quote_items
    if (sql.includes('FROM quote_items qi') && sql.includes('qi.job_item_id = ANY($1)')) {
      return { rows: [{ config_id: 1 }] };
    }

    // Load configurations for the quoted IDs
    if (sql.includes('FROM stair_configurations sc') && sql.includes('sc.id = ANY($1)') && sql.includes('sc.job_item_id = ANY($2)')) {
      const jobIds = params[1] || [];
      return {
        rows: [{
          id: 1,
          job_item_id: jobIds[0],
          config_name: 'Main Stair',
          floor_to_floor: 112,
          num_risers: 14,
          riser_height: 8,
          tread_size: '10.0x1.25',
          nose_size: 1.25,
          stringer_type: '1x9.25',
          num_stringers: 2,
          center_horses: 0,
          full_mitre: false,
          special_notes: 'FOYER',
          riser_material_name: 'Primed',
          rough_cut_width: 10.0, // read via (config as any)
        }]
      };
    }

    // Load configuration items
    if (sql.includes('FROM stair_config_items sci') && sql.includes('sci.config_id = ANY($1)')) {
      // One config (id=1) with three treads: box, open_left, double_open
      // item.width is treated as the span for treads in generation logic
      return {
        rows: [
          { id: 11, config_id: 1, item_type: 'tread', riser_number: 1, tread_type: 'box', width: 42.0, length: 10.0, quantity: 1, material_name: 'White Oak' },
          { id: 12, config_id: 1, item_type: 'tread', riser_number: 2, tread_type: 'open_left', width: 43.0, length: 10.0, quantity: 1, material_name: 'White Oak' },
          { id: 13, config_id: 1, item_type: 'tread', riser_number: 3, tread_type: 'double_open', width: 44.0, length: 10.0, quantity: 1, material_name: 'White Oak' },
          // No explicit risers: service will synthesize one per tread + add S4S
        ]
      };
    }

    // Daily count for shop number
    if (sql.includes('SELECT COUNT(*) as count FROM shops WHERE DATE(created_at) = CURRENT_DATE')) {
      return { rows: [{ count: '0' }] };
    }

    // Create shop record
    if (sql.includes('INSERT INTO shops (shop_number, cut_sheets') && sql.includes('RETURNING id, created_at')) {
      const [shop_number] = params;
      const row = { id: 5001, created_at: state.nowIso() };
      state.shops.push({ id: row.id, shop_number });
      return { rows: [row] };
    }

    // Insert shop_jobs links
    if (sql.startsWith('INSERT INTO shop_jobs')) {
      return { rows: [] };
    }

    // Mark shops_run on job_items
    if (sql.startsWith('UPDATE job_items SET shops_run = true')) {
      return { rows: [] };
    }

    // Default empty
    return { rows: [] };
  });

  return { query, release: jest.fn() };
};

describe('shopService.generateCutSheets cut math', () => {
  let poolMock;

  beforeEach(() => {
    jest.resetModules();
    const client = createMockClient();
    poolMock = {
      connect: jest.fn(async () => client),
      query: jest.fn(client.query),
    };
    // Mock the compiled database module default export
    jest.doMock(databaseModuleId, () => ({ __esModule: true, default: poolMock }));
  });

  test('computes tread/riser/S4S dimensions correctly', async () => {
    const { generateCutSheets } = require(serviceModuleId);
    const jobId = 101;
    const result = await generateCutSheets([jobId]);

    expect(result).toBeTruthy();
    expect(result.job_ids).toContain(jobId);
    expect(Array.isArray(result.cut_sheets)).toBe(true);

    const treads = result.cut_sheets.filter(i => i.item_type === 'tread');
    const risers = result.cut_sheets.filter(i => i.item_type === 'riser');
    const s4s = result.cut_sheets.find(i => i.item_type === 's4s');

    // Sanity counts: 3 treads -> 3 synthesized risers + 1 S4S
    expect(treads.length).toBe(3);
    expect(risers.length).toBe(3);
    expect(s4s).toBeTruthy();

    // Width = rough_cut_width (10.0) + nose (1.25) = 11.25
    const expectedTreadWidth = 11.25;
    for (const t of treads) {
      expect(t.width).toBeCloseTo(expectedTreadWidth, 5);
    }

    // Length rules: box: span-1.25, open: span-0.625, double_open: span
    const box = treads.find(t => (t.tread_type || '').toLowerCase() === 'box');
    const open = treads.find(t => (t.tread_type || '').toLowerCase().includes('open') && (t.tread_type || '').toLowerCase() !== 'double_open');
    const dbl = treads.find(t => (t.tread_type || '').toLowerCase() === 'double_open');

    expect(box.length).toBeCloseTo(42.0 - 1.25, 5); // 40.75
    expect(open.length).toBeCloseTo(43.0 - 0.625, 5); // 42.375
    expect(dbl.length).toBeCloseTo(44.0, 5);

    // Riser width = riser_height = 8, lengths align to associated tread types
    for (const r of risers) {
      expect(r.width).toBeCloseTo(8.0, 5);
    }

    // S4S: width = riser_height - 1 = 7; length uses double-open rule on max span (44) -> 44 - 2.5 = 41.5
    expect(s4s.width).toBeCloseTo(7.0, 5);
    expect(s4s.length).toBeCloseTo(41.5, 5);
  });
});

