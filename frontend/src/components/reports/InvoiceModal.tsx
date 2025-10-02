import React from 'react';
import { downloadInvoicesCsv, downloadInvoicesPdf, type InvoiceRow } from '../../services/reportsService';

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  params: any;
  rows: InvoiceRow[] | null;
};

const InvoiceModal: React.FC<Props> = ({ open, onClose, title, params, rows }) => {
  if (!open) return null;
  return (
    <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', display:'flex', justifyContent:'center', alignItems:'flex-start', padding:'40px 20px', zIndex:1000}} onClick={onClose}>
      <div style={{background:'#fff', borderRadius:'12px', width:'min(1100px, 95%)', maxHeight:'85vh', overflow:'auto', padding:'24px'}} onClick={(e)=>e.stopPropagation()}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px'}}>
          <h3 style={{margin:0}}>{title || 'Invoices'}</h3>
          <div style={{display:'flex', gap:'8px'}}>
            <button className="export-btn" onClick={async ()=>{ await downloadInvoicesCsv(params || {}); }}>Download CSV</button>
            <button className="export-btn" onClick={onClose}>Close</button>
          </div>
        </div>
        <div>
          <div style={{display:'flex', justifyContent:'flex-end', gap:'8px', marginBottom:'8px'}}>
            <button className="export-btn" onClick={async ()=>{ await downloadInvoicesPdf(params || {}); }}>Download PDF</button>
          </div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%', borderCollapse:'collapse'}}>
              <thead>
                <tr>{['Invoice #','PO #','Customer','Invoice Date','Due Date','Subtotal','Labor','Tax','Total','Paid','Balance'].map(h=> <th key={h} style={{textAlign:'left', padding:'8px', borderBottom:'1px solid #e5e7eb', background:'#f9fafb'}}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {rows?.map((r)=> (
                  <tr key={r.invoice_id}>
                    <td style={{padding:'8px', borderBottom:'1px solid #f3f4f6'}}>{r.invoice_number}</td>
                    <td style={{padding:'8px', borderBottom:'1px solid #f3f4f6'}}>{r.po_number || ''}</td>
                    <td style={{padding:'8px', borderBottom:'1px solid #f3f4f6'}}>{r.customer_name || ''}</td>
                    <td style={{padding:'8px', borderBottom:'1px solid #f3f4f6'}}>{r.invoice_date}</td>
                    <td style={{padding:'8px', borderBottom:'1px solid #f3f4f6'}}>{r.due_date}</td>
                    <td style={{padding:'8px', borderBottom:'1px solid #f3f4f6'}}>{r.subtotal.toFixed(2)}</td>
                    <td style={{padding:'8px', borderBottom:'1px solid #f3f4f6'}}>{r.labor_total.toFixed(2)}</td>
                    <td style={{padding:'8px', borderBottom:'1px solid #f3f4f6'}}>{r.tax.toFixed(2)}</td>
                    <td style={{padding:'8px', borderBottom:'1px solid #f3f4f6'}}>{r.total.toFixed(2)}</td>
                    <td style={{padding:'8px', borderBottom:'1px solid #f3f4f6'}}>{r.paid_amount.toFixed(2)}</td>
                    <td style={{padding:'8px', borderBottom:'1px solid #f3f4f6'}}>{r.open_balance.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;

