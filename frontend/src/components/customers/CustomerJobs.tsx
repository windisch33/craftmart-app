import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jobService from '../../services/jobService';
import type { Job } from '../../services/jobService';
import type { Customer } from '../../services/customerService';
import './CustomerJobs.css';
import { AlertTriangleIcon } from '../common/icons';

interface CustomerJobsProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
}

const CustomerJobs: React.FC<CustomerJobsProps> = ({ customer, isOpen, onClose }) => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && customer) {
      loadCustomerJobs();
    }
  }, [isOpen, customer]);

  const loadCustomerJobs = async () => {
    if (!customer) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const customerJobs = await jobService.getJobsByCustomerId(customer.id);
      setJobs(customerJobs);
    } catch (err: any) {
      setError(err.message || 'Failed to load customer jobs');
      console.error('Error loading customer jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJobClick = (job: Job) => {
    // Navigate to jobs page with the selected job
    navigate('/jobs', { state: { selectedJobId: job.id } });
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !customer) return null;

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div className="customer-jobs-modal">
        <div className="modal-header">
          <div className="modal-title-section">
            <h2 className="modal-title">Jobs for {customer.name}</h2>
            <p className="modal-subtitle">
              {customer.city && customer.state ? `${customer.city}, ${customer.state}` : 'No location'}
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-content">
          {loading && (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading jobs...</p>
            </div>
          )}

          {error && (
            <div className="error-message">
              <span style={{display: 'inline-flex', marginRight: 8}}><AlertTriangleIcon /></span>
              {error}
            </div>
          )}

          {!loading && !error && jobs.length === 0 && (
            <div className="empty-jobs">
              <p className="empty-message">No jobs found for this customer</p>
              <p className="empty-hint">Create a new job to get started</p>
            </div>
          )}

          {!loading && !error && jobs.length > 0 && (
            <div className="jobs-list">
              {jobs.map(job => (
                <div 
                  key={job.id} 
                  className="job-item"
                  onClick={() => handleJobClick(job)}
                >
                  <div className="job-header">
                    <div className="job-info">
                      <span className="job-number">#{job.job_number || job.id}</span>
                      <h3 className="job-title">{job.title || 'Untitled Job'}</h3>
                    </div>
                    <span 
                      className={`job-status status-${job.status}`}
                      style={jobService.getStatusColor(job.status)}
                    >
                      {jobService.formatJobStatus(job.status)}
                    </span>
                  </div>
                  
                  <div className="job-details">
                    <div className="job-detail-item">
                      <span className="detail-label">Created:</span>
                      <span className="detail-value">
                        {new Date(job.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {job.delivery_date && (
                      <div className="job-detail-item">
                        <span className="detail-label">Delivery:</span>
                        <span className="detail-value">
                          {new Date(job.delivery_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    <div className="job-detail-item">
                      <span className="detail-label">Total:</span>
                      <span className="detail-value job-amount">
                        {jobService.formatCurrency(job.total_amount || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerJobs;
