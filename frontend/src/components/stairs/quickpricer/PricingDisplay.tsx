import React from 'react';
import type { StairPriceResponse } from '../../../services/stairService';
import type { PricingResult, ProductType } from './types';

interface PricingDisplayProps {
  productType: ProductType;
  pricingResult: PricingResult | null;
  stairPricingDetails: StairPriceResponse | null;
  hideLaborAndTax?: boolean;
}

const PricingDisplay: React.FC<PricingDisplayProps> = ({
  productType,
  pricingResult,
  stairPricingDetails,
  hideLaborAndTax = false
}) => {
  if (!pricingResult) {
    return (
      <div className="price-display">
        <h3>Pricing Calculation</h3>
        <div className="pricing-placeholder">
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
            Configure your {productType === 'stair' ? 'stair' : 'product'} and click "Calculate Price" to see pricing breakdown
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pricing-display">
      <h3>Pricing Calculation</h3>
      <div className="pricing-breakdown">
        <div className="price-row">
          <span>Material Subtotal:</span>
          <span>${(pricingResult?.subtotal || 0).toFixed(2)}</span>
        </div>
        {!hideLaborAndTax && (pricingResult?.laborCost || 0) > 0 && (
          <div className="price-row">
            <span>Labor Cost:</span>
            <span>${(pricingResult?.laborCost || 0).toFixed(2)}</span>
          </div>
        )}
        <div className="price-row total">
          <span>Total:</span>
          <span>${(
            hideLaborAndTax
              ? (pricingResult?.subtotal || 0)
              : (pricingResult?.total || 0)
          ).toFixed(2)}</span>
        </div>
      </div>

      {pricingResult?.details && productType !== 'stair' && (
        <div className="calculation-details">
          <h4>Calculation Details</h4>
          <small>
            Product: {pricingResult.details.product}<br/>
            Material: {pricingResult.details.material}<br/>
            {productType !== 'rail_parts' && pricingResult.details.length && `Length: ${pricingResult.details.length}" (${(pricingResult.details.lengthIn6InchIncrements || 0).toFixed(2)} × 6")`}<br/>
            Quantity: {pricingResult.details.quantity}<br/>
            {productType !== 'rail_parts' && pricingResult.details.costPer6Inches && `Cost per 6": $${pricingResult.details.costPer6Inches}`}<br/>
            {productType === 'rail_parts' && pricingResult.details.basePrice && `Base Price: $${pricingResult.details.basePrice}`}<br/>
            Material Multiplier: {pricingResult.details.materialMultiplier || 1}x
          </small>
        </div>
      )}

      {stairPricingDetails && productType === 'stair' && (
        <div className="stair-calculation-details">
          <h4>Pricing Breakdown</h4>
          {(() => {
            try {
              return (
                <>
                  {/* Treads */}
          {stairPricingDetails.breakdown.treads && stairPricingDetails.breakdown.treads.length > 0 && (
            <div className="breakdown-section">
              <h5>Treads</h5>
              {(() => {
                // Group treads by type and width with detailed pricing
                const groupedTreads = stairPricingDetails.breakdown.treads.reduce((acc, tread) => {
                  const key = `${tread.type}-${tread.stairWidth}`;
                  if (!acc[key]) {
                    acc[key] = {
                      type: tread.type,
                      stairWidth: tread.stairWidth,
                      count: 0,
                      totalPrice: 0,
                      basePrice: 0,
                      oversizedCharge: 0,
                      mitreCharge: 0,
                      treads: []
                    };
                  }
                  acc[key].count += 1;
                  acc[key].totalPrice += (tread.totalPrice || 0);
                  acc[key].basePrice += (tread.basePrice || 0);
                  acc[key].oversizedCharge += (tread.oversizedCharge || 0);
                  acc[key].mitreCharge += (tread.mitreCharge || 0);
                  acc[key].treads.push(tread);
                  return acc;
                }, {} as any);
                
                return Object.values(groupedTreads).map((group: any, index) => (
                  <div key={index} className="component-detail">
                    <div>
                      <span>{group.type} tread ({group.stairWidth}" x {group.count}): ${group.totalPrice.toFixed(2)}</span>
                    </div>
                    <div style={{ fontSize: '0.8em', color: '#6b7280', marginLeft: '1rem', marginTop: '0.25rem' }}>
                      Base: ${group.basePrice.toFixed(2)} + Oversized: ${group.oversizedCharge.toFixed(2)} + Mitre: ${group.mitreCharge.toFixed(2)} = ${group.totalPrice.toFixed(2)}
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}
          
          {/* Landing Tread */}
          {stairPricingDetails.breakdown.landingTread && (
            <div className="breakdown-section">
              <h5>Landing Tread</h5>
              <div className="component-detail">
                <div>
                  <span>#{stairPricingDetails.breakdown.landingTread.riserNumber} {stairPricingDetails.breakdown.landingTread.type} ({stairPricingDetails.breakdown.landingTread.stairWidth}"): ${(stairPricingDetails.breakdown.landingTread.totalPrice || 0).toFixed(2)}</span>
                </div>
                <div style={{ fontSize: '0.8em', color: '#6b7280', marginLeft: '1rem', marginTop: '0.25rem' }}>
                  Base: ${(stairPricingDetails.breakdown.landingTread.basePrice || 0).toFixed(2)} + Oversized: ${(stairPricingDetails.breakdown.landingTread.oversizedCharge || 0).toFixed(2)} + Mitre: ${(stairPricingDetails.breakdown.landingTread.mitreCharge || 0).toFixed(2)} = ${(stairPricingDetails.breakdown.landingTread.totalPrice || 0).toFixed(2)}
                </div>
              </div>
            </div>
          )}

          {/* Risers */}
          {stairPricingDetails.breakdown.risers && stairPricingDetails.breakdown.risers.length > 0 && (
            <div className="breakdown-section">
              <h5>Risers</h5>
              {stairPricingDetails.breakdown.risers.map((riser, index) => (
                <div key={index} className="component-detail">
                  <div>
                    <span>{riser.type} riser ({riser.width}" x {riser.quantity}): ${(riser.totalPrice || 0).toFixed(2)}</span>
                  </div>
                  <div style={{ fontSize: '0.8em', color: '#6b7280', marginLeft: '1rem', marginTop: '0.25rem' }}>
                    (Base: ${(riser.basePrice || 0).toFixed(2)} + Length: ${(riser.lengthCharge || 0).toFixed(2)} + Width: ${(riser.widthCharge || 0).toFixed(2)}) × Material: {riser.materialMultiplier || 1}x = ${(riser.unitPrice || 0).toFixed(2)} × {riser.quantity} = ${(riser.totalPrice || 0).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Stringers */}
          {stairPricingDetails.breakdown.stringers && stairPricingDetails.breakdown.stringers.length > 0 && (
            <div className="breakdown-section">
              <h5>Stringers</h5>
              {stairPricingDetails.breakdown.stringers.map((stringer, index) => (
                <div key={index} className="component-detail">
                  <div>
                    <span>{stringer.type} ({stringer.width}" x {stringer.thickness}" x {stringer.quantity}): ${(stringer.totalPrice || 0).toFixed(2)}</span>
                  </div>
                  <div style={{ fontSize: '0.8em', color: '#6b7280', marginLeft: '1rem', marginTop: '0.25rem' }}>
                    (Base: ${(stringer.basePrice || 0).toFixed(2)} + Width: ${(stringer.widthCharge || 0).toFixed(2)} + Thickness: ${(stringer.thicknessCharge || 0).toFixed(2)}) × Material: {stringer.materialMultiplier || 1}x = ${(stringer.unitPricePerRiser || 0).toFixed(2)}/riser × {stringer.risers} risers × {stringer.quantity} = ${(stringer.totalPrice || 0).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Special Parts */}
          {stairPricingDetails.breakdown.specialParts && stairPricingDetails.breakdown.specialParts.length > 0 && (
            <div className="breakdown-section">
              <h5>Special Parts</h5>
              {stairPricingDetails.breakdown.specialParts.map((part, index) => (
                <div key={index} className="component-detail">
                  <div>
                    <span>{part.description} x{part.quantity}: ${(part.totalPrice || 0).toFixed(2)}</span>
                  </div>
                  {!hideLaborAndTax && (
                    <div style={{ fontSize: '0.8em', color: '#6b7280', marginLeft: '1rem', marginTop: '0.25rem' }}>
                      Unit: ${(part.unitPrice || 0).toFixed(2)} + Labor: ${(part.laborCost || 0).toFixed(2)} = ${((part.unitPrice || 0) + (part.laborCost || 0)).toFixed(2)} × {part.quantity} = ${(part.totalPrice || 0).toFixed(2)}
                    </div>
                  )}
                  {hideLaborAndTax && (
                    <div style={{ fontSize: '0.8em', color: '#6b7280', marginLeft: '1rem', marginTop: '0.25rem' }}>
                      Unit: ${(part.unitPrice || 0).toFixed(2)} × {part.quantity} = ${(part.totalPrice || 0).toFixed(2)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Labor */}
          {!hideLaborAndTax && stairPricingDetails.breakdown.labor && stairPricingDetails.breakdown.labor.length > 0 && (
            <div className="breakdown-section">
              <h5>Labor</h5>
              {stairPricingDetails.breakdown.labor.map((labor, index) => (
                <div key={index} className="component-detail">
                  <span>{labor.description}: ${labor.totalPrice.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Summary */}
          <div className="breakdown-summary">
            <div className="summary-line">
              <span>Subtotal: ${stairPricingDetails.subtotal}</span>
            </div>
            {!hideLaborAndTax && (
              <div className="summary-line">
                <span>Labor: ${stairPricingDetails.laborTotal}</span>
              </div>
            )}
            {!hideLaborAndTax && (
              <div className="summary-line">
                <span>Tax: ${stairPricingDetails.taxAmount}</span>
              </div>
            )}
            <div className="summary-line total">
              <span><strong>Total: ${hideLaborAndTax ? stairPricingDetails.subtotal : stairPricingDetails.total}</strong></span>
            </div>
          </div>
                </>
              );
            } catch (error) {
              console.error('Error rendering stair pricing breakdown:', error);
              return (
                <div style={{ color: '#dc2626', padding: '1rem' }}>
                  Error displaying pricing breakdown. Please try again.
                </div>
              );
            }
          })()}
        </div>
      )}
    </div>
  );
};

export default PricingDisplay;
