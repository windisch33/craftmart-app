import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useMobile } from '../../hooks/useMobile';
import { useAuth } from '../../hooks/useAuth';
import './Sidebar.css';
import { HomeIcon, UsersIcon, WrenchIcon, FactoryIcon, BarChartIcon, HandshakeIcon, ShieldIcon, FolderIcon } from './icons';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { isMobileMenuOpen, closeMobileMenu } = useMobile();
  const { user } = useAuth();

  const menuItems = [
    { 
      name: 'Dashboard', 
      path: '/', 
      icon: <HomeIcon />,
      ariaLabel: 'Navigate to Dashboard'
    },
    { 
      name: 'Customers', 
      path: '/customers', 
      icon: <UsersIcon />,
      ariaLabel: 'Navigate to Customers page'
    },
    { 
      name: 'Jobs', 
      path: '/jobs', 
      icon: <FolderIcon />,
      ariaLabel: 'Navigate to Jobs page'
    },
    { 
      name: 'Products', 
      path: '/products', 
      icon: <WrenchIcon />,
      ariaLabel: 'Navigate to Products page'
    },
    { 
      name: 'Shops', 
      path: '/shops', 
      icon: <FactoryIcon />,
      ariaLabel: 'Navigate to Shops page'
    },
    { 
      name: 'Reports', 
      path: '/reports', 
      icon: <BarChartIcon />,
      ariaLabel: 'Navigate to Reports page'
    },
    { 
      name: 'Salesmen', 
      path: '/salesmen', 
      icon: <HandshakeIcon />,
      ariaLabel: 'Navigate to Salesmen page'
    },
  ];

  // Add Users menu item for admin users
  if (user?.role === 'admin') {
    menuItems.push({
      name: 'Users',
      path: '/users',
      icon: <ShieldIcon />,
      ariaLabel: 'Navigate to Users management page'
    });
  }

  const handleLinkClick = () => {
    closeMobileMenu();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeMobileMenu();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div className="sidebar-backdrop" onClick={handleBackdropClick} />
      )}
      
      <aside className={`sidebar ${isMobileMenuOpen ? 'sidebar--mobile-open' : ''}`}>
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
                  onClick={handleLinkClick}
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
    </>
  );
};

export default Sidebar;
