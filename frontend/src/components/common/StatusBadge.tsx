import React from 'react';

type Variant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const palette: Record<Variant, { bg: string; color: string; border: string }> = {
  success: { bg: '#dcfce7', color: '#166534', border: '#86efac' },
  warning: { bg: '#fef3c7', color: '#92400e', border: '#fbbf24' },
  danger:  { bg: '#fee2e2', color: '#991b1b', border: '#fecaca' },
  info:    { bg: '#e0f2fe', color: '#075985', border: '#bae6fd' },
  neutral: { bg: '#f3f4f6', color: '#374151', border: '#e5e7eb' }
};

export const StatusBadge: React.FC<{ text: string; variant?: Variant }> = ({ text, variant = 'neutral' }) => {
  const s = palette[variant];
  return (
    <span style={{
      padding: '4px 12px',
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 500,
      backgroundColor: s.bg,
      color: s.color,
      border: `1px solid ${s.border}`
    }}>
      {text}
    </span>
  );
};

export default StatusBadge;

