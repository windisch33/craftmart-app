import React, { useState, useEffect } from 'react';
import './StairForms.css';
import stairProductService, { 
  type StairMaterial, 
  type CreateStairMaterialRequest 
} from '../../services/stairProductService';

interface StairMaterialFormProps {
  material?: StairMaterial | null;
  onClose: () => void;
}

interface FormData {
  material_name: string;
  multiplier: number;
  display_order: number;
  is_active: boolean;
}

interface FormErrors {
  [key: string]: string;
}

const StairMaterialForm: React.FC<StairMaterialFormProps> = ({ material, onClose }) => {
  const [formData, setFormData] = useState<FormData>({
    material_name: material?.matrl_nam || '',
    multiplier: material?.multiplier || 1.0,
    display_order: material?.display_order || 0,
    is_active: material?.is_active ?? true
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    setSubmitError(null);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.material_name.trim()) {
      newErrors.material_name = 'Material name is required';
    } else if (formData.material_name.length > 100) {
      newErrors.material_name = 'Material name must be 100 characters or less';
    }

    if (formData.multiplier <= 0) {
      newErrors.multiplier = 'Multiplier must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setSubmitError(null);

    try {
      const requestData: CreateStairMaterialRequest = {
        material_name: formData.material_name.trim(),
        multiplier: formData.multiplier,
        display_order: formData.display_order || undefined,
        is_active: formData.is_active
      };

      if (material) {
        await stairProductService.updateStairMaterial(material.id, requestData);
      } else {
        await stairProductService.createStairMaterial(requestData);
      }

      onClose();
    } catch (error: any) {
      console.error('Error saving stair material:', error);
      setSubmitError(
        error.response?.data?.error || 
        `Failed to ${material ? 'update' : 'create'} stair material`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{material ? 'Edit Stair Material' : 'Add Stair Material'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {submitError && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {submitError}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="material_name">Material Name *</label>
              <input
                type="text"
                id="material_name"
                value={formData.material_name}
                onChange={(e) => handleChange('material_name', e.target.value)}
                maxLength={100}
                className={errors.material_name ? 'error' : ''}
                placeholder="e.g., Red Oak, Pine, Cherry, Poplar"
              />
              {errors.material_name && <span className="error-text">{errors.material_name}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="multiplier">Price Multiplier *</label>
                <input
                  type="number"
                  id="multiplier"
                  value={formData.multiplier}
                  onChange={(e) => handleChange('multiplier', parseFloat(e.target.value) || 0)}
                  min="0.001"
                  max="10"
                  step="0.001"
                  className={errors.multiplier ? 'error' : ''}
                  placeholder="1.000"
                />
                {errors.multiplier && <span className="error-text">{errors.multiplier}</span>}
                <small>Pricing multiplier applied to base costs (e.g., 1.5 = 50% premium)</small>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => handleChange('is_active', e.target.checked)}
                  />
                  Active Material
                </label>
                <small>Inactive materials won't appear in selection lists</small>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
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

export default StairMaterialForm;