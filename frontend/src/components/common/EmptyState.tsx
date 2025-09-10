import React from 'react';

type Action = {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
};

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: Action;
};

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => {
  return (
    <div
      className="card"
      style={{
        textAlign: 'center',
        padding: '40px',
      }}
    >
      {icon && (
        <div style={{ fontSize: 24, opacity: 0.6, marginBottom: 10 }}>{icon}</div>
      )}
      <h2 style={{ margin: 0, fontSize: 20 }}>{title}</h2>
      {description && (
        <p style={{ marginTop: 8, color: '#6b7280' }}>{description}</p>
      )}
      {action && (
        <button
          className={action.variant === 'secondary' ? 'btn btn-secondary' : 'btn btn-primary'}
          style={{ marginTop: 16 }}
          onClick={action.onClick}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;

