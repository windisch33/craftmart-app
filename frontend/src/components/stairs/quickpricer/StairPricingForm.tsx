import React from 'react';
import { BoxIcon, LockIcon, ArrowLeftIcon, ArrowRightIcon, WarningIcon, UnlockIcon } from '../../common/icons';
import type { StairMaterial, StairSpecialPart } from '../../../services/stairService';
import type { StairFormData, TreadBulkConfig, StairStringersConfig } from './types';

interface StairPricingFormProps {
  stairFormData: StairFormData;
  setStairFormData: React.Dispatch<React.SetStateAction<StairFormData>>;
  bulkConfig: TreadBulkConfig;
  setBulkConfig: (updates: Partial<TreadBulkConfig>) => void;
  stringersConfig: StairStringersConfig;
  setStringersConfig: (updates: Partial<StairStringersConfig>) => void;
  stairMaterials: StairMaterial[];
  specialParts: StairSpecialPart[];
  availableSpecialParts: StairSpecialPart[];
  addSpecialPart: () => void;
  removeSpecialPart: (index: number) => void;
  updateSpecialPart: (index: number, field: string, value: any) => void;
}

const StairPricingForm: React.FC<StairPricingFormProps> = ({
  stairFormData,
  setStairFormData,
  bulkConfig,
  setBulkConfig,
  stringersConfig,
  setStringersConfig,
  stairMaterials,
  specialParts,
  availableSpecialParts,
  addSpecialPart,
  removeSpecialPart,
  updateSpecialPart
}) => {
  const totalTreads = bulkConfig.boxTreadCount + bulkConfig.openTreadCount + bulkConfig.doubleOpenCount;

  return (
    <div className="stair-form-section">
      <h3>Stair Configuration</h3>
      
      {/* Basic Configuration */}
      <div className="form-row">
        <div className="form-group">
          <label>Floor to Floor Height (inches)</label>
          <input
            type="number"
            value={stairFormData.floorToFloor}
            onChange={(e) => setStairFormData(prev => ({ ...prev, floorToFloor: Number(e.target.value) }))}
            step="0.125"
            min="1"
          />
        </div>
        <div className="form-group">
          <label>Number of Risers</label>
          <input
            type="number"
            value={stairFormData.numRisers}
            onChange={(e) => setStairFormData(prev => ({ ...prev, numRisers: Number(e.target.value) }))}
            min="1"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Rough Cut Width (inches)</label>
          <input
            type="number"
            value={stairFormData.roughCutWidth}
            onChange={(e) => setStairFormData(prev => ({ ...prev, roughCutWidth: Number(e.target.value) }))}
            step="0.25"
            min="1"
          />
        </div>
        <div className="form-group">
          <label>Nose Size (inches)</label>
          <input
            type="number"
            value={stairFormData.noseSize}
            onChange={(e) => setStairFormData(prev => ({ ...prev, noseSize: Number(e.target.value) }))}
            step="0.125"
            min="0.5"
            max="2"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Tread Material</label>
          <select
            value={stairFormData.treadMaterialId}
            onChange={(e) => setStairFormData(prev => ({ ...prev, treadMaterialId: Number(e.target.value) }))}
          >
            <option value="">Select material...</option>
            {stairMaterials.map(material => (
              <option key={material.mat_seq_n} value={material.mat_seq_n}>
                {material.matrl_nam}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Riser Material</label>
          <select
            value={stairFormData.riserMaterialId}
            onChange={(e) => setStairFormData(prev => ({ ...prev, riserMaterialId: Number(e.target.value) }))}
          >
            <option value="">Select material...</option>
            {stairMaterials.map(material => (
              <option key={material.mat_seq_n} value={material.mat_seq_n}>
                {material.matrl_nam}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tread Configuration */}
      <div className="tread-configuration-sections">
        {/* Box Treads */}
        <div className="tread-type-section">
          <h4>Box Treads</h4>
          <div className="tread-inputs two-column">
            <div className="form-group">
              <label>Number of Box Treads</label>
              <input
                type="number"
                value={bulkConfig.boxTreadCount || ''}
                onChange={(e) => setBulkConfig({ boxTreadCount: parseInt(e.target.value) || 0 })}
                min="0"
                max={stairFormData.numRisers}
                placeholder="0"
              />
            </div>
            <div className="form-group">
              <label>Width (inches)</label>
              <input
                type="number"
                value={bulkConfig.boxTreadWidth || ''}
                onChange={(e) => setBulkConfig({ boxTreadWidth: parseFloat(e.target.value) || 0 })}
                min="30"
                max="120"
                step="0.25"
                placeholder="Enter width"
                disabled={bulkConfig.boxTreadCount === 0}
              />
            </div>
          </div>
        </div>

        {/* Open Treads */}
        <div className="tread-type-section">
          <h4>Open Treads</h4>
          <div className="tread-inputs two-column">
            <div className="form-group">
              <label>Number of Open Treads</label>
              <input
                type="number"
                value={bulkConfig.openTreadCount || ''}
                onChange={(e) => setBulkConfig({ openTreadCount: parseInt(e.target.value) || 0 })}
                min="0"
                max={stairFormData.numRisers}
                placeholder="0"
              />
            </div>
            <div className="form-group">
              <label>Width (inches)</label>
              <input
                type="number"
                value={bulkConfig.openTreadWidth || ''}
                onChange={(e) => setBulkConfig({ openTreadWidth: parseFloat(e.target.value) || 0 })}
                min="30"
                max="120"
                step="0.25"
                placeholder="Enter width"
                disabled={bulkConfig.openTreadCount === 0}
              />
            </div>
          </div>
          
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>Direction</label>
            <select
              value={bulkConfig.openTreadDirection}
              onChange={(e) => setBulkConfig({ openTreadDirection: e.target.value as 'left' | 'right' })}
              disabled={bulkConfig.openTreadCount === 0}
            >
              <option value="left">⬅ Open Left</option>
              <option value="right">➡ Open Right</option>
            </select>
          </div>
          
          {bulkConfig.openTreadCount > 0 && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0f9ff', borderRadius: '0.5rem', border: '1px solid #bae6fd' }}>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={bulkConfig.openTreadFullMitre}
                    onChange={(e) => setBulkConfig({ openTreadFullMitre: e.target.checked })}
                  />
                  Full Mitre (No Brackets)
                </label>
              </div>
              
              {!bulkConfig.openTreadFullMitre && (
                <div className="form-group">
                  <label>Bracket Type</label>
                  <select
                    value={bulkConfig.openTreadBracket}
                    onChange={(e) => setBulkConfig({ openTreadBracket: e.target.value })}
                  >
                    <option value="Standard Bracket">Standard Bracket</option>
                    <option value="Ramshorn Bracket">Ramshorn Bracket</option>
                    <option value="Custom Bracket">Custom Bracket</option>
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Double Open Treads */}
        <div className="tread-type-section">
          <h4>Double Open Treads</h4>
          <div className="tread-inputs two-column">
            <div className="form-group">
              <label>Number of Double Open Treads</label>
              <input
                type="number"
                value={bulkConfig.doubleOpenCount || ''}
                onChange={(e) => setBulkConfig({ doubleOpenCount: parseInt(e.target.value) || 0 })}
                min="0"
                max={stairFormData.numRisers}
                placeholder="0"
              />
            </div>
            <div className="form-group">
              <label>Width (inches)</label>
              <input
                type="number"
                value={bulkConfig.doubleOpenWidth || ''}
                onChange={(e) => setBulkConfig({ doubleOpenWidth: parseFloat(e.target.value) || 0 })}
                min="30"
                max="120"
                step="0.25"
                placeholder="Enter width"
                disabled={bulkConfig.doubleOpenCount === 0}
              />
            </div>
          </div>
          
          {bulkConfig.doubleOpenCount > 0 && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0f9ff', borderRadius: '0.5rem', border: '1px solid #bae6fd' }}>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={bulkConfig.doubleOpenFullMitre}
                    onChange={(e) => setBulkConfig({ doubleOpenFullMitre: e.target.checked })}
                  />
                  Full Mitre (No Brackets)
                </label>
              </div>
              
              {!bulkConfig.doubleOpenFullMitre && (
                <div className="form-group">
                  <label>Bracket Type</label>
                  <select
                    value={bulkConfig.doubleOpenBracket}
                    onChange={(e) => setBulkConfig({ doubleOpenBracket: e.target.value })}
                  >
                    <option value="Standard Bracket">Standard Bracket</option>
                    <option value="Ramshorn Bracket">Ramshorn Bracket</option>
                    <option value="Custom Bracket">Custom Bracket</option>
                  </select>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Validation Display */}
      <div className="tread-validation">
        <p><strong>Total Treads:</strong> {totalTreads} / <strong>Required:</strong> {stairFormData.numRisers - 1} or {stairFormData.numRisers}</p>
        {totalTreads === stairFormData.numRisers && (
          <p className="info-message success">✓ No landing tread - top gets full tread</p>
        )}
        {totalTreads === (stairFormData.numRisers - 1) && (
          <p className="info-message success">✓ Includes landing tread</p>
        )}
        {totalTreads > stairFormData.numRisers && (
          <p className="info-message error"><WarningIcon width={16} height={16} /> Too many treads specified</p>
        )}
      </div>

      {/* Stringer Configuration */}
      <div className="form-section">
        <h3>Stringer Configuration</h3>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '1rem' }}>
          Configure each stringer separately with dimensions and material
        </p>
        
        <div className="stringer-inputs">
          {/* Left Stringer */}
          <div className="stringer-section">
            <h5>Left Stringer</h5>
            <div className="stringer-fields">
              <div className="form-group">
                <label>Thickness (in)</label>
                <input
                  type="number"
                  value={stringersConfig.leftStringerThickness || ''}
                  onChange={(e) => setStringersConfig({ leftStringerThickness: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.25"
                />
              </div>
              <div className="form-group">
                <label>Width (in)</label>
                <input
                  type="number"
                  value={stringersConfig.leftStringerWidth || ''}
                  onChange={(e) => setStringersConfig({ leftStringerWidth: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.25"
                />
              </div>
              <div className="form-group">
                <label>Material</label>
                <select
                  value={stringersConfig.leftStringerMaterial}
                  onChange={(e) => setStringersConfig({ leftStringerMaterial: parseInt(e.target.value) })}
                >
                  <option value="">Select...</option>
                  {stairMaterials.map(material => (
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
                <input
                  type="number"
                  value={stringersConfig.rightStringerThickness || ''}
                  onChange={(e) => setStringersConfig({ rightStringerThickness: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.25"
                />
              </div>
              <div className="form-group">
                <label>Width (in)</label>
                <input
                  type="number"
                  value={stringersConfig.rightStringerWidth || ''}
                  onChange={(e) => setStringersConfig({ rightStringerWidth: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.25"
                />
              </div>
              <div className="form-group">
                <label>Material</label>
                <select
                  value={stringersConfig.rightStringerMaterial}
                  onChange={(e) => setStringersConfig({ rightStringerMaterial: parseInt(e.target.value) })}
                >
                  <option value="">Select...</option>
                  {stairMaterials.map(material => (
                    <option key={material.mat_seq_n} value={material.mat_seq_n}>
                      {material.matrl_nam}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {/* Center Stringer */}
          <div className="stringer-section">
            <h5>Center Stringer (Optional)</h5>
            <div className="stringer-checkbox">
              <input
                type="checkbox"
                id="hasCenter"
                checked={stringersConfig.hasCenter}
                onChange={(e) => setStringersConfig({ hasCenter: e.target.checked })}
              />
              <label htmlFor="hasCenter">Include Center Stringer</label>
            </div>
            {stringersConfig.hasCenter && (
              <div className="stringer-fields">
                <div className="form-group">
                  <label>Thickness (in)</label>
                  <input
                    type="number"
                    value={stringersConfig.centerStringerThickness || ''}
                    onChange={(e) => setStringersConfig({ centerStringerThickness: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="0.25"
                  />
                </div>
                <div className="form-group">
                  <label>Width (in)</label>
                  <input
                    type="number"
                    value={stringersConfig.centerStringerWidth || ''}
                    onChange={(e) => setStringersConfig({ centerStringerWidth: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="0.25"
                  />
                </div>
                <div className="form-group">
                  <label>Material</label>
                  <select
                    value={stringersConfig.centerStringerMaterial}
                    onChange={(e) => setStringersConfig({ centerStringerMaterial: parseInt(e.target.value) })}
                  >
                    <option value="">Select...</option>
                    {stairMaterials.map(material => (
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

      {/* Special Parts */}
      <div className="form-section">
        <div className="section-header">
          <h4>Special Parts</h4>
          <button type="button" onClick={addSpecialPart} className="btn btn-secondary">
            Add Special Part
          </button>
        </div>
        
        {specialParts.map((part, index) => (
          <div key={index} className="special-part-config">
            <select
              value={part.stpart_id}
              onChange={(e) => updateSpecialPart(index, 'stpart_id', parseInt(e.target.value))}
            >
              <option value={0}>Select special part...</option>
              {availableSpecialParts.map(p => (
                <option key={p.stpart_id} value={p.stpart_id}>
                  {p.stpar_desc} (${p.unit_cost})
                </option>
              ))}
            </select>
            
            <input
              type="number"
              value={part.quantity}
              onChange={(e) => updateSpecialPart(index, 'quantity', parseInt(e.target.value))}
              min="1"
              max="10"
              placeholder="Qty"
            />
            
            <button
              type="button"
              onClick={() => removeSpecialPart(index)}
              className="btn btn-danger btn-sm"
              style={{ minWidth: '70px', flexShrink: 0 }}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StairPricingForm;