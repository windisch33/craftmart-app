import React, { useState, useEffect } from 'react';
import type { Project } from '../../services/projectService';
import type { Customer } from '../../services/customerService';
import AccessibleModal from '../common/AccessibleModal';

interface ProjectFormProps {
  project?: Project | null;
  customers: Customer[];
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { customer_id?: number; name: string }) => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({
  project,
  customers,
  isOpen,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    customer_id: '',
    name: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (project) {
      // Editing mode
      setFormData({
        customer_id: project.customer_id.toString(),
        name: project.name
      });
    } else {
      // Create mode
      setFormData({
        customer_id: '',
        name: ''
      });
    }
    setErrors({});
  }, [project, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!project && !formData.customer_id) {
      newErrors.customer_id = 'Customer is required';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Job name is required';
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
        name: formData.name.trim()
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

  const titleId = 'project-form-title';

  if (!isOpen) return null;

  return (
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
                <select
                  id="customer_id"
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                  className={`form-control ${errors.customer_id ? 'error' : ''}`}
                  disabled={loading}
                >
                  <option value="">Select a customer...</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                      {customer.city && customer.state && ` (${customer.city}, ${customer.state})`}
                    </option>
                  ))}
                </select>
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
  );
};

export default ProjectForm;
