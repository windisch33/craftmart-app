import React from 'react';
import type { SalesGroupRow } from '../../../services/reportsService';
import { sumSalesRows } from '../utils';

type Props = {
  rows: SalesGroupRow[];
  onDownloadCsv: () => Promise<void> | void;
  onDownloadPdf: () => Promise<void> | void;
  onOpenInvoicesForSalesman: (row: SalesGroupRow) => Promise<void> | void;
};

const SalesBySalesmanSection: React.FC<Props> = ({ rows, onDownloadCsv, onDownloadPdf, onOpenInvoicesForSalesman }) => {
  const s = sumSalesRows(rows as any);
  const cardStyle: React.CSSProperties = { backgroundColor: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 20px 25px -5px rgba(0, 0, 0, 0.04)', border: '1px solid #f3f4f6', transition: 'all 0.3s ease' };
  return (
    <div style={{...cardStyle, marginBottom: '32px'}}>
      <h3 style={{fontSize: '20px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px'}}>Sales by Salesman</h3>
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
              {['Salesman','Invoices','Subtotal','Tax','Total','Avg Invoice','Last Invoice Date','Actions'].map(h => (
                <th key={h} style={{textAlign:'left', padding:'8px', borderBottom:'1px solid #e5e7eb', background:'#f9fafb'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{cursor:'pointer'}} onClick={() => onOpenInvoicesForSalesman(r)}>
                <td style={{padding:'8px', borderBottom:'1px solid #f3f4f6'}}>{r.key_name || r.key_id}</td>
                <td style={{padding:'8px', borderBottom:'1px solid #f3f4f6'}}>{r.invoices}</td>
                <td style={{padding:'8px', borderBottom:'1px solid #f3f4f6'}}>{r.subtotal.toFixed(2)}</td>
                <td style={{padding:'8px', borderBottom:'1px solid #f3f4f6'}}>{r.tax.toFixed(2)}</td>
                <td style={{padding:'8px', borderBottom:'1px solid #f3f4f6'}}>{r.total.toFixed(2)}</td>
                <td style={{padding:'8px', borderBottom:'1px solid #f3f4f6'}}>{r.avg_invoice.toFixed(2)}</td>
                <td style={{padding:'8px', borderBottom:'1px solid #f3f4f6'}}>{r.last_invoice_date || ''}</td>
                <td style={{padding:'8px', borderBottom:'1px solid #f3f4f6'}}>
                  <button className="export-btn" onClick={(e)=>{ e.stopPropagation(); onOpenInvoicesForSalesman(r); }}>View Invoices</button>
                </td>
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
              <td style={{padding:'8px', borderTop:'2px solid #e5e7eb'}}></td>
              <td style={{padding:'8px', borderTop:'2px solid #e5e7eb'}}></td>
              <td style={{padding:'8px', borderTop:'2px solid #e5e7eb'}}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default SalesBySalesmanSection;

