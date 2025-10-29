import React, { useState, useEffect } from 'react';
import { AlertTriangleIcon, SaveIcon, UsersIcon } from '../common/icons';
import type { Salesman, CreateSalesmanData } from '../../services/salesmanService';
import './SalesmanForm.css';
import { formatPhoneInput } from '../../utils/phoneFormat';

interface SalesmanFormProps {
  salesman?: Salesman | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (salesmanData: CreateSalesmanData) => Promise<void>;
}

const SalesmanForm: React.FC<SalesmanFormProps> = ({ 
  salesman, 
  isOpen,
  onClose, 
  onSave
}) => {
  const [formData, setFormData] = useState<CreateSalesmanData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    commission_rate: 0,
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (salesman) {
        setFormData({
          first_name: salesman.first_name,
          last_name: salesman.last_name,
          email: salesman.email || '',
          phone: salesman.phone || '',
          commission_rate: salesman.commission_rate,
          notes: salesman.notes || ''
        });
      } else {
        setFormData({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          commission_rate: 0,
          notes: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, salesman]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (formData.commission_rate !== undefined && (formData.commission_rate < 0 || formData.commission_rate > 100)) {
      newErrors.commission_rate = 'Commission rate must be between 0 and 100';
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
        email: formData.email?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
        commission_rate: formData.commission_rate || 0,
        notes: formData.notes?.trim() || undefined
      };

      await onSave(submitData);
      onClose();
    } catch (error: any) {
      setErrors({ submit: error.message || 'Failed to save salesman' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const nextVal = name === 'phone' ? formatPhoneInput(value) : (type === 'number' ? parseFloat(value) || 0 : value);

    setFormData(prev => ({
      ...prev,
      [name]: nextVal as any
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
    <div className="salesman-form-overlay" onClick={handleBackdropClick}>
      <div className="salesman-form-modal">
        <div className="salesman-form-header">
          <h2>{salesman ? 'Edit Salesman' : 'Create New Salesman'}</h2>
          <button 
            className="salesman-form-close" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="salesman-form">
          {/* General Error */}
          {errors.submit && (
            <div style={{marginBottom: '16px', padding: '12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626'}}>
              <span style={{display:'inline-flex', marginRight:8}}><AlertTriangleIcon /></span>{errors.submit}
            </div>
          )}
          
          <div className="salesman-form-row">
            <div className="salesman-form-field">
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

            <div className="salesman-form-field">
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

          <div className="salesman-form-row">
            <div className="salesman-form-field">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? 'error' : ''}
                disabled={isSubmitting}
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="salesman-form-field">
              <label htmlFor="phone">Phone</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div className="salesman-form-row">
            <div className="salesman-form-field">
              <label htmlFor="commission_rate">Commission Rate (%)</label>
              <input
                type="number"
                id="commission_rate"
                name="commission_rate"
                value={formData.commission_rate}
                onChange={handleChange}
                className={errors.commission_rate ? 'error' : ''}
                disabled={isSubmitting}
                min="0"
                max="100"
                step="0.01"
              />
              {errors.commission_rate && <span className="error-message">{errors.commission_rate}</span>}
            </div>
          </div>

          <div className="salesman-form-field">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              disabled={isSubmitting}
              rows={3}
              placeholder="Additional notes about this salesman..."
            />
          </div>

          <div className="salesman-form-actions">
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
                salesman ? 'Updating...' : 'Creating...'
              ) : (
                salesman ? (<span style={{display:'inline-flex',alignItems:'center',gap:8}}><SaveIcon /> Update Salesman</span>) : (<span style={{display:'inline-flex',alignItems:'center',gap:8}}><UsersIcon /> Create Salesman</span>)
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SalesmanForm;
