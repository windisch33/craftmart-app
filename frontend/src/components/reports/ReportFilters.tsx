import React from 'react';
import MonthPicker from './MonthPicker';
import type { Salesman } from '../../services/salesmanService';
import type { Customer } from '../../services/customerService';

type Props = {
  reportType: string;
  setReportType: (v: string) => void;
  dateRange: { start: string; end: string };
  setDateRange: (v: { start: string; end: string }) => void;
  month: string;
  setMonth: (v: string) => void;
  salesmen: Salesman[];
  customers: Customer[];
  selectedSalesmanId: string;
  setSelectedSalesmanId: (v: string) => void;
  selectedCustomerId: string;
  setSelectedCustomerId: (v: string) => void;
  selectedState: string;
  setSelectedState: (v: string) => void;
  presets: any[];
  setPresets: (v: any[]) => void;
  presetName: string;
  setPresetName: (v: string) => void;
  onGenerate: () => void | Promise<void>;
  loading?: boolean;
};

const ReportFilters: React.FC<Props> = ({
  reportType, setReportType,
  dateRange, setDateRange,
  month, setMonth,
  salesmen, customers,
  selectedSalesmanId, setSelectedSalesmanId,
  selectedCustomerId, setSelectedCustomerId,
  selectedState, setSelectedState,
  presets, setPresets,
  presetName, setPresetName,
  onGenerate, loading
}) => {
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '12px', fontSize: '16px', transition: 'all 0.2s ease', outline: 'none'
  };
  const cardStyle: React.CSSProperties = {
    backgroundColor: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 20px 25px -5px rgba(0, 0, 0, 0.04)', border: '1px solid #f3f4f6', transition: 'all 0.3s ease'
  };

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="gradient-title">Reports</h1>
          <p className="page-subtitle">Generate sales and tax reports for accounting</p>
        </div>
      </div>

      {/* Presets */}
      <div style={{display:'flex', gap:'12px', marginTop:'16px', alignItems:'center'}}>
        <div>
          <label style={{display:'block',fontSize:'12px',color:'#6b7280'}}>Preset name</label>
          <input type="text" value={presetName} onChange={(e)=>setPresetName(e.target.value)} style={{padding:'8px 12px', border:'1px solid #e5e7eb', borderRadius:'8px'}}/>
        </div>
        <button className="export-btn" onClick={()=>{
          const p = { name:(presetName || `Preset ${new Date().toISOString().slice(0,16)}`), reportType, month, start:dateRange.start, end:dateRange.end };
          const list = [...presets.filter(x=>x.name!==p.name), p];
          setPresets(list); localStorage.setItem('reportPresets', JSON.stringify(list));
        }}>Save Preset</button>
        <div>
          <label style={{display:'block',fontSize:'12px',color:'#6b7280'}}>Load preset</label>
          <select value="" onChange={(e)=>{
            const p = presets.find(x=>x.name===e.target.value);
            if (!p) return;
            setReportType(p.reportType); setMonth(p.month||''); setDateRange({ start:p.start||'', end:p.end||'' });
          }} style={{padding:'10px 12px', border:'1px solid #e5e7eb', borderRadius:'8px'}}>
            <option value="" disabled>Select...</option>
            {presets.map(p=> <option key={p.name} value={p.name}>{p.name}</option>)}
          </select>
        </div>
      </div>

      {/* Report Generation Section */}
      <div style={{...cardStyle, marginBottom: '32px'}}>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px'}}>
          {/* Report Type Selection */}
          <div>
            <label style={{display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px'}}>
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              style={inputStyle}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
            >
              <option value="sales">Sales by Month</option>
              <option value="salesman">Sales by Salesman</option>
              <option value="customer">Sales by Customer</option>
              <option value="tax">Tax by State</option>
              <option value="unpaid">Unpaid Invoices</option>
              <option value="aging">AR Aging</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label style={{display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px'}}>
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              style={inputStyle}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
            />
          </div>

          <div>
            <label style={{display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px'}}>
              End Date
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              style={inputStyle}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
            />
          </div>
          <div>
            <MonthPicker month={month} onChange={setMonth} />
          </div>
          <div>
            <label style={{display:'block', fontSize:'14px', fontWeight:500, color:'#374151', marginBottom:'8px'}}>Salesman</label>
            <select value={selectedSalesmanId} onChange={(e)=> setSelectedSalesmanId(e.target.value)} style={inputStyle}
              onFocus={(e)=> e.currentTarget.style.borderColor='var(--color-primary)'} onBlur={(e)=> e.currentTarget.style.borderColor='#e5e7eb'}>
              <option value="">All</option>
              {salesmen.map(s => <option key={s.id} value={String(s.id)}>{s.first_name} {s.last_name}</option>)}
            </select>
          </div>
          <div>
            <label style={{display:'block', fontSize:'14px', fontWeight:500, color:'#374151', marginBottom:'8px'}}>Customer</label>
            <select value={selectedCustomerId} onChange={(e)=> setSelectedCustomerId(e.target.value)} style={inputStyle}
              onFocus={(e)=> e.currentTarget.style.borderColor='var(--color-primary)'} onBlur={(e)=> e.currentTarget.style.borderColor='#e5e7eb'}>
              <option value="">All</option>
              {customers.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{display:'block', fontSize:'14px', fontWeight:500, color:'#374151', marginBottom:'8px'}}>State</label>
            <input value={selectedState} onChange={(e)=> setSelectedState(e.target.value.toUpperCase())} placeholder="e.g., MD" style={inputStyle}
              onFocus={(e)=> e.currentTarget.style.borderColor='var(--color-primary)'} onBlur={(e)=> e.currentTarget.style.borderColor='#e5e7eb'} />
          </div>
        </div>

        <div style={{display: 'flex', gap: '12px', marginTop: '24px'}}>
          <button className="btn btn-primary" onClick={() => onGenerate()} disabled={!!loading}>
            {loading ? 'Generating…' : 'Generate Report'}
          </button>
          <button style={{
            padding: '12px 24px', border: '2px solid #e5e7eb', borderRadius: '12px', backgroundColor: 'white', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s ease'
          }} onClick={() => {
            setReportType('sales'); setDateRange({ start: '', end: '' }); setMonth(''); setSelectedSalesmanId(''); setSelectedCustomerId(''); setSelectedState('');
          }}>Reset Filters</button>
        </div>
      </div>
    </>
  );
};

export default ReportFilters;

