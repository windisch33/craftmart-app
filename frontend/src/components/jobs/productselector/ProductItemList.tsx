import React from 'react';
import type { QuoteItem } from '../../../services/jobService';

interface ProductItemListProps {
  items: QuoteItem[];
  isReadOnly?: boolean;
  isLoading?: boolean;
  onEditItem: (item: QuoteItem) => void;
  onDeleteItem: (item: QuoteItem) => void;
}

const ProductItemList: React.FC<ProductItemListProps> = ({
  items,
  isReadOnly = false,
  isLoading = false,
  onEditItem,
  onDeleteItem
}) => {
  if (items.length === 0) {
    return (
      <div className="items-list">
        <div className="no-items">
          <span className="no-items-icon">📦</span>
          <p>No items in this section yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="items-list">
      <div className="items-table">
        <div className="table-header">
          <div className="col-qty">Qty</div>
          <div className="col-description">Description</div>
          <div className="col-unit-price">Unit Price</div>
          <div className="col-total">Total</div>
          <div className="col-tax">Tax</div>
          {!isReadOnly && <div className="col-actions">Actions</div>}
        </div>
        
        {items.map((item) => (
          <div key={item.id} className="table-row">
            <div className="col-qty">{item.quantity}</div>
            <div className="col-description">
              {item.part_number && (
                <div className="part-number">{item.part_number}</div>
              )}
              <div className="description">{item.description}</div>
            </div>
            <div className="col-unit-price">${Number(item.unit_price).toFixed(2)}</div>
            <div className="col-total">${Number(item.line_total).toFixed(2)}</div>
            <div className={`col-tax ${item.is_taxable ? 'taxable' : 'non-taxable'}`}>
              {item.is_taxable ? '✓' : '✗'}
            </div>
            {!isReadOnly && (
              <div className="col-actions">
                <button
                  type="button"
                  onClick={() => onEditItem(item)}
                  className="edit-btn"
                  disabled={isLoading}
                >
                  ✏️
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteItem(item)}
                  className="delete-btn"
                  disabled={isLoading}
                >
                  🗑️
                </button>
              </div>
            )}
          </div>
        ))}
        
        <div className="table-footer">
          <div className="section-total">
            <span>Section Total: </span>
            <strong>${items.reduce((sum, item) => sum + Number(item.line_total), 0).toFixed(2)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductItemList;