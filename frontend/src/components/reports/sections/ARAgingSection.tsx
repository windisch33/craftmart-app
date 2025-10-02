import React from 'react';
import type { AgingRow } from '../../../services/reportsService';
import { sumAgingRows } from '../utils';

type Props = {
  rows: AgingRow[];
  onDownloadCsv: () => Promise<void> | void;
  onDownloadPdf: () => Promise<void> | void;
};

const ARAgingSection: React.FC<Props> = ({ rows, onDownloadCsv, onDownloadPdf }) => {
  const a = sumAgingRows(rows as any);
  const cardStyle: React.CSSProperties = { backgroundColor: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 20px 25px -5px rgba(0, 0, 0, 0.04)', border: '1px solid #f3f4f6', transition: 'all 0.3s ease' };
  return (
    <div style={{...cardStyle, marginBottom: '32px'}}>
      <h3 style={{fontSize: '20px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px'}}>AR Aging</h3>
      <div className="export-actions" style={{marginBottom:'12px'}}>
        <button className="export-btn" onClick={() => onDownloadCsv()}>Download CSV</button>
        <button className="export-btn" onClick={() => onDownloadPdf()}>Download PDF</button>
      </div>
      <div className="summary-grid">
        <div className="summary-card"><div className="summary-label">Current</div><div className="summary-value">${a.current.toFixed(2)}</div></div>
        <div className="summary-card"><div className="summary-label">1–30</div><div className="summary-value">${a.d1_30.toFixed(2)}</div></div>
        <div className="summary-card"><div className="summary-label">31–60</div><div className="summary-value">${a.d31_60.toFixed(2)}</div></div>
        <div className="summary-card"><div className="summary-label">61–90</div><div className="summary-value">${a.d61_90.toFixed(2)}</div></div>
        <div className="summary-card"><div className="summary-label">&gt;90</div><div className="summary-value">${a.d90_plus.toFixed(2)}</div></div>
        <div className="summary-card"><div className="summary-label">Invoices</div><div className="summary-value">{a.invoices}</div></div>
        <div className="summary-card"><div className="summary-label">Total</div><div className="summary-value">${a.total.toFixed(2)}</div></div>
      </div>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%', borderCollapse:'collapse'}}>
          <thead>
            <tr>
              {['Customer','Current','1–30','31–60','61–90','>90','Invoices','Total'].map(h => (
                <th key={h} style={{textAlign:'left', padding:'8px', borderBottom:'1px solid #e5e7eb', background:'#f9fafb'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r:any, i:number) => (
              <tr key={i}>
                <td style={{padding:'8px', borderBottom:'1px solid #f3f4f6'}}>{r.customer_name || r.customer_id || '—'}</td>
                <td style={{padding:'8px', borderBottom:'1px solid #f3f4f6'}}>{Number(r.current).toFixed(2)}</td>
                <td style={{padding:'8px', borderBottom:'1px solid #f3f4f6'}}>{Number(r.d1_30).toFixed(2)}</td>
                <td style={{padding:'8px', borderBottom:'1px solid #f3f4f6'}}>{Number(r.d31_60).toFixed(2)}</td>
                <td style={{padding:'8px', borderBottom:'1px solid #f3f4f6'}}>{Number(r.d61_90).toFixed(2)}</td>
                <td style={{padding:'8px', borderBottom:'1px solid #f3f4f6'}}>{Number(r.d90_plus).toFixed(2)}</td>
                <td style={{padding:'8px', borderBottom:'1px solid #f3f4f6'}}>{r.invoices}</td>
                <td style={{padding:'8px', borderBottom:'1px solid #f3f4f6'}}>{Number(r.total).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td style={{padding:'8px', borderTop:'2px solid #e5e7eb', fontWeight:700}}>Totals</td>
              <td style={{padding:'8px', borderTop:'2px solid #e5e7eb'}}>${a.current.toFixed(2)}</td>
              <td style={{padding:'8px', borderTop:'2px solid #e5e7eb'}}>${a.d1_30.toFixed(2)}</td>
              <td style={{padding:'8px', borderTop:'2px solid #e5e7eb'}}>${a.d31_60.toFixed(2)}</td>
              <td style={{padding:'8px', borderTop:'2px solid #e5e7eb'}}>${a.d61_90.toFixed(2)}</td>
              <td style={{padding:'8px', borderTop:'2px solid #e5e7eb'}}>${a.d90_plus.toFixed(2)}</td>
              <td style={{padding:'8px', borderTop:'2px solid #e5e7eb'}}>{a.invoices}</td>
              <td style={{padding:'8px', borderTop:'2px solid #e5e7eb'}}>${a.total.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default ARAgingSection;

