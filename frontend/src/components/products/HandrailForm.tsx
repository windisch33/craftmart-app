import React, { useState, useEffect } from 'react';
import productService, { type Product, type CreateHandrailProductRequest, type UpdateHandrailProductRequest } from '../../services/productService';
import './HandrailForm.css';
import { AlertTriangleIcon } from '../common/icons';

interface HandrailFormProps {
  product?: Product | null;
  onClose: () => void;
}

const HandrailForm: React.FC<HandrailFormProps> = ({ product, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    cost_per_6_inches: '',
    labor_install_cost: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        cost_per_6_inches: product.cost_per_6_inches?.toString() || '',
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

      const costPer6Inches = parseFloat(formData.cost_per_6_inches);
      const laborCost = parseFloat(formData.labor_install_cost);

      if (isNaN(costPer6Inches) || costPer6Inches < 0) {
        throw new Error('Cost per 6" must be a valid positive number');
      }

      if (isNaN(laborCost) || laborCost < 0) {
        throw new Error('Labor/install cost must be a valid positive number');
      }

      const requestData: CreateHandrailProductRequest | UpdateHandrailProductRequest = {
        name: formData.name.trim(),
        cost_per_6_inches: costPer6Inches,
        labor_install_cost: laborCost
      };

      if (product) {
        await productService.updateHandrailProduct(product.id, requestData);
      } else {
        await productService.createHandrailProduct(requestData);
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save handrail product');
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
    <div className="handrail-form-backdrop" onClick={handleBackdropClick}>
      <div className="handrail-form-modal">
        <div className="modal-header">
          <h2 className="modal-title">
            {product ? 'Edit Handrail Product' : 'Create Handrail Product'}
          </h2>
          <button
            type="button"
            className="close-button"
            onClick={onClose}
            aria-label="Close form"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="handrail-form">
          {error && (
            <div className="error-message">
              <span className="error-icon"><AlertTriangleIcon /></span>
              {error}
            </div>
          )}

          <div className="form-section">
            <h3>Product Information</h3>
            
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Product Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="form-input"
                placeholder="e.g., Standard Round Handrail"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Pricing Information</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="cost_per_6_inches" className="form-label">
                  Cost per 6 inches *
                </label>
                <div className="currency-input-group">
                  <span className="currency-symbol">$</span>
                  <input
                    type="number"
                    id="cost_per_6_inches"
                    name="cost_per_6_inches"
                    value={formData.cost_per_6_inches}
                    onChange={handleInputChange}
                    className="form-input currency-input"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="labor_install_cost" className="form-label">
                  Labor/Install Cost *
                </label>
                <div className="currency-input-group">
                  <span className="currency-symbol">$</span>
                  <input
                    type="number"
                    id="labor_install_cost"
                    name="labor_install_cost"
                    value={formData.labor_install_cost}
                    onChange={handleInputChange}
                    className="form-input currency-input"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Price Preview */}
          {formData.cost_per_6_inches && formData.labor_install_cost && (
            <div className="price-preview">
              <h4>Pricing Preview (for 12 feet with Pine material):</h4>
              <div className="price-breakdown">
                <div className="price-item">
                  <span>Material Cost:</span>
                  <span>{formatCurrency((parseFloat(formData.cost_per_6_inches) * 24).toString())}</span>
                </div>
                <div className="price-item">
                  <span>Labor Cost:</span>
                  <span>{formatCurrency(formData.labor_install_cost)}</span>
                </div>
                <div className="price-item total">
                  <span>Total:</span>
                  <span>
                    {formatCurrency(
                      (parseFloat(formData.cost_per_6_inches) * 24 + parseFloat(formData.labor_install_cost)).toString()
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

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
              {loading ? 'Saving...' : (product ? 'Update Product' : 'Create Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HandrailForm;
