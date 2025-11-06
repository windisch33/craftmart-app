import React from 'react';
import { TreeIcon } from '../../common/icons';
import type { FormData, FormErrors } from './types';
import FractionalInput from './FractionalInput';
import type { StairMaterial } from '../../../services/stairService';

interface MaterialsAndStringersProps {
  formData: FormData;
  errors: FormErrors;
  materials: StairMaterial[];
  leftStringerWidth: number;
  leftStringerThickness: number;
  leftStringerMaterial: number;
  rightStringerWidth: number;
  rightStringerThickness: number;
  rightStringerMaterial: number;
  hasCenter: boolean;
  centerStringerWidth: number;
  centerStringerThickness: number;
  centerStringerMaterial: number;
  onFormChange: (field: keyof FormData, value: any) => void;
  setLeftStringerWidth: (width: number) => void;
  setLeftStringerThickness: (thickness: number) => void;
  setLeftStringerMaterial: (materialId: number) => void;
  setRightStringerWidth: (width: number) => void;
  setRightStringerThickness: (thickness: number) => void;
  setRightStringerMaterial: (materialId: number) => void;
  setHasCenter: (hasCenter: boolean) => void;
  setCenterStringerWidth: (width: number) => void;
  setCenterStringerThickness: (thickness: number) => void;
  setCenterStringerMaterial: (materialId: number) => void;
}

