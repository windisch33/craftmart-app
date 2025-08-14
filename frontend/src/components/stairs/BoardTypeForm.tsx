import React, { useState } from 'react';
import './StairForms.css';
import stairProductService, { 
  type StairBoardType, 
  type CreateBoardTypeRequest 
} from '../../services/stairProductService';

interface BoardTypeFormProps {
  boardType?: StairBoardType | null;
  onClose: () => void;
}

interface FormData {
  brd_typ_id: number;
  brdtyp_des: string;
  purpose: string;
  // Simplified pricing fields
  base_price: number;
  length_increment_price: number;
  width_increment_price: number;
  mitre_price: number;
  base_length: number;
  base_width: number;
  length_increment_size: number;
  width_increment_size: number;
  is_active: boolean;
}

interface FormErrors {
  [key: string]: string;
}

const BoardTypeForm: React.FC<BoardTypeFormProps> = ({ boardType, onClose }) => {
  const [formData, setFormData] = useState<FormData>({
    brd_typ_id: boardType?.brd_typ_id || 0,
    brdtyp_des: boardType?.brdtyp_des || '',
    purpose: boardType?.purpose || '',
    base_price: boardType?.base_price || 0,
    length_increment_price: boardType?.length_increment_price || 0,
    width_increment_price: boardType?.width_increment_price || 0,
    mitre_price: boardType?.mitre_price || 0,
    base_length: boardType?.base_length || 36,
    base_width: boardType?.base_width || 9,
    length_increment_size: boardType?.length_increment_size || 6,
    width_increment_size: boardType?.width_increment_size || 1,
    is_active: boardType?.is_active ?? true
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

    if (!formData.brd_typ_id || formData.brd_typ_id <= 0) {
      newErrors.brd_typ_id = 'Board type ID is required and must be positive';
    }

    if (!formData.brdtyp_des.trim()) {
      newErrors.brdtyp_des = 'Board type description is required';
    } else if (formData.brdtyp_des.length > 100) {
      newErrors.brdtyp_des = 'Description must be 100 characters or less';
    }

    if (formData.base_price < 0) {
      newErrors.base_price = 'Base price cannot be negative';
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
      const requestData: CreateBoardTypeRequest = {
        brd_typ_id: formData.brd_typ_id,
        brdtyp_des: formData.brdtyp_des.trim(),
        purpose: formData.purpose.trim() || undefined,
        base_price: formData.base_price,
        length_increment_price: formData.length_increment_price,
        width_increment_price: formData.width_increment_price,
        mitre_price: formData.mitre_price,
        base_length: formData.base_length,
        base_width: formData.base_width,
        length_increment_size: formData.length_increment_size,
        width_increment_size: formData.width_increment_size,
        is_active: formData.is_active
      };

      if (boardType) {
        await stairProductService.updateBoardType(boardType.id, requestData);
      } else {
        await stairProductService.createBoardType(requestData);
      }

      onClose();
    } catch (error: any) {
      console.error('Error saving board type:', error);
      setSubmitError(
        error.response?.data?.error || 
        `Failed to ${boardType ? 'update' : 'create'} board type`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{boardType ? 'Edit Board Type & Pricing' : 'Add Board Type & Pricing'}</h2>
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

            {/* Board Type Information */}
            <h3 style={{ fontSize: '16px', marginBottom: '12px', color: '#4b5563' }}>
              Board Type Information
            </h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="brd_typ_id">Board Type ID {!boardType && '*'}</label>
                <input
                  type="number"
                  id="brd_typ_id"
                  value={formData.brd_typ_id}
                  onChange={(e) => handleChange('brd_typ_id', parseInt(e.target.value) || 0)}
                  min="1"
                  max="999"
                  className={errors.brd_typ_id ? 'error' : ''}
                  placeholder="e.g., 11"
                  disabled={!!boardType}
                  style={boardType ? { backgroundColor: '#f3f4f6', cursor: 'not-allowed' } : {}}
                />
                {errors.brd_typ_id && <span className="error-text">{errors.brd_typ_id}</span>}
                <small>{boardType ? 'ID cannot be changed after creation' : 'Unique identifier for board type'}</small>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => handleChange('is_active', e.target.checked)}
                  />
                  Active Board Type
                </label>
                <small>Inactive types won't appear in selection lists</small>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="brdtyp_des">Board Type Description *</label>
              <input
                type="text"
                id="brdtyp_des"
                value={formData.brdtyp_des}
                onChange={(e) => handleChange('brdtyp_des', e.target.value)}
                maxLength={100}
                className={errors.brdtyp_des ? 'error' : ''}
                placeholder="e.g., Box Tread, Open Tread, Riser, Stringer"
              />
              {errors.brdtyp_des && <span className="error-text">{errors.brdtyp_des}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="purpose">Purpose</label>
              <textarea
                id="purpose"
                value={formData.purpose}
                onChange={(e) => handleChange('purpose', e.target.value)}
                rows={2}
                placeholder="Description of board type usage"
              />
            </div>

            {/* Pricing Configuration */}
            <h3 style={{ fontSize: '16px', marginTop: '20px', marginBottom: '12px', color: '#4b5563' }}>
              Pricing Configuration
            </h3>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
              Formula: (Base + Length + Width) × Material + Mitre
            </p>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="base_price">Base Price ($)</label>
                <input
                  type="number"
                  id="base_price"
                  value={formData.base_price}
                  onChange={(e) => handleChange('base_price', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  className={errors.base_price ? 'error' : ''}
                  placeholder="37.00"
                />
                {errors.base_price && <span className="error-text">{errors.base_price}</span>}
                <small>Base price for standard size</small>
              </div>

              <div className="form-group">
                <label htmlFor="mitre_price">Mitre Charge ($)</label>
                <input
                  type="number"
                  id="mitre_price"
                  value={formData.mitre_price}
                  onChange={(e) => handleChange('mitre_price', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
                <small>Additional charge for mitre cuts</small>
              </div>
            </div>

            {/* Length Pricing */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="base_length">Base Length (inches)</label>
                <input
                  type="number"
                  id="base_length"
                  value={formData.base_length}
                  onChange={(e) => handleChange('base_length', parseFloat(e.target.value) || 36)}
                  min="1"
                  step="0.25"
                  placeholder="36"
                />
                <small>Standard length</small>
              </div>

              <div className="form-group">
                <label htmlFor="length_increment_size">Length Increment</label>
                <input
                  type="number"
                  id="length_increment_size"
                  value={formData.length_increment_size}
                  onChange={(e) => handleChange('length_increment_size', parseFloat(e.target.value) || 6)}
                  min="0.25"
                  step="0.25"
                  placeholder="6"
                />
                <small>Increment size in inches</small>
              </div>

              <div className="form-group">
                <label htmlFor="length_increment_price">Length Charge ($/increment)</label>
                <input
                  type="number"
                  id="length_increment_price"
                  value={formData.length_increment_price}
                  onChange={(e) => handleChange('length_increment_price', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  placeholder="1.25"
                />
                <small>Price per increment over base</small>
              </div>
            </div>

            {/* Width Pricing */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="base_width">Base Width (inches)</label>
                <input
                  type="number"
                  id="base_width"
                  value={formData.base_width}
                  onChange={(e) => handleChange('base_width', parseFloat(e.target.value) || 9)}
                  min="1"
                  step="0.25"
                  placeholder="9"
                />
                <small>Standard width</small>
              </div>

              <div className="form-group">
                <label htmlFor="width_increment_size">Width Increment</label>
                <input
                  type="number"
                  id="width_increment_size"
                  value={formData.width_increment_size}
                  onChange={(e) => handleChange('width_increment_size', parseFloat(e.target.value) || 1)}
                  min="0.25"
                  step="0.25"
                  placeholder="1"
                />
                <small>Increment size in inches</small>
              </div>

              <div className="form-group">
                <label htmlFor="width_increment_price">Width Charge ($/increment)</label>
                <input
                  type="number"
                  id="width_increment_price"
                  value={formData.width_increment_price}
                  onChange={(e) => handleChange('width_increment_price', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  placeholder="2.00"
                />
                <small>Price per increment over base width</small>
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
              {loading ? 'Saving...' : (boardType ? 'Update Board Type' : 'Create Board Type')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BoardTypeForm;