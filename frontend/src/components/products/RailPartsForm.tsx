import React, { useState, useEffect } from 'react';
import productService, { type Product, type CreateRailPartsProductRequest, type UpdateRailPartsProductRequest } from '../../services/productService';
import './RailPartsForm.css';
import { AlertTriangleIcon } from '../common/icons';

interface RailPartsFormProps {
  product?: Product | null;
  onClose: () => void;
}

const RailPartsForm: React.FC<RailPartsFormProps> = ({ product, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    base_price: '',
    labor_install_cost: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        base_price: product.base_price?.toString() || '',
        labor_install_cost: product.labor_install_cost?.toString() || ''
      });
    }
  }, [product]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validation
      if (!formData.name.trim()) {
        throw new Error('Product name is required');
      }

      const basePrice = parseFloat(formData.base_price);
      const laborCost = parseFloat(formData.labor_install_cost);

      if (isNaN(basePrice) || basePrice < 0) {
        throw new Error('Base price must be a valid positive number');
      }

      if (isNaN(laborCost) || laborCost < 0) {
        throw new Error('Labor/install cost must be a valid positive number');
      }

      const requestData: CreateRailPartsProductRequest | UpdateRailPartsProductRequest = {
        name: formData.name.trim(),
        base_price: basePrice,
        labor_install_cost: laborCost
      };

      if (product) {
        await productService.updateRailPartsProduct(product.id, requestData);
      } else {
        await productService.createRailPartsProduct(requestData);
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save rail parts product');
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatCurrency = (value: string): string => {
    const numValue = parseFloat(value);
    return isNaN(numValue) ? '$0.00' : `$${numValue.toFixed(2)}`;
  };

  return (
    <div className="rail-parts-form-backdrop" onClick={handleBackdropClick}>
      <div className="rail-parts-form-modal">
        <div className="modal-header">
          <h2 className="modal-title">
            {product ? 'Edit Rail Parts' : 'Create Rail Parts'}
          </h2>
          <button
            type="button"
            className="close-button"
            onClick={onClose}
            aria-label="Close"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="form-error">
            <span className="error-icon"><AlertTriangleIcon /></span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="rail-parts-form">
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Product Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="form-input"
              placeholder='e.g., End Cap - Standard'
              disabled={loading}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="base_price" className="form-label">
                Base Price <span className="required">*</span>
              </label>
              <div className="input-with-prefix">
                <span className="input-prefix">$</span>
                <input
                  type="number"
                  id="base_price"
                  name="base_price"
                  value={formData.base_price}
                  onChange={handleInputChange}
                  className="form-input"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  disabled={loading}
                />
              </div>
              {formData.base_price && (
                <span className="form-help">
                  {formatCurrency(formData.base_price)} base price (before material multiplier)
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="labor_install_cost" className="form-label">
                Labor/Install Cost <span className="required">*</span>
              </label>
              <div className="input-with-prefix">
                <span className="input-prefix">$</span>
                <input
                  type="number"
                  id="labor_install_cost"
                  name="labor_install_cost"
                  value={formData.labor_install_cost}
                  onChange={handleInputChange}
                  className="form-input"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  disabled={loading}
                />
              </div>
              {formData.labor_install_cost && (
                <span className="form-help">
                  {formatCurrency(formData.labor_install_cost)} per unit
                </span>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : (product ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RailPartsForm;
