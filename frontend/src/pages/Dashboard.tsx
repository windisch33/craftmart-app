import React from 'react';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  return (
    <div className="dashboard-container">
      {/* Modern Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="gradient-title">Dashboard</h1>
          <p className="header-subtitle">Welcome back to CraftMart</p>
        </div>
        <div className="header-controls">
          <div className="status-indicator">
            <div className="status-dot"></div>
            System Online
          </div>
          <button className="quick-add-btn">
            Quick Add
          </button>
        </div>
      </div>

      {/* Placeholder – tiles removed for now */}
      <div className="card" style={{ padding: '48px', textAlign: 'center', border: '1px solid #f3f4f6' }}>
        <p style={{ color: '#6b7280', margin: 0 }}>No dashboard tiles yet. We’ll add widgets here later.</p>
      </div>
    </div>
  );
};

export default Dashboard;
