import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Login.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  
  const from = (location.state as any)?.from?.pathname || '/';

  useEffect(() => {
    if (isAuthenticated) {
      return;
    }
  }, [isAuthenticated]);


  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login({ email, password });
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="card-container">
        <div className="card">
          <div className="center-content">
            <img 
              src="/logo.png" 
              alt="CraftMart Logo" 
              className="logo"
            />
            <div className="demo-badge">
              <p className="demo-title">
                Demo Credentials:
              </p>
              <p className="demo-text">
                admin@craftmart.com / password123
              </p>
            </div>
          </div>
          
          {error && (
            <div className="error">
              <span>⚠️</span>
              {error}
            </div>
          )}
          
          <form className="form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="email" className="label">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                disabled={isSubmitting}
                className="input"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div className="input-group">
              <label htmlFor="password" className="label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                disabled={isSubmitting}
                className="input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="button"
            >
              {isSubmitting ? (
                <span className="button-content">
                  <div className="button-spinner"></div>
                  Signing in...
                </span>
              ) : (
                <span className="button-content">
                  <span className="button-icon">🔑</span>
                  Sign In
                </span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;