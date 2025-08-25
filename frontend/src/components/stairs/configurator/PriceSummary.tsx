import React from 'react';
import type { StairPriceResponse } from '../../../services/stairService';

interface PriceSummaryProps {
  calculating: boolean;
  priceResponse: StairPriceResponse | null;
}

const PriceSummary: React.FC<PriceSummaryProps> = ({
  calculating,
  priceResponse
}) => {
  return (
    <div className="step-content">
      <h3>💰 Price Summary</h3>
      
      {calculating ? (
        <div className="loading">Calculating pricing...</div>
      ) : priceResponse ? (
        <div className="price-breakdown">
          <div className="config-summary">
            <h4>Configuration Summary</h4>
            <div className="summary-grid">
              <div className="summary-item">
                <span>Floor to Floor:</span>
                <span>{priceResponse.configuration.floorToFloor}"</span>
              </div>
              <div className="summary-item">
                <span>Number of Risers:</span>
                <span>{priceResponse.configuration.numRisers}</span>
              </div>
              <div className="summary-item">
                <span>Riser Height:</span>
                <span>{priceResponse.configuration.riserHeight}"</span>
              </div>
              <div className="summary-item">
                <span>Full Mitre:</span>
                <span>{priceResponse.configuration.fullMitre ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>

          <div className="price-details">
            {priceResponse.breakdown.treads.length > 0 && (
              <div className="breakdown-section">
                <h5>Treads</h5>
                {priceResponse.breakdown.treads.map((tread, index) => (
                  <div key={index} className="breakdown-item">
                    <span>Riser {tread.riserNumber} - {tread.type} ({tread.stairWidth}" wide)</span>
                    <span>${tread.totalPrice.toFixed(2)}</span>
                  </div>
                    ))}
              </div>
            )}

            {priceResponse.breakdown.landingTread && (
              <div className="breakdown-section">
                <h5>Landing Tread</h5>
                <div className="breakdown-item">
                  <span>Landing Tread - Box (3.5" width)</span>
                  <span>${priceResponse.breakdown.landingTread.totalPrice.toFixed(2)}</span>
                </div>
              </div>
            )}

            {priceResponse.breakdown.risers.length > 0 && (
              <div className="breakdown-section">
                <h5>Risers</h5>
                {priceResponse.breakdown.risers.map((riser, index) => (
                  <div key={index} className="breakdown-item">
                    <span>{riser.quantity} risers @ ${riser.unitPrice.toFixed(2)}</span>
                    <span>${riser.totalPrice.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}

            {priceResponse.breakdown.stringers.length > 0 && (
              <div className="breakdown-section">
                <h5>Stringers</h5>
                {priceResponse.breakdown.stringers.map((stringer, index) => (
                  <div key={index} className="breakdown-item">
                    <span>{stringer.type} - {stringer.quantity} × {stringer.risers} risers</span>
                    <span>${stringer.totalPrice.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}

            {priceResponse.breakdown.specialParts.length > 0 && (
              <div className="breakdown-section">
                <h5>Special Parts</h5>
                {priceResponse.breakdown.specialParts.map((part, index) => (
                  <div key={index} className="breakdown-item">
                    <span>{part.description} × {part.quantity}</span>
                    <span>${part.totalPrice.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="price-totals">
              <div className="total-line">
                <span>Subtotal:</span>
                <span>${priceResponse.subtotal}</span>
              </div>
              <div className="total-line">
                <span>Labor:</span>
                <span>${priceResponse.laborTotal}</span>
              </div>
              <div className="total-line">
                <span>Tax:</span>
                <span>${priceResponse.taxAmount}</span>
              </div>
              <div className="total-line total">
                <span><strong>Total:</strong></span>
                <span><strong>${priceResponse.total}</strong></span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="error-message">Unable to calculate pricing. Please check your configuration.</div>
      )}
    </div>
  );
};

export default PriceSummary;