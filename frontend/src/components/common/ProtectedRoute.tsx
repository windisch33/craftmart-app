import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  const loadingContainerStyle = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #eef2ff 100%)'
  };

  const spinnerStyle = {
    width: '128px',
    height: '128px',
    border: '2px solid transparent',
    borderTop: '2px solid var(--color-primary)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  };

  const accessDeniedContainerStyle = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #eef2ff 100%)'
  };

  const accessDeniedContentStyle = {
    textAlign: 'center' as const,
    padding: '48px',
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 4px 25px -5px rgba(0, 0, 0, 0.1)',
    border: '1px solid #f3f4f6'
  };

  const titleStyle = {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '16px'
  };

  const messageStyle = {
    color: '#6b7280',
    fontSize: '16px'
  };

  if (isLoading) {
    return (
      <div style={loadingContainerStyle}>
        <div style={spinnerStyle}></div>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && user?.role !== 'admin') {
    return (
      <div style={accessDeniedContainerStyle}>
        <div style={accessDeniedContentStyle}>
          <h1 style={titleStyle}>🚫 Access Denied</h1>
          <p style={messageStyle}>You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
