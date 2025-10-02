import React from 'react';
import type { SalesByMonthRow } from '../../../services/reportsService';
import { sumSalesRows } from '../utils';

type Props = {
  rows: SalesByMonthRow[];
  onDownloadCsv: () => Promise<void> | void;
  onDownloadPdf: () => Promise<void> | void;
  onOpenInvoicesForMonth: (month: string) => Promise<void> | void;
};

const SalesByMonthSection: React.FC<Props> = ({ rows, onDownloadCsv, onDownloadPdf, onOpenInvoicesForMonth }) => {
  const s = sumSalesRows(rows);
  const cardStyle: React.CSSProperties = { backgroundColor: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 20px 25px -5px rgba(0, 0, 0, 0.04)', border: '1px solid #f3f4f6', transition: 'all 0.3s ease' };
  return (
    <div style={{...cardStyle, marginBottom: '32px'}}>
      <h3 style={{fontSize: '20px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px'}}>Sales by Month</h3>
      <div className="export-actions" style={{marginBottom:'12px'}}>
        <button className="export-btn" onClick={() => onDownloadCsv()}>Download CSV</button>
        <button className="export-btn" onClick={() => onDownloadPdf()}>Download PDF</button>
      </div>
      <div className="summary-grid">
        <div className="summary-card"><div className="summary-label">Invoices</div><div className="summary-value">{s.invoices}</div></div>
        <div className="summary-card"><div className="summary-label">Subtotal</div><div className="summary-value">${s.subtotal.toFixed(2)}</div></div>
        <div className="summary-card"><div className="summary-label">Tax</div><div className="summary-value">${s.tax.toFixed(2)}</div></div>
        <div className="summary-card"><div className="summary-label">Total</div><div className="summary-value">${s.total.toFixed(2)}</div></div>
      </div>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%', borderCollapse:'collapse'}}>
          <thead>
            <tr>
              {['Month','Invoices','Subtotal','Tax','Total'].map(h => (
                <th key={h} style={{textAlign:'left', padding:'8px', borderBottom:'1px solid #e5e7eb', background:'#f9fafb'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{cursor:'pointer'}} onClick={() => onOpenInvoicesForMonth(r.month)}>
                <td style={{padding:'8px', borderBottom:'1px solid #f3f4f6'}}>{r.month}</td>
                <td style={{padding:'8px', borderBottom:'1px solid #f3f4f6'}}>{r.invoices}</td>
                <td style={{padding:'8px', borderBottom:'1px solid #f3f4f6'}}>{r.subtotal.toFixed(2)}</td>
                <td style={{padding:'8px', borderBottom:'1px solid #f3f4f6'}}>{r.tax.toFixed(2)}</td>
                <td style={{padding:'8px', borderBottom:'1px solid #f3f4f6'}}>{r.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td style={{padding:'8px', borderTop:'2px solid #e5e7eb', fontWeight:700}}>Totals</td>
              <td style={{padding:'8px', borderTop:'2px solid #e5e7eb'}}>{s.invoices}</td>
              <td style={{padding:'8px', borderTop:'2px solid #e5e7eb'}}>${s.subtotal.toFixed(2)}</td>
              <td style={{padding:'8px', borderTop:'2px solid #e5e7eb'}}>${s.tax.toFixed(2)}</td>
              <td style={{padding:'8px', borderTop:'2px solid #e5e7eb'}}>${s.total.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default SalesByMonthSection;

