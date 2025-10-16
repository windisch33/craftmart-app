const path = require('path');

const databaseModuleId = path.resolve(__dirname, '../dist/config/database.js');
const serviceModuleId = path.resolve(__dirname, '../dist/services/shopService.js');

describe('shopService.getAllShops mapping', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('returns shops with jobs array and cut_sheet_count', async () => {
    const poolMock = {
      query: jest.fn(async (sql, params) => {
        if (String(sql).includes('FROM shops s') && String(sql).includes('LEFT JOIN shop_jobs sj')) {
          return {
            rows: [
              {
                id: 77,
                shop_number: 'SHOP-2025-01-01-001',
                status: 'generated',
                generated_date: '2025-01-01T00:00:00Z',
                cut_sheets: [
                  { item_type: 'tread', width: 11.25, length: 40.75, job_id: 201 },
                ],
                cut_sheet_count: 1,
                jobs: [
                  {
                    job_id: 201,
                    order_number: '#201',
                    job_title: 'Lot 9',
                    customer_name: 'Acme',
                    job_location: 'FOYER',
                    delivery_date: '2025-01-10',
                  }
                ]
              }
            ]
          };
        }
        return { rows: [] };
      })
    };
    jest.doMock(databaseModuleId, () => ({ __esModule: true, default: poolMock }));

    const { getAllShops } = require(serviceModuleId);
    const rows = await getAllShops();
    expect(rows).toHaveLength(1);
    const shop = rows[0];
    expect(shop.shop_number).toBe('SHOP-2025-01-01-001');
    expect(shop.cut_sheet_count).toBe(1);
    expect(Array.isArray(shop.jobs)).toBe(true);
    expect(shop.jobs[0]).toMatchObject({ job_id: 201, customer_name: 'Acme' });
  });
});

