const path = require('path');

const databaseModuleId = path.resolve(__dirname, '../dist/config/database.js');
const pdfServiceModuleId = path.resolve(__dirname, '../dist/services/pdfService.js');
const browserPoolModuleId = path.resolve(__dirname, '../dist/services/browserPool.js');

describe('pdfService.generateCutList (mocked browser)', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('renders PDF buffer from simple shop data', async () => {
    // Mock browserPool to avoid puppeteer
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

    // Mock pdfCache to avoid starting its cleanup interval
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

    // Minimal shop data query response used by generateCutList
    const client = {
      query: jest.fn(async (sql, params) => {
        if (String(sql).includes('FROM shops s') && String(sql).includes('LEFT JOIN shop_jobs')) {
          return {
            rows: [{
              id: 9001,
              shop_number: 'SHOP-TEST-001',
              cut_sheets: [
                { item_type: 'tread', tread_type: 'box', material: 'White Oak', quantity: 1, width: 11.25, length: 40.75, thickness: '1"', stair_id: 'STAIR_1', location: 'FOYER', job_id: 101, job_title: 'Job 101' },
                { item_type: 's4s', material: 'Primed', quantity: 1, width: 7, length: 41.5, thickness: '3/4"', stair_id: 'STAIR_1', location: 'FOYER', job_id: 101, job_title: 'Job 101' },
              ],
              jobs: [
                { job_id: 101, order_number: '#101', job_title: 'Job 101', lot_name: 'Lot A', directions: 'Directions', customer_name: 'Acme', job_location: 'FOYER', shop_date: '2025-01-01', delivery_date: '2025-01-10' }
              ],
            }]
          };
        }
        return { rows: [] };
      }),
      release: jest.fn(),
    };
    const poolMock = { connect: jest.fn(async () => client), query: jest.fn(client.query) };
    jest.doMock(databaseModuleId, () => ({ __esModule: true, default: poolMock }));

    const { generateCutList } = require(pdfServiceModuleId);
    const buf = await generateCutList(9001);
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(0);
  });
});
