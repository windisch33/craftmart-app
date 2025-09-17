import { describe, expect, it } from 'vitest';
import type { QuoteItem } from '../../../../services/jobService';
import { mapQuoteItemsToEditableItems } from '../../JobDetail';

describe('mapQuoteItemsToEditableItems', () => {
  it('preserves stair configuration payload and identifiers', () => {
    const items: QuoteItem[] = [
      {
        id: 1,
        job_id: 123,
        section_id: 456,
        part_number: 'STAIR-1',
        description: 'Staircase',
        quantity: 1,
        unit_price: 1000,
        line_total: 1000,
        is_taxable: true,
        stair_config_id: 42,
        created_at: '2025-01-01T00:00:00.000Z',
        stair_configuration: {
          configName: 'Test Stair',
          totalAmount: 1000
        } as any
      }
    ];

    const [result] = mapQuoteItemsToEditableItems(items);

    expect(result.stair_config_id).toBe(42);
    expect(result.stair_configuration).toEqual(items[0].stair_configuration);
    expect(result.part_number).toBe('STAIR-1');
    expect(result.description).toBe('Staircase');
  });

  it('defaults part number to empty string when missing', () => {
    const items: QuoteItem[] = [
      {
        id: -5,
        job_id: 1,
        section_id: 2,
        description: 'Draft Stair',
        quantity: 1,
        unit_price: 500,
        line_total: 500,
        is_taxable: false,
        created_at: '2025-01-02T00:00:00.000Z'
      }
    ];

    const [result] = mapQuoteItemsToEditableItems(items);

    expect(result.part_number).toBe('');
    expect(result.isNew).toBe(true);
    expect(result.stair_configuration).toBeUndefined();
  });
});
