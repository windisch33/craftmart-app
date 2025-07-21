import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useMobile } from '../../hooks/useMobile';
import './Header.css';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { toggleMobileMenu } = useMobile();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-content">
          <div className="header-left">
            <button 
              className="mobile-menu-btn"
              onClick={toggleMobileMenu}
              aria-label="Toggle navigation menu"
              type="button"
            >
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
            </button>
            <div className="header-brand">
              <img 
                src="/logo.png" 
                alt="CraftMart Logo" 
                className="header-logo"
              />
            </div>
          </div>
          <div className="header-user">
            <div className="user-info">
              <span className="user-name">
                {user?.first_name} {user?.last_name}
              </span>
              {user?.role === 'admin' && (
                <div className="admin-badge">
                  Administrator
                </div>
              )}
            </div>
            <button 
              onClick={handleLogout}
              className="logout-btn"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;