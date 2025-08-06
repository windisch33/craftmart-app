import React, { useState, useEffect } from 'react';
import type { User, RegisterRequest } from '../../services/auth';
import './UserForm.css';

interface UserFormProps {
  user?: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: RegisterRequest) => Promise<void>;
}

const UserForm: React.FC<UserFormProps> = ({ 
  user, 
  isOpen,
  onClose, 
  onSave
}) => {
  const [formData, setFormData] = useState<RegisterRequest>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'employee'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (user) {
        setFormData({
          email: user.email || '',
          password: '', // Password not needed for edit
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          role: user.role || 'employee'
        });
      } else {
        setFormData({
          email: '',
          password: '',
          first_name: '',
          last_name: '',
          role: 'employee'
        });
      }
      setErrors({});
    }
  }, [isOpen, user]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Password required only for new users
    if (!user && !formData.password) {
      newErrors.password = 'Password is required';
    } else if (!user && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const submitData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role
      };

      await onSave(submitData);
      onClose();
    } catch (error: any) {
      setErrors({ submit: error.message || 'Failed to save user' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="user-form-overlay" onClick={handleBackdropClick}>
      <div className="user-form-modal">
        <div className="user-form-header">
          <h2>{user ? 'Edit User' : 'Create New User'}</h2>
          <button 
            className="user-form-close" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="user-form">
          {/* General Error */}
          {errors.submit && (
            <div style={{marginBottom: '16px', padding: '12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626'}}>
              ⚠️ {errors.submit}
            </div>
          )}
          
          <div className="user-form-row">
            <div className="user-form-field">
              <label htmlFor="first_name">First Name *</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className={errors.first_name ? 'error' : ''}
                disabled={isSubmitting}
                required
              />
              {errors.first_name && <span className="error-message">{errors.first_name}</span>}
            </div>

            <div className="user-form-field">
              <label htmlFor="last_name">Last Name *</label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className={errors.last_name ? 'error' : ''}
                disabled={isSubmitting}
                required
              />
              {errors.last_name && <span className="error-message">{errors.last_name}</span>}
            </div>
          </div>

          <div className="user-form-row">
            <div className="user-form-field">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? 'error' : ''}
                disabled={isSubmitting}
                required
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="user-form-field">
              <label htmlFor="role">Role *</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                disabled={isSubmitting}
                required
              >
                <option value="employee">Employee</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
          </div>

          {!user && (
            <div className="user-form-row">
              <div className="user-form-field">
                <label htmlFor="password">Password *</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={errors.password ? 'error' : ''}
                  disabled={isSubmitting}
                  required
                  minLength={8}
                  placeholder="Enter password (min 8 characters)"
                />
                {errors.password && <span className="error-message">{errors.password}</span>}
              </div>
            </div>
          )}

          <div className="user-form-actions">
            <button 
              type="button" 
              onClick={onClose}
              disabled={isSubmitting}
              className="cancel-button"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="submit-button"
            >
              {isSubmitting ? (
                user ? 'Updating...' : 'Creating...'
              ) : (
                user ? '💾 Update User' : '👤 Create User'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserForm;