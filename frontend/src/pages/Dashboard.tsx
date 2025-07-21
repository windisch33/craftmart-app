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

      {/* Stats Cards Grid */}
      <div className="stats-grid">
        {/* Total Customers */}
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <div className="stat-header">
                <div className="stat-dot stat-dot--blue"></div>
                <p className="stat-label">Total Customers</p>
              </div>
              <p className="stat-value">24</p>
              <div className="stat-change">
                <span className="stat-change--positive">↗ +12%</span>
                <span className="stat-change--neutral">vs last month</span>
              </div>
            </div>
            <div className="stat-icon stat-icon--blue">
              👥
            </div>
          </div>
        </div>

        {/* Active Jobs */}
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <div className="stat-header">
                <div className="stat-dot stat-dot--green"></div>
                <p className="stat-label">Active Jobs</p>
              </div>
              <p className="stat-value">8</p>
              <div className="stat-change">
                <span className="stat-change--positive">↗ +3</span>
                <span className="stat-change--neutral">new this week</span>
              </div>
            </div>
            <div className="stat-icon stat-icon--green">
              📋
            </div>
          </div>
        </div>

        {/* Pending Quotes */}
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <div className="stat-header">
                <div className="stat-dot stat-dot--amber"></div>
                <p className="stat-label">Pending Quotes</p>
              </div>
              <p className="stat-value">5</p>
              <div className="stat-change">
                <span className="stat-change--warning">2 urgent</span>
                <span className="stat-change--neutral">require attention</span>
              </div>
            </div>
            <div className="stat-icon stat-icon--amber">
              ⏰
            </div>
          </div>
        </div>

        {/* Revenue */}
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <div className="stat-header">
                <div className="stat-dot stat-dot--purple"></div>
                <p className="stat-label">Monthly Revenue</p>
              </div>
              <p className="stat-value">$48.2k</p>
              <div className="stat-change">
                <span className="stat-change--positive">↗ +18%</span>
                <span className="stat-change--neutral">vs last month</span>
              </div>
            </div>
            <div className="stat-icon stat-icon--purple">
              💰
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="bottom-grid">
        <div className="activity-card">
          <div className="activity-header">
            <div className="activity-title-group">
              <div className="activity-icon">
                📊
              </div>
              <div>
                <h3 className="activity-title">Recent Activity</h3>
                <p className="activity-subtitle">Latest updates and changes</p>
              </div>
            </div>
            <button className="view-all-btn">
              View all
            </button>
          </div>
          
          <div className="activity-list">
            <div className="activity-item activity-item--blue">
              <div className="activity-item-icon activity-item-icon--blue">
                👤
              </div>
              <div className="activity-item-content">
                <div className="activity-item-header">
                  <p className="activity-item-title">New customer added</p>
                  <span className="activity-item-time">2 hours ago</span>
                </div>
                <p className="activity-item-desc">Johnson Construction added to customer database</p>
              </div>
            </div>
            
            <div className="activity-item activity-item--green">
              <div className="activity-item-icon activity-item-icon--green">
                📝
              </div>
              <div className="activity-item-content">
                <div className="activity-item-header">
                  <p className="activity-item-title">Quote converted to order</p>
                  <span className="activity-item-time">5 hours ago</span>
                </div>
                <p className="activity-item-desc">Victorian Staircase project - $12,500</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions-card">
          <div className="quick-actions-header">
            <div className="quick-actions-icon">
              ⚡
            </div>
            <div>
              <h3 className="quick-actions-title">Quick Actions</h3>
              <p className="quick-actions-subtitle">Common tasks</p>
            </div>
          </div>
          
          <div className="quick-actions-list">
            <button className="quick-action-btn">
              <div className="quick-action-icon quick-action-icon--blue">
                👤
              </div>
              <div className="quick-action-text">
                <div className="quick-action-title">Add Customer</div>
                <div className="quick-action-subtitle">Create new customer</div>
              </div>
            </button>
            
            <button className="quick-action-btn">
              <div className="quick-action-icon quick-action-icon--green">
                📋
              </div>
              <div className="quick-action-text">
                <div className="quick-action-title">New Quote</div>
                <div className="quick-action-subtitle">Generate estimate</div>
              </div>
            </button>
            
            <button className="quick-action-btn">
              <div className="quick-action-icon quick-action-icon--purple">
                📊
              </div>
              <div className="quick-action-text">
                <div className="quick-action-title">View Reports</div>
                <div className="quick-action-subtitle">Analytics & insights</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;