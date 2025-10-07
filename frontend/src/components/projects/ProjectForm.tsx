import React, { useState, useEffect } from 'react';
import type { Project as Job } from '../../services/projectService';
import type { Customer } from '../../services/customerService';
import customerService from '../../services/customerService';
import AccessibleModal from '../common/AccessibleModal';
import CustomerForm from '../customers/CustomerForm';

interface ProjectFormProps {
  project?: Job | null;
  customers: Customer[];
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { customer_id?: number; name: string; address?: string | null; city?: string | null; state?: string | null; zip_code?: string | null }) => void;
  onCustomerCreate?: (customerData: any) => Promise<Customer>;
}

const ProjectForm: React.FC<ProjectFormProps> = ({
  project,
  customers,
  isOpen,
  onClose,
  onSubmit,
  onCustomerCreate
}) => {
  const [formData, setFormData] = useState({
    customer_id: '',
    name: '',
    address: '',
    city: '',
    state: '',
    zip_code: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customerQuery, setCustomerQuery] = useState('');
  const [localCustomers, setLocalCustomers] = useState<Customer[]>(customers);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);

  useEffect(() => {
    if (project) {
      // Editing mode
      setFormData({
        customer_id: project.customer_id.toString(),
        name: project.name,
        address: (project as any).address || '',
        city: (project as any).city || '',
        state: (project as any).state || '',
        zip_code: (project as any).zip_code || ''
      });
    } else {
      // Create mode
      setFormData({
        customer_id: '',
        name: '',
        address: '',
        city: '',
        state: '',
        zip_code: ''
      });
    }
    setErrors({});
  }, [project, isOpen]);

  useEffect(() => { setLocalCustomers(customers); }, [customers]);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!customerQuery.trim()) return;
      try {
        setSearching(true);
        const results = await customerService.searchCustomers(customerQuery.trim());
        setLocalCustomers(results);
      } catch (_e) { /* ignore */ } finally { setSearching(false); }
    }, 250);
    return () => clearTimeout(t);
  }, [customerQuery]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!project && !formData.customer_id) {
      newErrors.customer_id = 'Customer is required';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Job name is required';
    }
    if (formData.state && formData.state.length > 0 && formData.state.length !== 2) {
      newErrors.state = 'Use 2-letter state code';
    }
    if (formData.zip_code && !/^\d{5}(-\d{4})?$/.test(formData.zip_code)) {
      newErrors.zip_code = 'Invalid ZIP format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      const submitData: any = {
        name: formData.name.trim(),
        address: formData.address?.trim() || null,
        city: formData.city?.trim() || null,
        state: formData.state?.trim().toUpperCase() || null,
        zip_code: formData.zip_code?.trim() || null
      };

      // Only include customer_id for new projects
      if (!project) {
        submitData.customer_id = parseInt(formData.customer_id);
      }

      await onSubmit(submitData);
    } catch (err) {
      console.error('Error submitting project form:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerCreate = async (customerData: any) => {
    if (!onCustomerCreate) {
      throw new Error('Customer creation is not available in this context');
    }

    try {
      const newCustomer = await onCustomerCreate(customerData);

      if (newCustomer?.id) {
        setFormData(prev => ({ ...prev, customer_id: newCustomer.id.toString() }));
      }

      setShowCustomerForm(false);
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  };

  const titleId = 'project-form-title';

  if (!isOpen) return null;

  return (
    <>
      <AccessibleModal isOpen={isOpen} onClose={onClose} labelledBy={titleId} overlayClassName="modal-overlay" contentClassName="modal-content">
          <div className="modal-header">
            <h2 className="modal-title" id={titleId}>
              {project ? 'Edit Job' : 'Create New Job'}
            </h2>
            <button className="modal-close" onClick={onClose} aria-label="Close dialog">
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {/* Customer Selection - only for new jobs */}
              {!project && (
                <div className="form-group">
                  <label htmlFor="customer_id" className="form-label">
                    Customer <span className="required">*</span>
                  </label>
                  <div className="select-with-add">
                    <input
                      type="text"
                      placeholder="Search customer..."
                      value={customerQuery}
                      onChange={(e)=> setCustomerQuery(e.target.value)}
                      className="form-control"
                      style={{marginBottom:'8px'}}
                      disabled={loading}
                    />
                    <select
                      id="customer_id"
                      value={formData.customer_id}
                      onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                      className={`form-control ${errors.customer_id ? 'error' : ''}`}
                      disabled={loading}
                    >
                      <option value="">Select a customer...</option>
                      {localCustomers.map(customer => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name}
                          {customer.city && customer.state && ` (${customer.city}, ${customer.state})`}
                        </option>
                      ))}
                    </select>
                    {searching && <small className="help-text">Searching…</small>}
                    <button
                      type="button"
                      className="add-button"
                      onClick={() => setShowCustomerForm(true)}
                      disabled={loading}
                    >
                      + New
                    </button>
                  </div>
                  {errors.customer_id && (
                    <span className="error-message">{errors.customer_id}</span>
                  )}
                </div>
              )}

              {/* Job Name */}
              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  Job Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`form-control ${errors.name ? 'error' : ''}`}
                  placeholder="Enter job name..."
                  disabled={loading}
                  autoFocus
                />
                {errors.name && (
                  <span className="error-message">{errors.name}</span>
                )}
              </div>

              {/* Job Address */}
              <div className="form-group">
                <label className="form-label">Job Address</label>
                {!project && !!formData.customer_id && (
                  <div style={{ marginBottom: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        const customer = localCustomers.find(c => c.id === Number(formData.customer_id));
                        if (customer) {
                          setFormData(prev => ({
                            ...prev,
                            address: customer.address || '',
                            city: customer.city || '',
                            state: (customer.state || '').toUpperCase(),
                            zip_code: customer.zip_code || ''
                          }));
                        }
                      }}
                      disabled={loading}
                    >
                      Use customer address
                    </button>
                  </div>
                )}
                <input
                  type="text"
                  placeholder="Street address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="form-control"
                  disabled={loading}
                />
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <input
                    type="text"
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="form-control"
                    disabled={loading}
                  />
                  <input
                    type="text"
                    placeholder="State (e.g., MD)"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                    className={`form-control ${errors.state ? 'error' : ''}`}
                    style={{ maxWidth: '120px' }}
                    disabled={loading}
                  />
                  <input
                    type="text"
                    placeholder="ZIP"
                    value={formData.zip_code}
                    onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                    className={`form-control ${errors.zip_code ? 'error' : ''}`}
                    style={{ maxWidth: '160px' }}
                    disabled={loading}
                  />
                </div>
                {errors.state && (<span className="error-message">{errors.state}</span>)}
                {errors.zip_code && (<span className="error-message">{errors.zip_code}</span>)}
              </div>

              {/* Customer Info Display - for editing mode */}
              {project && (
                <div className="form-group">
                  <label className="form-label">Customer</label>
                  <div className="readonly-field">
                    {project.customer_name}
                    {project.customer_city && project.customer_state && 
                      ` (${project.customer_city}, ${project.customer_state})`
                    }
                  </div>
                  <small className="help-text">
                    Customer cannot be changed after job creation
                  </small>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : (project ? 'Update Job' : 'Create Job')}
              </button>
            </div>
          </form>
      </AccessibleModal>

      {/* Customer Creation Modal */}
      <CustomerForm
        isOpen={showCustomerForm}
        onClose={() => setShowCustomerForm(false)}
        onSave={handleCustomerCreate}
      />
    </>
  );
};

export default ProjectForm;
