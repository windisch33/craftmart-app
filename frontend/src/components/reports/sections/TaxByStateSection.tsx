import React from 'react';
import type { TaxByStateRow } from '../../../services/reportsService';
import { sumTaxRows } from '../utils';

type Props = {
  rows: TaxByStateRow[];
  onDownloadCsv: () => Promise<void> | void;
  onDownloadPdf: () => Promise<void> | void;
};

const TaxByStateSection: React.FC<Props> = ({ rows, onDownloadCsv, onDownloadPdf }) => {
  const t = sumTaxRows(rows as any);
  const cardStyle: React.CSSProperties = { backgroundColor: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 20px 25px -5px rgba(0, 0, 0, 0.04)', border: '1px solid #f3f4f6', transition: 'all 0.3s ease' };
  return (
    <div style={{...cardStyle, marginBottom: '32px'}}>
      <h3 style={{fontSize: '20px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px'}}>Tax by State</h3>
      <div className="export-actions" style={{marginBottom:'12px'}}>
        <button className="export-btn" onClick={() => onDownloadCsv()}>Download CSV</button>
        <button className="export-btn" onClick={() => onDownloadPdf()}>Download PDF</button>
      </div>
      <div className="summary-grid">
        <div className="summary-card"><div className="summary-label">Taxable</div><div className="summary-value">${t.taxable.toFixed(2)}</div></div>
        <div className="summary-card"><div className="summary-label">Non‑tax Labor</div><div className="summary-value">${t.non_taxable_labor.toFixed(2)}</div></div>
        <div className="summary-card"><div className="summary-label">Tax</div><div className="summary-value">${t.tax.toFixed(2)}</div></div>
        <div className="summary-card"><div className="summary-label">Eff. Rate</div><div className="summary-value">{t.effective_rate.toFixed(4)}</div></div>
      </div>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%', borderCollapse:'collapse'}}>
          <thead>
            <tr>
              {['State','Invoices','Taxable','Non‑tax Labor','Tax','Effective Rate'].map(h => (
                <th key={h} style={{textAlign:'left', padding:'8px', borderBottom:'1px solid #e5e7eb', background:'#f9fafb'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r:any, i:number) => (
              <tr key={i}>
                <td style={{padding:'8px', borderBottom:'1px solid #f3f4f6'}}>{r.state || '—'}</td>
                <td style={{padding:'8px', borderBottom:'1px solid #f3f4f6'}}>{r.invoices}</td>
                <td style={{padding:'8px', borderBottom:'1px solid #f3f4f6'}}>{Number(r.taxable).toFixed(2)}</td>
                <td style={{padding:'8px', borderBottom:'1px solid #f3f4f6'}}>{r.non_taxable_labor != null ? Number(r.non_taxable_labor).toFixed(2) : ''}</td>
                <td style={{padding:'8px', borderBottom:'1px solid #f3f4f6'}}>{Number(r.tax).toFixed(2)}</td>
                <td style={{padding:'8px', borderBottom:'1px solid #f3f4f6'}}>{Number(r.effective_rate).toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td style={{padding:'8px', borderTop:'2px solid #e5e7eb', fontWeight:700}}>Totals</td>
              <td style={{padding:'8px', borderTop:'2px solid #e5e7eb'}}></td>
              <td style={{padding:'8px', borderTop:'2px solid #e5e7eb'}}>${t.taxable.toFixed(2)}</td>
              <td style={{padding:'8px', borderTop:'2px solid #e5e7eb'}}>${t.non_taxable_labor.toFixed(2)}</td>
              <td style={{padding:'8px', borderTop:'2px solid #e5e7eb'}}>${t.tax.toFixed(2)}</td>
              <td style={{padding:'8px', borderTop:'2px solid #e5e7eb'}}>{t.effective_rate.toFixed(4)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default TaxByStateSection;

