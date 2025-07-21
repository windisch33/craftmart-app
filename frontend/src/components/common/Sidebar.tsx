import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar: React.FC = () => {
  const location = useLocation();

  const menuItems = [
    { 
      name: 'Dashboard', 
      path: '/', 
      icon: '🏠',
      ariaLabel: 'Navigate to Dashboard'
    },
    { 
      name: 'Customers', 
      path: '/customers', 
      icon: '👥',
      ariaLabel: 'Navigate to Customers page'
    },
    { 
      name: 'Jobs', 
      path: '/jobs', 
      icon: '📋',
      ariaLabel: 'Navigate to Jobs page'
    },
    { 
      name: 'Shops', 
      path: '/shops', 
      icon: '🏭',
      ariaLabel: 'Navigate to Shops page'
    },
    { 
      name: 'Reports', 
      path: '/reports', 
      icon: '📊',
      ariaLabel: 'Navigate to Reports page'
    },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h3 className="sidebar-title">Navigation</h3>
      </div>
      <nav className="sidebar-nav" role="navigation" aria-label="Main navigation">
        <ul className="nav-list">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  aria-label={item.ariaLabel}
                  className={`nav-link ${isActive ? 'nav-link--active' : 'nav-link--inactive'}`}
                >
                  <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="sidebar-footer">
        <p className="version-text">CraftMart v1.0</p>
      </div>
    </aside>
  );
};

export default Sidebar;