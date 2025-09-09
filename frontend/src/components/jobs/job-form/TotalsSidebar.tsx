import React from 'react';
import type { Customer } from '../../../services/customerService';
import { formatCurrency } from '../../../utils/jobCalculations';

type JobTotals = {
  taxableAmount: number;
  laborTotal: number;
  taxAmount: number;
  grandTotal: number;
};

type TotalsSidebarProps = {
  jobTotals: JobTotals;
  taxRate: number;
  selectedCustomer?: Customer;
};

const TotalsSidebar: React.FC<TotalsSidebarProps> = ({ jobTotals, taxRate, selectedCustomer }) => (
  <div className="totals-sidebar">
    <h4>Job Totals</h4>
    <div className="totals-breakdown">
      <div className="total-line">
        <span>Taxable Items:</span>
        <span>{formatCurrency(jobTotals.taxableAmount)}</span>
      </div>
      <div className="total-line">
        <span>Labor & Non-Taxable:</span>
        <span>{formatCurrency(jobTotals.laborTotal)}</span>
      </div>
      <div className="total-line">
        <span>Tax ({(taxRate * 100).toFixed(2)}%):</span>
        <span>{formatCurrency(jobTotals.taxAmount)}</span>
      </div>
      <div className="total-line grand-total">
        <span>Grand Total:</span>
        <span>{formatCurrency(jobTotals.grandTotal)}</span>
      </div>
    </div>
    {selectedCustomer && (
      <div className="tax-info">
        <small>Tax rate for {selectedCustomer.state}: {(taxRate * 100).toFixed(2)}%</small>
      </div>
    )}
  </div>
);

export default TotalsSidebar;

