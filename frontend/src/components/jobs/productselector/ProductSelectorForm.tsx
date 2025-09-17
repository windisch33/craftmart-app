import React from 'react';
import type { Product } from '../../../services/productService';
import type { Material } from '../../../services/materialService';
import type { ProductFormData } from './types';
import HandrailLengthInput from './HandrailLengthInput';

interface ProductSelectorFormProps {
  formData: ProductFormData;
  products: Product[];
  materials: Material[];
  showAddForm: boolean;
  editingItem: any | null;
  addingItem: boolean;
  selectedProduct: Product | null;
  selectedMaterial: Material | null;
  isHandrailProduct: boolean;
  requiresMaterial: boolean;
  materialPrice: number;
  laborPrice: number;
  totalPrice: number;
  isFormValid: () => boolean;
  onFormChange: (field: keyof ProductFormData, value: any) => void;
  onShowAddFormChange: (show: boolean) => void;
  onEditingItemChange: (item: any | null) => void;
  onAddItem: () => void;
  onAddAndContinue: () => void;
  onResetForm: () => void;
}

const ProductSelectorForm: React.FC<ProductSelectorFormProps> = ({
  formData,
  products,
  materials,
  showAddForm,
  editingItem,
  addingItem,
  selectedProduct,
  selectedMaterial: _selectedMaterial,
  isHandrailProduct,
  requiresMaterial,
  materialPrice,
  laborPrice,
  totalPrice,
  isFormValid,
  onFormChange,
  onShowAddFormChange,
  onEditingItemChange,
  onAddItem,
  onAddAndContinue,
  onResetForm
}) => {
  const getProductsByType = (type: string) => {
    return products.filter(p => p.product_type === type && p.is_active);
  };

  const handleCloseForm = () => {
    onShowAddFormChange(false);
    onEditingItemChange(null);
    onResetForm();
  };

  if (!showAddForm) {
    return null;
  }

  return (
    <div className="add-item-form">
      <div className="form-header">
        <h5>{editingItem ? 'Edit Item' : 'Add New Item'}</h5>
        <button
          type="button"
          className="close-form-btn"
          onClick={handleCloseForm}
        >
          ×
        </button>
      </div>

      <div className="form-content">
        {/* Product Selection */}
        <div className="form-row">
          <div className="form-field">
            <label htmlFor="product-select">Product</label>
            <select
              id="product-select"
              value={formData.productId}
              onChange={(e) => {
                const value = e.target.value;
                if (value === 'stair-configurator') {
                  onFormChange('productId', value);
                } else {
                  onFormChange('productId', parseInt(value));
                }
              }}
              disabled={addingItem}
            >
              <option value={0}>Select Product...</option>
              <optgroup label="🪜 Stairs">
                <option value="stair-configurator">Configure Straight Stair...</option>
              </optgroup>
              <optgroup label="Handrails">
                {getProductsByType('handrail').map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Landing Treads">
                {getProductsByType('landing_tread').map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Rail Parts">
                {getProductsByType('rail_parts').map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Newels">
                {getProductsByType('newel').map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Balusters">
                {getProductsByType('baluster').map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Other">
                {getProductsByType('other').map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {selectedProduct && requiresMaterial && (
            <div className="form-field">
              <label htmlFor="material-select">Material</label>
              <select
                id="material-select"
                value={formData.materialId}
                onChange={(e) => onFormChange('materialId', parseInt(e.target.value))}
                disabled={addingItem}
              >
                <option value={0}>Select Material...</option>
                {materials.filter(m => m.is_active).map(material => (
                  <option key={material.id} value={material.id}>
                    {material.name} ({material.multiplier}x)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Custom Description */}
        <div className="form-field">
          <label htmlFor="custom-description">Description</label>
          <input
            type="text"
            id="custom-description"
            value={formData.customDescription}
            onChange={(e) => onFormChange('customDescription', e.target.value)}
            placeholder={selectedProduct ? "Override product name..." : "Enter custom item description..."}
            disabled={addingItem}
          />
        </div>

        {/* Quantity and Length */}
        <div className="form-row">
          <div className="form-field">
            <label htmlFor="quantity">Quantity *</label>
            <input
              type="number"
              id="quantity"
              value={formData.quantity}
              onChange={(e) => onFormChange('quantity', parseFloat(e.target.value) || 0)}
              min="1"
              step="1"
              disabled={addingItem}
              required
            />
          </div>

          {isHandrailProduct && (
            <div className="form-field">
              <label htmlFor="length">
                Length (6" increments)
              </label>
              <HandrailLengthInput
                value={formData.lengthInches}
                onChange={(value) => onFormChange('lengthInches', value)}
                disabled={addingItem}
              />
            </div>
          )}
        </div>

        {/* Labor Option - exclude for handrail products */}
        {selectedProduct && 
         selectedProduct.labor_install_cost !== undefined && 
         selectedProduct.product_type !== 'handrail' && (
          <div className="labor-section">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.includeLabor}
                onChange={(e) => onFormChange('includeLabor', e.target.checked)}
                disabled={addingItem}
              />
              Include labor/installation (${Number(selectedProduct.labor_install_cost || 0).toFixed(2)}/unit)
            </label>
          </div>
        )}

        {/* Pricing */}
        <div className="pricing-section">
          <div className="pricing-header">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.useCustomPrice}
                onChange={(e) => onFormChange('useCustomPrice', e.target.checked)}
                disabled={addingItem}
              />
              Use custom pricing
            </label>
          </div>

          {formData.useCustomPrice ? (
            <div className="form-field">
              <label htmlFor="custom-price">Unit Price *</label>
              <input
                type="number"
                id="custom-price"
                value={formData.customUnitPrice}
                onChange={(e) => onFormChange('customUnitPrice', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
                disabled={addingItem}
                required
              />
            </div>
          ) : (
            <div className="calculated-pricing">
              {selectedProduct && (
                <div className="price-breakdown-detailed">
                  <div className="price-item">
                    <span>Material Cost: </span>
                    <strong>${(materialPrice / Math.max(formData.quantity || 1, 1)).toFixed(2)} × {formData.quantity || 1} = ${materialPrice.toFixed(2)}</strong>
                  </div>
                  {formData.includeLabor && laborPrice > 0 && (
                    <div className="price-item labor-cost">
                      <span>Labor Cost: </span>
                      <strong>${(laborPrice / Math.max(formData.quantity || 1, 1)).toFixed(2)} × {formData.quantity || 1} = ${laborPrice.toFixed(2)}</strong>
                    </div>
                  )}
                  <div className="price-total">
                    <span>Line Total: </span>
                    <strong>${totalPrice.toFixed(2)}</strong>
                  </div>
                </div>
              )}
              {!selectedProduct && (
                <div className="price-breakdown">
                  <span>Select a product to see pricing</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tax Options */}
        <div className="form-options">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.isTaxable}
              onChange={(e) => onFormChange('isTaxable', e.target.checked)}
              disabled={addingItem}
            />
            Material cost is taxable
          </label>
          <div className="tax-notes">
            {formData.includeLabor && (
              <p className="tax-note">
                💡 Labor costs are typically non-taxable and will be tracked separately
              </p>
            )}
            <p className="tax-note">
              💡 Material costs are usually taxable, labor costs are not
            </p>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={handleCloseForm}
            disabled={addingItem}
            className="cancel-btn"
          >
            Cancel
          </button>
          {!editingItem && (
            <button
              type="button"
              onClick={onAddAndContinue}
              disabled={addingItem || !isFormValid()}
              className="add-continue-btn"
            >
              {addingItem ? 'Adding...' : 'Add & Continue'}
            </button>
          )}
          <button
            type="button"
            onClick={onAddItem}
            disabled={addingItem || !isFormValid()}
            className="add-btn"
          >
            {addingItem ? 'Adding...' : editingItem ? 'Update Item' : 'Add Item'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductSelectorForm;
