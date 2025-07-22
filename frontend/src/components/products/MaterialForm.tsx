import React, { useState, useEffect } from 'react';
import materialService, { type Material, type CreateMaterialRequest, type UpdateMaterialRequest } from '../../services/materialService';
import './MaterialForm.css';

interface MaterialFormProps {
  material?: Material | null;
  onClose: () => void;
}

const MaterialForm: React.FC<MaterialFormProps> = ({ material, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    multiplier: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (material) {
      setFormData({
        name: material.name,
        multiplier: material.multiplier.toString(),
        description: material.description || ''
      });
    }
  }, [material]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
        throw new Error('Material name is required');
      }

      const multiplier = parseFloat(formData.multiplier);

      if (isNaN(multiplier) || multiplier <= 0) {
        throw new Error('Multiplier must be a positive number greater than 0');
      }

      const requestData: CreateMaterialRequest | UpdateMaterialRequest = {
        name: formData.name.trim(),
        multiplier: multiplier,
        description: formData.description.trim() || undefined
      };

      if (material) {
        await materialService.updateMaterial(material.id, requestData);
      } else {
        await materialService.createMaterial(requestData);
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save material');
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getMultiplierExample = (): string => {
    const multiplier = parseFloat(formData.multiplier);
    if (isNaN(multiplier)) return '';
    
    const baseCost = 25; // Example base cost per 6"
    const actualCost = baseCost * multiplier;
    const percentage = ((multiplier - 1) * 100).toFixed(0);
    
    if (multiplier === 1) {
      return `No price change ($${baseCost.toFixed(2)} → $${actualCost.toFixed(2)})`;
    } else if (multiplier > 1) {
      return `+${percentage}% price increase ($${baseCost.toFixed(2)} → $${actualCost.toFixed(2)})`;
    } else {
      return `-${Math.abs(parseInt(percentage))}% price decrease ($${baseCost.toFixed(2)} → $${actualCost.toFixed(2)})`;
    }
  };

  return (
    <div className="material-form-backdrop" onClick={handleBackdropClick}>
      <div className="material-form-modal">
        <div className="modal-header">
          <h2 className="modal-title">
            {material ? 'Edit Material' : 'Create Material'}
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

        <form onSubmit={handleSubmit} className="material-form">
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <div className="form-section">
            <h3>Material Information</h3>
            
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Material Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="form-input"
                placeholder="e.g., Oak, Pine, Mahogany"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="multiplier" className="form-label">
                Price Multiplier *
              </label>
              <input
                type="number"
                id="multiplier"
                name="multiplier"
                value={formData.multiplier}
                onChange={handleInputChange}
                className="form-input"
                placeholder="1.000"
                step="0.001"
                min="0.001"
                required
                disabled={loading}
              />
              <div className="form-help">
                Enter a multiplier (e.g., 1.5 for 50% price increase)
              </div>
              {formData.multiplier && (
                <div className="multiplier-example">
                  {getMultiplierExample()}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="description" className="form-label">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="form-textarea"
                placeholder="Optional description of this material..."
                rows={3}
                disabled={loading}
              />
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
              {loading ? 'Saving...' : (material ? 'Update Material' : 'Create Material')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaterialForm;