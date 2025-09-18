import React from 'react';
import type { JobWithDetails } from '../../../services/jobService';
import { formatCurrency } from '../../../utils/jobCalculations';

type TotalsPanelProps = {
  job: JobWithDetails;
};

const TotalsPanel: React.FC<TotalsPanelProps> = ({ job }) => {
  const subtotal = job.subtotal || 0;
  const laborTotal = job.labor_total || 0;
  const taxAmount = job.tax_amount || 0;
  const totalAmount = job.total_amount || 0;
  const depositApplied = typeof job.deposit_total === 'number' ? job.deposit_total : 0;
  const balanceDue = typeof job.balance_due === 'number'
    ? job.balance_due
    : Math.max(totalAmount - depositApplied, 0);

  return (
    <div className="totals-section">
      <h4>Job Totals</h4>
      <div className="totals-breakdown">
        <div className="total-line">
          <span>Subtotal (Taxable):</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="total-line">
          <span>Labor & Non-Taxable:</span>
          <span>{formatCurrency(laborTotal)}</span>
        </div>
        <div className="total-line">
          <span>Tax ({((job.tax_rate || 0) * 100).toFixed(2)}%):</span>
          <span>{formatCurrency(taxAmount)}</span>
        </div>
        <div className="total-line grand-total">
          <span>Grand Total:</span>
          <span>{formatCurrency(totalAmount)}</span>
        </div>
        {depositApplied > 0 && (
          <div className="total-line payment-line">
            <span>Payments Applied:</span>
            <span>-{formatCurrency(depositApplied)}</span>
          </div>
        )}
        <div className="total-line balance-line">
          <span>Balance Due:</span>
          <span>{formatCurrency(balanceDue)}</span>
        </div>
      </div>
    </div>
  );
};

export default TotalsPanel;