const MaterialsAndStringers: React.FC<MaterialsAndStringersProps> = ({
  formData,
  errors,
  materials,
  leftStringerWidth,
  leftStringerThickness,
  leftStringerMaterial,
  rightStringerWidth,
  rightStringerThickness,
  rightStringerMaterial,
  hasCenter,
  centerStringerWidth,
  centerStringerThickness,
  centerStringerMaterial,
  onFormChange,
  setLeftStringerWidth,
  setLeftStringerThickness,
  setLeftStringerMaterial,
  setRightStringerWidth,
  setRightStringerThickness,
  setRightStringerMaterial,
  setHasCenter,
  setCenterStringerWidth,
  setCenterStringerThickness,
  setCenterStringerMaterial
}) => {
  const selectedTreadMaterial = materials.find(m => m.mat_seq_n === formData.treadMaterialId);
  const selectedRiserMaterial = materials.find(m => m.mat_seq_n === formData.riserMaterialId);

  return (
    <div className="materials-stringer-section">
      <h3 className="config-section-header"><TreeIcon width={20} height={20} /> Materials & Stringers</h3>
      <div className="materials-stringer-grid">
        {/* Materials */}
        <div>
          <h4>Materials</h4>
          <div className="form-group">
            <label htmlFor="treadMaterial">Tread Material *</label>
            <select
              id="treadMaterial"
              value={formData.treadMaterialId}
              onChange={(e) => onFormChange('treadMaterialId', parseInt(e.target.value))}
              className={errors.treadMaterialId ? 'error' : ''}
            >
              <option value="">Select material...</option>
              {materials.map(material => (
                <option key={material.mat_seq_n} value={material.mat_seq_n}>
                  {material.matrl_nam}
                </option>
              ))}
            </select>
            {selectedTreadMaterial && (
              <small>Multiplier: {selectedTreadMaterial.multiplier}x</small>
            )}
            {errors.treadMaterialId && <span className="error-message">{errors.treadMaterialId}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="riserMaterial">Riser Material *</label>
            <select
              id="riserMaterial"
              value={formData.riserMaterialId}
              onChange={(e) => onFormChange('riserMaterialId', parseInt(e.target.value))}
              className={errors.riserMaterialId ? 'error' : ''}
            >
              <option value="">Select material...</option>
              {materials.map(material => (
                <option key={material.mat_seq_n} value={material.mat_seq_n}>
                  {material.matrl_nam}
                </option>
              ))}
            </select>
            {selectedRiserMaterial && (
              <small>Multiplier: {selectedRiserMaterial.multiplier}x</small>
            )}
            {errors.riserMaterialId && <span className="error-message">{errors.riserMaterialId}</span>}
          </div>
        </div>

        {/* Stringers */}
        <div>
          <h4>Stringer Configuration</h4>
          <small style={{ display: 'block', marginBottom: '12px', color: '#6b7280', fontSize: '13px' }}>
            Configure each stringer separately with dimensions and material
          </small>
          
          <div className="stringer-inputs">
            {/* Left Stringer */}
            <div className="stringer-section">
              <h5>Left Stringer</h5>
              <div className="stringer-fields">
                <div className="form-group">
                  <label>Thickness (in)</label>
                  <FractionalInput
                    value={leftStringerThickness}
                    onCommit={(v) => { if (Number.isFinite(v)) setLeftStringerThickness(v); }}
                    placeholder="e.g., 1, 1 1/4"
                  />
                </div>
                <div className="form-group">
                  <label>Width (in)</label>
                  <FractionalInput
                    value={leftStringerWidth}
                    onCommit={(v) => { if (Number.isFinite(v)) setLeftStringerWidth(v); }}
                    placeholder="e.g., 9 1/4"
                  />
                </div>
                <div className="form-group">
                  <label>Material</label>
                  <select
                    value={leftStringerMaterial}
                    onChange={(e) => setLeftStringerMaterial(parseInt(e.target.value))}
                  >
                    <option value="">Select...</option>
                    {materials.map(material => (
                      <option key={material.mat_seq_n} value={material.mat_seq_n}>
                        {material.matrl_nam}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            {/* Right Stringer */}
            <div className="stringer-section">
              <h5>Right Stringer</h5>
              <div className="stringer-fields">
                <div className="form-group">
                  <label>Thickness (in)</label>
                  <FractionalInput
                    value={rightStringerThickness}
                    onCommit={(v) => { if (Number.isFinite(v)) setRightStringerThickness(v); }}
                    placeholder="e.g., 1, 1 1/4"
                  />
                </div>
                <div className="form-group">
                  <label>Width (in)</label>
                  <FractionalInput
                    value={rightStringerWidth}
                    onCommit={(v) => { if (Number.isFinite(v)) setRightStringerWidth(v); }}
                    placeholder="e.g., 9 1/4"
                  />
                </div>
                <div className="form-group">
                  <label>Material</label>
                  <select
                    value={rightStringerMaterial}
                    onChange={(e) => setRightStringerMaterial(parseInt(e.target.value))}
                  >
                    <option value="">Select...</option>
                    {materials.map(material => (
                      <option key={material.mat_seq_n} value={material.mat_seq_n}>
                        {material.matrl_nam}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            {/* Center Stringer (Optional) */}
            <div className="stringer-section">
              <h5>Center Stringer (Optional)</h5>
              <div className="stringer-checkbox">
                <input
                  type="checkbox"
                  id="hasCenter"
                  checked={hasCenter}
                  onChange={(e) => setHasCenter(e.target.checked)}
                />
                <label htmlFor="hasCenter">Include Center Stringer</label>
              </div>
              {hasCenter && (
                <div className="stringer-fields">
                  <div className="form-group">
                    <label>Thickness (in)</label>
                    <FractionalInput
                      value={centerStringerThickness}
                      onCommit={(v) => { if (Number.isFinite(v)) setCenterStringerThickness(v); }}
                      placeholder="e.g., 1, 1 1/4"
                    />
                  </div>
                  <div className="form-group">
                    <label>Width (in)</label>
                    <FractionalInput
                      value={centerStringerWidth}
                      onCommit={(v) => { if (Number.isFinite(v)) setCenterStringerWidth(v); }}
                      placeholder="e.g., 9 1/4"
                    />
                  </div>
                  <div className="form-group">
                    <label>Material</label>
                    <select
                      value={centerStringerMaterial}
                      onChange={(e) => setCenterStringerMaterial(parseInt(e.target.value))}
                    >
                      <option value="">Select...</option>
                      {materials.map(material => (
                        <option key={material.mat_seq_n} value={material.mat_seq_n}>
                          {material.matrl_nam}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialsAndStringers;
