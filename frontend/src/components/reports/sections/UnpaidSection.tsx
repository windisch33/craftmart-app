import React from 'react';
import type { UnpaidInvoiceRow } from '../../../services/reportsService';
import { sumUnpaidRows } from '../utils';

type Props = {
  rows: UnpaidInvoiceRow[];
  onDownloadCsv: () => Promise<void> | void;
  onDownloadPdf: () => Promise<void> | void;
};

const UnpaidSection: React.FC<Props> = ({ rows, onDownloadCsv, onDownloadPdf }) => {
  const u = sumUnpaidRows(rows as any);
  const cardStyle: React.CSSProperties = { backgroundColor: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 20px 25px -5px rgba(0, 0, 0, 0.04)', border: '1px solid #f3f4f6', transition: 'all 0.3s ease' };
  return (
    <div style={{...cardStyle, marginBottom: '32px'}}>
      <h3 style={{fontSize: '20px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px'}}>Unpaid Invoices</h3>
      <div className="export-actions" style={{marginBottom:'12px'}}>
        <button className="export-btn" onClick={() => onDownloadCsv()}>Download CSV</button>
        <button className="export-btn" onClick={() => onDownloadPdf()}>Download PDF</button>
      </div>
      <div className="summary-grid">
        <div className="summary-card"><div className="summary-label">Amount</div><div className="summary-value">${u.amount.toFixed(2)}</div></div>
        <div className="summary-card"><div className="summary-label">Paid</div><div className="summary-value">${u.paid.toFixed(2)}</div></div>
        <div className="summary-card"><div className="summary-label">Balance</div><div className="summary-value">${u.balance.toFixed(2)}</div></div>
      </div>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%', borderCollapse:'collapse'}}>
          <thead>
            <tr>
              {['Invoice #','Order #','PO #','Customer','Invoice Date','Due Date','Amount','Paid','Balance'].map(h => (
                <th key={h} style={{textAlign:'left', padding:'8px', borderBottom:'1px solid #e5e7eb', background:'#f9fafb'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r:any, i:number) => (
              <tr key={i}>
                <td style={{padding:'8px', borderBottom:'1px solid #f3f4f6'}}>{r.invoice_number}</td>
                <td style={{padding:'8px', borderBottom:'1px solid #f3f4f6'}}>{r.order_number}</td>
                <td style={{padding:'8px', borderBottom:'1px solid #f3f4f6'}}>{r.po_number || ''}</td>
                <td style={{padding:'8px', borderBottom:'1px solid #f3f4f6'}}>{r.customer_name || ''}</td>
                <td style={{padding:'8px', borderBottom:'1px solid #f3f4f6'}}>{r.invoice_date}</td>
                <td style={{padding:'8px', borderBottom:'1px solid #f3f4f6'}}>{r.due_date}</td>
                <td style={{padding:'8px', borderBottom:'1px solid #f3f4f6'}}>{Number(r.amount).toFixed(2)}</td>
                <td style={{padding:'8px', borderBottom:'1px solid #f3f4f6'}}>{Number(r.paid).toFixed(2)}</td>
                <td style={{padding:'8px', borderBottom:'1px solid #f3f4f6'}}>{Number(r.balance).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td style={{padding:'8px', borderTop:'2px solid #e5e7eb', fontWeight:700}} colSpan={6}>Totals</td>
              <td style={{padding:'8px', borderTop:'2px solid #e5e7eb'}}>${u.amount.toFixed(2)}</td>
              <td style={{padding:'8px', borderTop:'2px solid #e5e7eb'}}>${u.paid.toFixed(2)}</td>
              <td style={{padding:'8px', borderTop:'2px solid #e5e7eb'}}>${u.balance.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default UnpaidSection;

