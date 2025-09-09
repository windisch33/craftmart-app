import React from 'react';
import type { JobWithDetails } from '../../../services/jobService';
import { formatCurrency } from '../../../utils/jobCalculations';

type TotalsPanelProps = {
  job: JobWithDetails;
};

const TotalsPanel: React.FC<TotalsPanelProps> = ({ job }) => (
  <div className="totals-section">
    <h4>Job Totals</h4>
    <div className="totals-breakdown">
      <div className="total-line">
        <span>Subtotal (Taxable):</span>
        <span>{formatCurrency(job.subtotal || 0)}</span>
      </div>
      <div className="total-line">
        <span>Labor & Non-Taxable:</span>
        <span>{formatCurrency(job.labor_total || 0)}</span>
      </div>
      <div className="total-line">
        <span>Tax ({((job.tax_rate || 0) * 100).toFixed(2)}%):</span>
        <span>{formatCurrency(job.tax_amount || 0)}</span>
      </div>
      <div className="total-line grand-total">
        <span>Grand Total:</span>
        <span>{formatCurrency(job.total_amount || 0)}</span>
      </div>
    </div>
  </div>
);

export default TotalsPanel;

