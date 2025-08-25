import React from 'react';
import type { FormData } from './types';
import type { StairSpecialPart, SpecialPartConfiguration } from '../../../services/stairService';

interface SpecialPartsAndNotesProps {
  formData: FormData;
  specialParts: SpecialPartConfiguration[];
  availableSpecialParts: StairSpecialPart[];
  onFormChange: (field: keyof FormData, value: any) => void;
  addSpecialPart: () => void;
  removeSpecialPart: (index: number) => void;
  updateSpecialPart: (index: number, field: keyof SpecialPartConfiguration, value: any) => void;
}

const SpecialPartsAndNotes: React.FC<SpecialPartsAndNotesProps> = ({
  formData,
  specialParts,
  availableSpecialParts,
  onFormChange,
  addSpecialPart,
  removeSpecialPart,
  updateSpecialPart
}) => {
  return (
    <div className="bottom-section">
      <h3 className="config-section-header">⚙️ Special Parts & Notes</h3>
      <div className="bottom-section-grid">
        <div className="special-parts-section">
          <div className="section-header">
            <h4>Special Parts</h4>
            <button type="button" onClick={addSpecialPart} className="btn btn-secondary">
              Add Special Part
            </button>
          </div>
          
          {specialParts.map((part, index) => (
              <div key={index} className="special-part-config">
                <select
                  value={part.partId}
                  onChange={(e) => updateSpecialPart(index, 'partId', parseInt(e.target.value))}
                >
                  {availableSpecialParts.map(p => (
                    <option key={`${p.stpart_id}-${p.mat_seq_n}`} value={p.stpart_id}>
                      {p.stpar_desc} - {p.matrl_nam} (${p.unit_cost})
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
            )
          )}
        </div>

        <div className="form-group">
          <label htmlFor="specialNotes">Special Notes</label>
          <textarea
            id="specialNotes"
            value={formData.specialNotes}
            onChange={(e) => onFormChange('specialNotes', e.target.value)}
            rows={5}
            placeholder="Enter any special notes or requirements..."
          />
        </div>
      </div>
    </div>
  );
};

export default SpecialPartsAndNotes;