import React from 'react';
import type { FormData, FormErrors } from './types';

interface BasicConfigurationProps {
  formData: FormData;
  errors: FormErrors;
  onFormChange: (field: keyof FormData, value: any) => void;
}

const BasicConfiguration: React.FC<BasicConfigurationProps> = ({
  formData,
  errors,
  onFormChange
}) => {
  const riserHeight = formData.floorToFloor / formData.numRisers;

  return (
    <div className="basic-config-section">
      <h3 className="config-section-header">📏 Basic Configuration</h3>
      <div className="basic-config-grid">
        <div className="form-group">
          <label htmlFor="configName">Configuration Name *</label>
          <input
            type="text"
            id="configName"
            value={formData.configName}
            onChange={(e) => onFormChange('configName', e.target.value)}
            placeholder="e.g., Main Staircase - Oak"
            className={errors.configName ? 'error' : ''}
          />
          {errors.configName && <span className="error-message">{errors.configName}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="floorToFloor">Floor to Floor Height (inches)&nbsp;*</label>
          <input
            type="number"
            id="floorToFloor"
            value={formData.floorToFloor}
            onChange={(e) => onFormChange('floorToFloor', parseFloat(e.target.value))}
            min="60"
            max="180"
            step="0.25"
            className={errors.floorToFloor ? 'error' : ''}
          />
          {errors.floorToFloor && <span className="error-message">{errors.floorToFloor}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="numRisers">Number of Risers *</label>
          <input
            type="number"
            id="numRisers"
            value={formData.numRisers}
            onChange={(e) => onFormChange('numRisers', parseInt(e.target.value))}
            min="1"
            max="30"
            className={errors.numRisers ? 'error' : ''}
          />
          {errors.numRisers && <span className="error-message">{errors.numRisers}</span>}
        </div>

        <div className="form-group">
          <label>Tread Dimensions & Calculations</label>
          <div className="tread-calc-combined">
            <div className="tread-input-group">
              <label htmlFor="roughCutWidth">Rough Cut Width (inches)</label>
              <input
                type="number"
                id="roughCutWidth"
                value={formData.roughCutWidth}
                onChange={(e) => {
                  const newWidth = parseFloat(e.target.value) || 0;
                  onFormChange('roughCutWidth', newWidth);
                  onFormChange('treadSize', `${newWidth}x${formData.noseSize}`);
                }}
                min="8"
                max="20"
                step="0.25"
                placeholder="10.0"
                className={errors.roughCutWidth ? 'error' : ''}
              />
              {errors.roughCutWidth && <span className="error-message">{errors.roughCutWidth}</span>}
            </div>
            
            <div className="tread-input-group">
              <label htmlFor="noseSize">Nose Size (inches)</label>
              <input
                type="number"
                id="noseSize"
                value={formData.noseSize}
                onChange={(e) => {
                  const newNose = parseFloat(e.target.value) || 0;
                  onFormChange('noseSize', newNose);
                  onFormChange('treadSize', `${formData.roughCutWidth}x${newNose}`);
                }}
                min="0.5"
                max="3"
                step="0.125"
                placeholder="1.25"
                className={errors.noseSize ? 'error' : ''}
              />
              {errors.noseSize && <span className="error-message">{errors.noseSize}</span>}
            </div>
            
            <div className="calc-display-inline">
              <div className="calc-item-compact">
                <span className="calc-label">Riser Height:</span>
                <span className="calc-value">{riserHeight.toFixed(3)}"</span>
              </div>
              <div className="calc-item-compact">
                <span className="calc-label">Total Tread:</span>
                <span className="calc-value">{(formData.roughCutWidth + formData.noseSize).toFixed(2)}"</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicConfiguration;