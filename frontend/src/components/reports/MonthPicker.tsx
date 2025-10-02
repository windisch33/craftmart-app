import React from 'react';

type Props = {
  month: string;
  onChange: (month: string) => void;
};

const MonthPicker: React.FC<Props> = ({ month, onChange }) => {
  return (
    <div>
      <label style={{display:'block', fontSize:'14px', fontWeight:500, color:'#374151', marginBottom:'8px'}}>Month</label>
      <input
        type="month"
        value={month}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width:'100%', padding:'12px 16px', border:'2px solid #e5e7eb', borderRadius:'12px', fontSize:'16px', outline:'none'
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
        onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
      />
    </div>
  );
};

export default MonthPicker;

