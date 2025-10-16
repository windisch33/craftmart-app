const path = require('path');

const databaseModuleId = path.resolve(__dirname, '../dist/config/database.js');
const serviceModuleId = path.resolve(__dirname, '../dist/services/shopService.js');

describe('shopService.getShopById mapping', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('returns a single shop with jobs and cut_sheet_count', async () => {
    const poolMock = {
      query: jest.fn(async (sql, params) => {
        const s = String(sql);
        if (s.includes('FROM shops s') && s.includes('WHERE s.id = $1')) {
          return {
            rows: [
              {
                id: 42,
                shop_number: 'SHOP-42',
                status: 'generated',
                generated_date: '2025-01-05T00:00:00Z',
                cut_sheets: [ { item_type: 'tread', width: 11.25, length: 40.75, job_id: 5 } ],
                cut_sheet_count: 1,
                jobs: [ { job_id: 5, order_number: '#5', job_title: 'Lot 5', customer_name: 'Acme', job_location: 'FOYER', delivery_date: '2025-01-10' } ],
              }
            ]
          };
        }
        return { rows: [] };
      })
    };
    jest.doMock(databaseModuleId, () => ({ __esModule: true, default: poolMock }));

    const { getShopById } = require(serviceModuleId);
    const shop = await getShopById(42);
    expect(shop.id).toBe(42);
    expect(shop.shop_number).toBe('SHOP-42');
    expect(shop.cut_sheet_count).toBe(1);
    expect(Array.isArray(shop.jobs)).toBe(true);
    expect(shop.jobs[0]).toMatchObject({ job_id: 5, customer_name: 'Acme' });
  });
});

