import React, { useEffect, useState } from 'react';
import { RulerIcon } from '../../common/icons';
import type { FormData, FormErrors } from './types';
import { parseNumberLike, parseIntegerLike } from '../../../utils/numberParsing';

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
  const [floorToFloorText, setFloorToFloorText] = useState(String(formData.floorToFloor ?? ''));
  const [numRisersText, setNumRisersText] = useState(String(formData.numRisers ?? ''));
  const [roughCutWidthText, setRoughCutWidthText] = useState(String(formData.roughCutWidth ?? ''));
  const [noseSizeText, setNoseSizeText] = useState(String(formData.noseSize ?? ''));

  // Sync local text when formData changes externally (e.g., editing existing config)
  useEffect(() => { setFloorToFloorText(String(formData.floorToFloor ?? '')); }, [formData.floorToFloor]);
  useEffect(() => { setNumRisersText(String(formData.numRisers ?? '')); }, [formData.numRisers]);
  useEffect(() => { setRoughCutWidthText(String(formData.roughCutWidth ?? '')); }, [formData.roughCutWidth]);
  useEffect(() => { setNoseSizeText(String(formData.noseSize ?? '')); }, [formData.noseSize]);

  const riserHeight = (Number(formData.floorToFloor) / (Number(formData.numRisers) || 1));

  return (
    <div className="basic-config-section">
      <h3 className="config-section-header"><RulerIcon width={20} height={20} /> Basic Configuration</h3>
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
            type="text"
            id="floorToFloor"
            value={floorToFloorText}
            onChange={(e) => setFloorToFloorText(e.target.value)}
            onBlur={() => {
              const v = parseNumberLike(floorToFloorText);
              if (Number.isFinite(v)) {
                onFormChange('floorToFloor', v);
                setFloorToFloorText(String(v));
              }
            }}
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
            type="text"
            id="numRisers"
            value={numRisersText}
            onChange={(e) => setNumRisersText(e.target.value)}
            onBlur={() => {
              const v = parseIntegerLike(numRisersText);
              if (Number.isFinite(v)) {
                onFormChange('numRisers', v);
                setNumRisersText(String(v));
              }
            }}
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
                type="text"
                id="roughCutWidth"
                value={roughCutWidthText}
                onChange={(e) => setRoughCutWidthText(e.target.value)}
                onBlur={() => {
                  const newWidth = parseNumberLike(roughCutWidthText);
                  if (Number.isFinite(newWidth)) {
                    onFormChange('roughCutWidth', newWidth);
                    onFormChange('treadSize', `${newWidth}x${formData.noseSize}`);
                    setRoughCutWidthText(String(newWidth));
                  }
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
                type="text"
                id="noseSize"
                value={noseSizeText}
                onChange={(e) => setNoseSizeText(e.target.value)}
                onBlur={() => {
                  const newNose = parseNumberLike(noseSizeText);
                  if (Number.isFinite(newNose)) {
                    onFormChange('noseSize', newNose);
                    onFormChange('treadSize', `${formData.roughCutWidth}x${newNose}`);
                    setNoseSizeText(String(newNose));
                  }
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
                <span className="calc-value">{(Number(formData.roughCutWidth) + Number(formData.noseSize)).toFixed(2)}"</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicConfiguration;
