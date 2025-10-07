import React from 'react';
import { WarningIcon } from '../../common/icons';
import { parseIntegerLike } from '../../../utils/numberParsing';
import FractionalInput from './FractionalInput';
import type { FormData, FormErrors } from './types';

interface TreadConfigurationProps {
  formData: FormData;
  errors: FormErrors;
  boxTreadCount: number;
  boxTreadWidth: number;
  openTreadCount: number;
  openTreadWidth: number;
  openTreadDirection: 'left' | 'right';
  openTreadFullMitre: boolean;
  openTreadBracket: string;
  doubleOpenCount: number;
  doubleOpenWidth: number;
  doubleOpenFullMitre: boolean;
  doubleOpenBracket: string;
  hasLandingTread: boolean;
  setBoxTreadCount: (count: number) => void;
  setBoxTreadWidth: (width: number) => void;
  setOpenTreadCount: (count: number) => void;
  setOpenTreadWidth: (width: number) => void;
  setOpenTreadDirection: (direction: 'left' | 'right') => void;
  setOpenTreadFullMitre: (fullMitre: boolean) => void;
  setOpenTreadBracket: (bracket: string) => void;
  setDoubleOpenCount: (count: number) => void;
  setDoubleOpenWidth: (width: number) => void;
  setDoubleOpenFullMitre: (fullMitre: boolean) => void;
  setDoubleOpenBracket: (bracket: string) => void;
}

const TreadConfiguration: React.FC<TreadConfigurationProps> = ({
  formData,
  errors,
  boxTreadCount,
  boxTreadWidth,
  openTreadCount,
  openTreadWidth,
  openTreadDirection,
  openTreadFullMitre,
  openTreadBracket,
  doubleOpenCount,
  doubleOpenWidth,
  doubleOpenFullMitre,
  doubleOpenBracket,
  hasLandingTread: _hasLandingTread,
  setBoxTreadCount,
  setBoxTreadWidth,
  setOpenTreadCount,
  setOpenTreadWidth,
  setOpenTreadDirection,
  setOpenTreadFullMitre,
  setOpenTreadBracket,
  setDoubleOpenCount,
  setDoubleOpenWidth,
  setDoubleOpenFullMitre,
  setDoubleOpenBracket
}) => {
  const totalTreads = boxTreadCount + openTreadCount + doubleOpenCount;

  return (
    <div>
      <h3 className="config-section-header">🪜 Tread Configuration</h3>
      <div className="tread-configuration-sections">
        {/* Box Treads Section */}
        <div className="tread-type-section">
          <h4>Box Treads</h4>
          <div className="tread-inputs two-column">
            <div className="form-group">
              <label>Number of Box Treads</label>
              <FractionalInput
                value={boxTreadCount}
                onCommit={(v) => {
                  const rounded = parseIntegerLike(v);
                  const clamped = Math.max(0, Math.min(rounded, formData.numRisers));
                  if (Number.isFinite(clamped)) setBoxTreadCount(clamped);
                }}
                placeholder="0"
              />
            </div>
            <div className="form-group">
              <label>Width (inches)</label>
              <FractionalInput
                value={boxTreadWidth}
                onCommit={(v) => { if (Number.isFinite(v)) setBoxTreadWidth(v); }}
                placeholder="e.g., 36, 36 1/2"
                disabled={boxTreadCount === 0}
              />
            </div>
          </div>
        </div>

        {/* Open Treads Section */}
        <div className="tread-type-section">
          <h4>Open Treads</h4>
          <div className="tread-inputs two-column">
            <div className="form-group">
              <label>Number of Open Treads</label>
              <FractionalInput
                value={openTreadCount}
                onCommit={(v) => {
                  const rounded = parseIntegerLike(v);
                  const clamped = Math.max(0, Math.min(rounded, formData.numRisers));
                  if (Number.isFinite(clamped)) setOpenTreadCount(clamped);
                }}
                placeholder="0"
              />
            </div>
            <div className="form-group">
              <label>Width (inches)</label>
              <FractionalInput
                value={openTreadWidth}
                onCommit={(v) => { if (Number.isFinite(v)) setOpenTreadWidth(v); }}
                placeholder="e.g., 36, 36 1/2"
                disabled={openTreadCount === 0}
              />
            </div>
          </div>
          
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>Direction</label>
            <select
              value={openTreadDirection}
              onChange={(e) => setOpenTreadDirection(e.target.value as 'left' | 'right')}
              disabled={openTreadCount === 0}
            >
              <option value="left">⬅ Open Left</option>
              <option value="right">➡ Open Right</option>
            </select>
          </div>
          
          {openTreadCount > 0 && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0f9ff', borderRadius: '0.5rem', border: '1px solid #bae6fd' }}>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={openTreadFullMitre}
                    onChange={(e) => setOpenTreadFullMitre(e.target.checked)}
                  />
                  Full Mitre (No Brackets)
                </label>
              </div>
              
              {!openTreadFullMitre && (
                <div className="form-group">
                  <label>Bracket Type</label>
                  <select
                    value={openTreadBracket}
                    onChange={(e) => setOpenTreadBracket(e.target.value)}
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

        {/* Double Open Treads Section */}
        <div className="tread-type-section">
          <h4>Double Open Treads</h4>
          <div className="tread-inputs two-column">
            <div className="form-group">
              <label>Number of Double Open Treads</label>
              <FractionalInput
                value={doubleOpenCount}
                onCommit={(v) => {
                  const rounded = parseIntegerLike(v);
                  const clamped = Math.max(0, Math.min(rounded, formData.numRisers));
                  if (Number.isFinite(clamped)) setDoubleOpenCount(clamped);
                }}
                placeholder="0"
              />
            </div>
            <div className="form-group">
              <label>Width (inches)</label>
              <FractionalInput
                value={doubleOpenWidth}
                onCommit={(v) => { if (Number.isFinite(v)) setDoubleOpenWidth(v); }}
                placeholder="e.g., 36, 36 1/2"
                disabled={doubleOpenCount === 0}
              />
            </div>
          </div>
          
          {doubleOpenCount > 0 && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0f9ff', borderRadius: '0.5rem', border: '1px solid #bae6fd' }}>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={doubleOpenFullMitre}
                    onChange={(e) => setDoubleOpenFullMitre(e.target.checked)}
                  />
                  Full Mitre (No Brackets)
                </label>
              </div>
              
              {!doubleOpenFullMitre && (
                <div className="form-group">
                  <label>Bracket Type</label>
                  <select
                    value={doubleOpenBracket}
                    onChange={(e) => setDoubleOpenBracket(e.target.value)}
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
        <p><strong>Total Treads:</strong> {totalTreads} / <strong>Required:</strong> {formData.numRisers - 1} or {formData.numRisers}</p>
        {totalTreads === formData.numRisers && (
          <p className="info-message success">✓ No landing tread - top gets full tread</p>
        )}
        {totalTreads === (formData.numRisers - 1) && (
          <p className="info-message success">✓ Includes landing tread</p>
        )}
        {totalTreads > formData.numRisers && (
          <p className="info-message error"><WarningIcon width={16} height={16} /> Too many treads specified</p>
        )}
      </div>
      {errors.treads && <div className="error-message">{errors.treads}</div>}
    </div>
  );
};

export default TreadConfiguration;
