const path = require('path');

const databaseModuleId = path.resolve(__dirname, '../dist/config/database.js');
const pdfServiceModuleId = path.resolve(__dirname, '../dist/services/pdfService.js');
const browserPoolModuleId = path.resolve(__dirname, '../dist/services/browserPool.js');

describe('pdfService.generateShopPaper (mocked browser)', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('renders PDF buffer for simple shop', async () => {
    // Mock browserPool & pdfCache to avoid intervals
    jest.doMock(browserPoolModuleId, () => ({
      __esModule: true,
      browserPool: {
        getBrowser: async () => ({
          newPage: async () => ({
            setViewport: async () => {},
            setContent: async () => {},
            pdf: async () => Buffer.from('PDF'),
            close: async () => {},
          })
        }),
        releaseBrowser: () => {},
      },
      default: {
        getBrowser: async () => ({ newPage: async () => ({ setViewport: async () => {}, setContent: async () => {}, pdf: async () => Buffer.from('PDF'), close: async () => {} }) }),
        releaseBrowser: () => {},
      },
    }));
    const pdfCacheModuleId = path.resolve(__dirname, '../dist/services/pdfCache.js');
    jest.doMock(pdfCacheModuleId, () => ({
      __esModule: true,
      pdfCache: {
        get: async () => null,
        set: async () => {},
        clearAll: async () => {},
        invalidateJob: async () => {},
        getStats: () => ({ memoryEntries: 0, totalMemorySize: 0 }),
      },
      default: {
        get: async () => null,
        set: async () => {},
        clearAll: async () => {},
        invalidateJob: async () => {},
        getStats: () => ({ memoryEntries: 0, totalMemorySize: 0 }),
      },
    }));

    // Mock DB queries used by generateShopPaper
    const poolMock = {
      query: jest.fn(async (sql, params) => {
        const s = String(sql);
        if (s.includes('FROM shops s') && s.includes('LEFT JOIN shop_jobs')) {
          return {
            rows: [{
              id: 777,
              shop_number: 'SHOP-TEST-002',
              cut_sheets: [
                { item_type: 'tread', tread_type: 'box', material: 'White Oak', quantity: 1, width: 11.25, length: 40.75, thickness: '1"', stair_id: 'STAIR_1', location: 'FOYER', job_id: 300, job_title: 'Lot 12' },
              ],
              jobs: [
                {
                  job_id: 300,
                  order_number: '#300',
                  job_title: 'Lot 12',
                  lot_name: 'Subdivision',
                  directions: 'Use side gate',
                  customer_name: 'Acme',
                  customer_address: '123 Main',
                  customer_city: 'Somewhere',
                  customer_state: 'OH',
                  customer_zip: '44101',
                  contact_person: 'Installer',
                  job_location: 'FOYER',
                  shop_date: '2025-01-01',
                  delivery_date: '2025-01-10',
                  sales_rep_name: 'Sam Sales',
                  sales_rep_phone: '555-1111',
                  sales_rep_email: 'sam@example.com',
                  order_designation: null,
                  model_name: null,
                  terms: null,
                }
              ]
            }]
          };
        }
        if (s.includes('FROM job_sections js') && s.includes('WHERE js.job_item_id =')) {
          // Return two sections with items
          return {
            rows: [
              { id: 1, job_item_id: 300, name: 'Rails', description: null, is_labor_section: false, is_misc_section: false,
                items: [ { id: 10, part_number: 'HANDRAIL', description: 'Handrail', quantity: 2 } ] },
              { id: 2, job_item_id: 300, name: 'Stair', description: null, is_labor_section: false, is_misc_section: false,
                items: [ { id: 11, part_number: 'STAIR-CONFIG', description: 'Stair Config', quantity: 1, stair_config_id: 1 } ] }
            ]
          };
        }
        return { rows: [] };
      })
    };
    jest.doMock(databaseModuleId, () => ({ __esModule: true, default: poolMock }));

    const { generateShopPaper } = require(pdfServiceModuleId);
    const buf = await generateShopPaper(777);
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(0);
  });
});

