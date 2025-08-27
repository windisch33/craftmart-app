import React, { useState, useEffect } from 'react';
import { AlertTriangleIcon, SaveIcon, UsersIcon } from '../common/icons';
import type { Customer, CreateCustomerRequest } from '../../services/customerService';
import './CustomerForm.css';

interface CustomerFormProps {
  customer?: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (customerData: CreateCustomerRequest) => Promise<void>;
}

const CustomerForm: React.FC<CustomerFormProps> = ({
  customer,
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<CreateCustomerRequest>({
    name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    phone: '',
    mobile: '',
    fax: '',
    email: '',
    accounting_email: '',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens/closes or customer changes
  useEffect(() => {
    if (isOpen) {
      if (customer) {
        // Edit mode - populate form with customer data
        setFormData({
          name: customer.name || '',
          address: customer.address || '',
          city: customer.city || '',
          state: customer.state || '',
          zip_code: customer.zip_code || '',
          phone: customer.phone || '',
          mobile: customer.mobile || '',
          fax: customer.fax || '',
          email: customer.email || '',
          accounting_email: customer.accounting_email || '',
          notes: customer.notes || ''
        });
      } else {
        // Create mode - reset form
        setFormData({
          name: '',
          address: '',
          city: '',
          state: '',
          zip_code: '',
          phone: '',
          mobile: '',
          fax: '',
          email: '',
          accounting_email: '',
          notes: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, customer]);

  const handleInputChange = (field: keyof CreateCustomerRequest, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = 'Customer name is required';
    }

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Accounting email validation
    if (formData.accounting_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.accounting_email)) {
      newErrors.accounting_email = 'Please enter a valid email address';
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
      await onSave(formData);
      onClose();
    } catch (error: any) {
      // Handle submission error
      setErrors({ submit: error.message || 'Failed to save customer' });
    } finally {
      setIsSubmitting(false);
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
    <div className="customer-form-overlay" onClick={handleBackdropClick}>
      <div className="customer-form-modal">
        <div className="customer-form-header">
          <h2 className="customer-form-title">
            {customer ? 'Edit Customer' : 'Add New Customer'}
          </h2>
          <button 
            className="customer-form-close"
            onClick={onClose}
            disabled={isSubmitting}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="customer-form">
          {/* General Error */}
          {errors.submit && (
            <div className="form-error">
              <span style={{display:'inline-flex', marginRight:8}}><AlertTriangleIcon /></span>
              {errors.submit}
            </div>
          )}

          {/* Basic Information */}
          <div className="form-section">
            <h3 className="form-section-title">Basic Information</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="name">
                  Customer Name *
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`form-input ${errors.name ? 'form-input-error' : ''}`}
                  placeholder="Enter customer name"
                  disabled={isSubmitting}
                />
                {errors.name && <span className="form-field-error">{errors.name}</span>}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="form-section">
            <h3 className="form-section-title">Contact Information</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="email">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`form-input ${errors.email ? 'form-input-error' : ''}`}
                  placeholder="customer@example.com"
                  disabled={isSubmitting}
                />
                {errors.email && <span className="form-field-error">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="accounting_email">
                  Accounting Email
                </label>
                <input
                  id="accounting_email"
                  type="email"
                  value={formData.accounting_email}
                  onChange={(e) => handleInputChange('accounting_email', e.target.value)}
                  className={`form-input ${errors.accounting_email ? 'form-input-error' : ''}`}
                  placeholder="accounting@example.com"
                  disabled={isSubmitting}
                />
                {errors.accounting_email && <span className="form-field-error">{errors.accounting_email}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="phone">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="form-input"
                  placeholder="(555) 123-4567"
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="mobile">
                  Mobile Number
                </label>
                <input
                  id="mobile"
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => handleInputChange('mobile', e.target.value)}
                  className="form-input"
                  placeholder="(555) 123-4567"
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="fax">
                  Fax Number
                </label>
                <input
                  id="fax"
                  type="tel"
                  value={formData.fax}
                  onChange={(e) => handleInputChange('fax', e.target.value)}
                  className="form-input"
                  placeholder="(555) 123-4567"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="form-section">
            <h3 className="form-section-title">Address Information</h3>
            
            <div className="form-row">
              <div className="form-group form-group-full">
                <label className="form-label" htmlFor="address">
                  Street Address
                </label>
                <input
                  id="address"
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="form-input"
                  placeholder="123 Main Street"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="city">
                  City
                </label>
                <input
                  id="city"
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="form-input"
                  placeholder="Seattle"
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="state">
                  State
                </label>
                <input
                  id="state"
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className="form-input"
                  placeholder="WA"
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="zip_code">
                  ZIP Code
                </label>
                <input
                  id="zip_code"
                  type="text"
                  value={formData.zip_code}
                  onChange={(e) => handleInputChange('zip_code', e.target.value)}
                  className="form-input"
                  placeholder="98101"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="form-section">
            <h3 className="form-section-title">Additional Information</h3>
            
            <div className="form-row">
              <div className="form-group form-group-full">
                <label className="form-label" htmlFor="notes">
                  Notes
                </label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="form-textarea"
                  placeholder="Add any additional notes about this customer..."
                  rows={4}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="form-button form-button-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="form-button form-button-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="form-button-spinner" />
                  {customer ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                customer ? (
                  <span style={{display:'inline-flex', alignItems:'center', gap:8}}><SaveIcon /> Update Customer</span>
                ) : (
                  <span style={{display:'inline-flex', alignItems:'center', gap:8}}><UsersIcon /> Create Customer</span>
                )
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerForm;
