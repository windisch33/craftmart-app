import React, { useState, useEffect } from 'react';
import { AlertTriangleIcon, WrenchIcon, DollarIcon, BarChartIcon, InfoIcon } from '../common/icons';
import './StairForms.css';
import stairProductService, { 
  type StairSpecialPart, 
  type StairMaterial,
  type CreateSpecialPartRequest 
} from '../../services/stairProductService';
import AccessibleModal from '../common/AccessibleModal';

interface StairSpecialPartsFormProps {
  specialPart?: StairSpecialPart | null;
  onClose: () => void;
}

interface FormData {
  stpart_id: number;
  stpar_desc: string;
  mat_seq_n: number;
  position: string;
  unit_cost: number;
  labor_cost: number;
  is_active: boolean;
}

interface FormErrors {
  [key: string]: string;
}

const StairSpecialPartsForm: React.FC<StairSpecialPartsFormProps> = ({ specialPart, onClose }) => {
  const [formData, setFormData] = useState<FormData>({
    stpart_id: specialPart?.stpart_id || 0,
    stpar_desc: specialPart?.stpar_desc || '',
    mat_seq_n: specialPart?.mat_seq_n || 0,
    position: specialPart?.position || '',
    unit_cost: specialPart?.unit_cost || 0,
    labor_cost: specialPart?.labor_cost || 0,
    is_active: specialPart?.is_active ?? true
  });

  const [materials, setMaterials] = useState<StairMaterial[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      const materialsData = await stairProductService.getStairMaterials();
      setMaterials(materialsData);
    } catch (error) {
      console.error('Error loading materials:', error);
    } finally {
      setDataLoading(false);
    }
  };

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

    if (!formData.stpart_id || formData.stpart_id <= 0) {
      newErrors.stpart_id = 'Special part ID is required and must be positive';
    }

    if (!formData.stpar_desc.trim()) {
      newErrors.stpar_desc = 'Description is required';
    } else if (formData.stpar_desc.length > 100) {
      newErrors.stpar_desc = 'Description must be 100 characters or less';
    }

    if (!formData.mat_seq_n) {
      newErrors.mat_seq_n = 'Material is required';
    }

    if (formData.unit_cost <= 0) {
      newErrors.unit_cost = 'Unit cost must be greater than 0';
    }

    if (formData.labor_cost < 0) {
      newErrors.labor_cost = 'Labor cost cannot be negative';
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
      const requestData: CreateSpecialPartRequest = {
        stpart_id: formData.stpart_id,
        stpar_desc: formData.stpar_desc.trim(),
        mat_seq_n: formData.mat_seq_n,
        position: formData.position.trim() || undefined,
        unit_cost: formData.unit_cost,
        labor_cost: formData.labor_cost,
        is_active: formData.is_active
      };

      if (specialPart) {
        await stairProductService.updateSpecialPart(specialPart.id, requestData);
      } else {
        await stairProductService.createSpecialPart(requestData);
      }

      onClose();
    } catch (error: any) {
      console.error('Error saving special part:', error);
      setSubmitError(
        error.response?.data?.error || 
        `Failed to ${specialPart ? 'update' : 'create'} special part`
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedMaterial = materials.find(m => m.mat_seq_n === formData.mat_seq_n);

  const titleId = 'stair-special-parts-title';

  if (dataLoading) {
    return (
      <AccessibleModal isOpen={true} onClose={onClose} labelledBy={titleId} overlayClassName="modal-overlay" contentClassName="modal-content">
        <h2 id={titleId} style={{ position: 'absolute', left: -9999 }}>Loading</h2>
        <div className="loading-spinner">Loading materials...</div>
      </AccessibleModal>
    );
  }

  return (
    <AccessibleModal isOpen={true} onClose={onClose} labelledBy={titleId} overlayClassName="modal-overlay" contentClassName="modal-content">
        <div className="modal-header">
          <h2 id={titleId}>{specialPart ? 'Edit Special Part' : 'Add Special Part'}</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close dialog">×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {submitError && (
              <div className="error-message">
                <span className="error-icon"><AlertTriangleIcon /></span>
                {submitError}
              </div>
            )}

            {/* Basic Information */}
            <div className="form-section">
              <h3><span style={{display:'inline-flex', marginRight:8}}><WrenchIcon /></span>Basic Information</h3>
            
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="stpart_id">Special Part ID *</label>
                  <input
                    type="number"
                    id="stpart_id"
                    value={formData.stpart_id}
                    onChange={(e) => handleChange('stpart_id', parseInt(e.target.value) || 0)}
                    min="1"
                    max="999"
                    className={errors.stpart_id ? 'error' : ''}
                    placeholder="e.g., 10"
                  />
                  {errors.stpart_id && <span className="error-text">{errors.stpart_id}</span>}
                  <small>Unique identifier for special part classification</small>
                </div>

                <div className="form-group">
                  <label htmlFor="position">Position</label>
                  <select
                    id="position"
                    value={formData.position}
                    onChange={(e) => handleChange('position', e.target.value)}
                  >
                    <option value="">Any Position</option>
                    <option value="L">Left</option>
                    <option value="R">Right</option>
                    <option value="B">Both</option>
                  </select>
                  <small>Specific position requirement for installation</small>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="stpar_desc">Description *</label>
                <input
                  type="text"
                  id="stpar_desc"
                  value={formData.stpar_desc}
                  onChange={(e) => handleChange('stpar_desc', e.target.value)}
                  maxLength={100}
                  className={errors.stpar_desc ? 'error' : ''}
                  placeholder="e.g., Bull Nose, Quarter Round, Ramshorn Bracket"
                />
                {errors.stpar_desc && <span className="error-text">{errors.stpar_desc}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="mat_seq_n">Material *</label>
                <select
                  id="mat_seq_n"
                  value={formData.mat_seq_n}
                  onChange={(e) => handleChange('mat_seq_n', parseInt(e.target.value))}
                  className={errors.mat_seq_n ? 'error' : ''}
                >
                  <option value={0}>Select material...</option>
                  {materials.map(material => (
                    <option key={material.mat_seq_n} value={material.mat_seq_n}>
                      {material.matrl_nam} - {material.multiplier}x
                    </option>
                  ))}
                </select>
                {errors.mat_seq_n && <span className="error-text">{errors.mat_seq_n}</span>}
                {selectedMaterial && (
                  <small>
                    Multiplier: {selectedMaterial.multiplier}x
                    {selectedMaterial.description && ` - ${selectedMaterial.description}`}
                  </small>
                )}
              </div>
            </div>

            {/* Pricing */}
            <div className="form-section">
              <h3><span style={{display:'inline-flex', marginRight:8}}><DollarIcon /></span>Pricing</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="unit_cost">Unit Cost * ($)</label>
                  <input
                    type="number"
                    id="unit_cost"
                    value={formData.unit_cost}
                    onChange={(e) => handleChange('unit_cost', parseFloat(e.target.value) || 0)}
                    min="0.01"
                    step="0.01"
                    className={errors.unit_cost ? 'error' : ''}
                    placeholder="102.20"
                  />
                  {errors.unit_cost && <span className="error-text">{errors.unit_cost}</span>}
                  <small>Base price for this special part</small>
                </div>

                <div className="form-group">
                  <label htmlFor="labor_cost">Labor Cost ($)</label>
                  <input
                    type="number"
                    id="labor_cost"
                    value={formData.labor_cost}
                    onChange={(e) => handleChange('labor_cost', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    className={errors.labor_cost ? 'error' : ''}
                    placeholder="25.00"
                  />
                  {errors.labor_cost && <span className="error-text">{errors.labor_cost}</span>}
                  <small>Additional labor/installation cost</small>
                </div>
              </div>

              {selectedMaterial && (
                <div className="constraint-row">
                  <h4><InfoIcon width={18} height={18} /> Pricing Preview</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        <strong>Material Cost:</strong> ${Number(formData.unit_cost).toFixed(2)} × {selectedMaterial.multiplier} = 
                        <strong style={{ color: '#1f2937' }}> ${(Number(formData.unit_cost) * Number(selectedMaterial.multiplier)).toFixed(2)}</strong>
                      </span>
                    </div>
                    <div className="form-group">
                      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        <strong>Total per unit:</strong> 
                        <strong style={{ color: '#059669', fontSize: '1rem' }}>
                          {' '}${((Number(formData.unit_cost) * Number(selectedMaterial.multiplier)) + Number(formData.labor_cost)).toFixed(2)}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Status */}
            <div className="form-section">
              <h3><span style={{display:'inline-flex', marginRight:8}}><BarChartIcon /></span>Status</h3>
              
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => handleChange('is_active', e.target.checked)}
                  />
                  Active Special Part
                </label>
                <small>Inactive parts won't appear in selection lists</small>
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
              {loading ? 'Saving...' : (specialPart ? 'Update Special Part' : 'Create Special Part')}
            </button>
          </div>
        </form>
    </AccessibleModal>
  );
};

export default StairSpecialPartsForm;
