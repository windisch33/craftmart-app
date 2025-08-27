import React, { useState, useEffect } from 'react';
import productService, { type Product, type CreateLandingTreadProductRequest, type UpdateLandingTreadProductRequest } from '../../services/productService';
import './LandingTreadForm.css';
import { AlertTriangleIcon } from '../common/icons';

interface LandingTreadFormProps {
  product?: Product | null;
  onClose: () => void;
}

const LandingTreadForm: React.FC<LandingTreadFormProps> = ({ product, onClose }) => {
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

      const requestData: CreateLandingTreadProductRequest | UpdateLandingTreadProductRequest = {
        name: formData.name.trim(),
        cost_per_6_inches: costPer6Inches,
        labor_install_cost: laborCost
      };

      if (product) {
        await productService.updateLandingTreadProduct(product.id, requestData);
      } else {
        await productService.createLandingTreadProduct(requestData);
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save landing tread product');
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
    <div className="landing-tread-form-backdrop" onClick={handleBackdropClick}>
      <div className="landing-tread-form-modal">
        <div className="modal-header">
          <h2 className="modal-title">
            {product ? 'Edit Landing Tread' : 'Create Landing Tread'}
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

        <form onSubmit={handleSubmit} className="landing-tread-form">
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
              placeholder='e.g., 6" Landing Tread'
              disabled={loading}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="cost_per_6_inches" className="form-label">
                Cost per 6" <span className="required">*</span>
              </label>
              <div className="input-with-prefix">
                <span className="input-prefix">$</span>
                <input
                  type="number"
                  id="cost_per_6_inches"
                  name="cost_per_6_inches"
                  value={formData.cost_per_6_inches}
                  onChange={handleInputChange}
                  className="form-input"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  disabled={loading}
                />
              </div>
              {formData.cost_per_6_inches && (
                <span className="form-help">
                  {formatCurrency(formData.cost_per_6_inches)} per 6"
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
                  {formatCurrency(formData.labor_install_cost)} total
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

export default LandingTreadForm;
