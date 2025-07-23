import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import jobService from '../../services/jobService';
import type { JobWithDetails } from '../../services/jobService';
import { formatCurrency } from '../../utils/jobCalculations';
import './JobDetail.css';

interface JobDetailErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

interface JobDetailErrorBoundaryProps {
  children: ReactNode;
}

class JobDetailErrorBoundary extends Component<JobDetailErrorBoundaryProps, JobDetailErrorBoundaryState> {
  constructor(props: JobDetailErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): JobDetailErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('JobDetail Error Boundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="job-detail error">
          <h3>Something went wrong loading the job details</h3>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            <summary>Error Details (click to expand)</summary>
            <strong>Error:</strong> {this.state.error && this.state.error.toString()}
            <br />
            <strong>Stack:</strong> {this.state.error && this.state.error.stack}
            <br />
            <strong>Component Stack:</strong> {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
          <button onClick={() => this.setState({ hasError: false })}>
            Try Again
          </button>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

interface JobDetailProps {
  jobId: number;
  isOpen: boolean;
  onClose: () => void;
}

const JobDetail: React.FC<JobDetailProps> = ({ jobId, isOpen, onClose }) => {
  const [job, setJob] = useState<JobWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (isOpen && jobId) {
      loadJobDetails();
    }
  }, [isOpen, jobId]);

  const loadJobDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const jobData = await jobService.getJobWithDetails(jobId);
      setJob(jobData);
    } catch (err) {
      console.error('Error loading job details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const getJobNumber = (job: JobWithDetails) => {
    const statusWord = job.status.charAt(0).toUpperCase() + job.status.slice(1);
    return `${statusWord} #${job.id.toString().padStart(4, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'quote':
        return { bg: '#fef3c7', color: '#92400e', border: '#fbbf24' };
      case 'order':
        return { bg: '#dbeafe', color: '#1e40af', border: '#3b82f6' };
      case 'invoice':
        return { bg: '#d1fae5', color: '#065f46', border: '#10b981' };
      default:
        return { bg: '#f3f4f6', color: '#374151', border: '#d1d5db' };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="job-detail-overlay">
      <div className="job-detail-modal">
        {/* Header */}
        <div className="job-detail-header">
          <div className="header-content">
            <h2>Job Details</h2>
            <div className="header-actions">
              <button 
                className="edit-toggle-btn"
                onClick={() => setIsEditing(!isEditing)}
                disabled={loading}
              >
                {isEditing ? '👁️ View' : '✏️ Edit'}
              </button>
              <button 
                className="close-btn"
                onClick={onClose}
                disabled={loading}
              >
                ×
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="job-detail-content">
          {loading && (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading job details...</p>
            </div>
          )}

          {error && (
            <div className="error-state">
              <div className="error-icon">⚠️</div>
              <h3>Error Loading Job</h3>
              <p>{error}</p>
              <button onClick={loadJobDetails} className="retry-btn">
                Try Again
              </button>
            </div>
          )}

          {job && !loading && !error && (
            <>
              {/* Job Summary */}
              <div className="job-summary-section">
                <div className="summary-header">
                  <div className="job-title-section">
                    <h3>{job.title}</h3>
                    <p className="customer-name">{job.customer_name}</p>
                    <div className="job-meta">
                      <span className="created-date">
                        📅 Created {new Date(job.created_at).toLocaleDateString()}
                      </span>
                      <div 
                        className="job-number-badge"
                        style={{
                          backgroundColor: getStatusColor(job.status).bg,
                          color: getStatusColor(job.status).color,
                          border: `1px solid ${getStatusColor(job.status).border}`
                        }}
                      >
                        {getJobNumber(job)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Job Information */}
                <div className="job-info-grid">
                  <div className="info-section">
                    <h4>Basic Information</h4>
                    <div className="info-items">
                      {job.description && (
                        <div className="info-item">
                          <label>Description:</label>
                          <span>{job.description}</span>
                        </div>
                      )}
                      {job.delivery_date && (
                        <div className="info-item">
                          <label>Delivery Date:</label>
                          <span>{new Date(job.delivery_date).toLocaleDateString()}</span>
                        </div>
                      )}
                      {job.salesman_first_name && job.salesman_last_name && (
                        <div className="info-item">
                          <label>Salesman:</label>
                          <span>{job.salesman_first_name} {job.salesman_last_name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="info-section">
                    <h4>Job Details</h4>
                    <div className="info-items">
                      {job.order_designation && (
                        <div className="info-item">
                          <label>Order Type:</label>
                          <span>{job.order_designation}</span>
                        </div>
                      )}
                      {job.model_name && (
                        <div className="info-item">
                          <label>Model:</label>
                          <span>{job.model_name}</span>
                        </div>
                      )}
                      {job.installer && (
                        <div className="info-item">
                          <label>Installer:</label>
                          <span>{job.installer}</span>
                        </div>
                      )}
                      {job.terms && (
                        <div className="info-item">
                          <label>Terms:</label>
                          <span>{job.terms}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sections & Items */}
              <div className="sections-section">
                <h4>Sections & Items</h4>
                {job.sections && job.sections.length > 0 ? (
                  <div className="sections-list">
                    {job.sections.map((section) => (
                      <div key={section.id} className="section-card">
                        <div className="section-header">
                          <h5>{section.name}</h5>
                          <span className="item-count">
                            {section.items?.length || 0} items
                          </span>
                        </div>
                        
                        {section.description && (
                          <p className="section-description">{section.description}</p>
                        )}

                        {section.items && section.items.length > 0 ? (
                          <div className="items-table">
                            <div className="table-header">
                              <div className="col-qty">Qty</div>
                              <div className="col-description">Description</div>
                              <div className="col-unit-price">Unit Price</div>
                              <div className="col-total">Total</div>
                              <div className="col-tax">Tax</div>
                            </div>
                            {section.items.map((item) => (
                              <div key={item.id} className="table-row">
                                <div className="col-qty">{item.quantity}</div>
                                <div className="col-description">
                                  {item.part_number && (
                                    <div className="part-number">{item.part_number}</div>
                                  )}
                                  <div className="description">{item.description}</div>
                                </div>
                                <div className="col-unit-price">
                                  {formatCurrency(item.unit_price)}
                                </div>
                                <div className="col-total">
                                  {formatCurrency(item.line_total)}
                                </div>
                                <div className={`col-tax ${item.is_taxable ? 'taxable' : 'non-taxable'}`}>
                                  {item.is_taxable ? '✓' : '✗'}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="no-items">
                            <span>No items in this section</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-sections">
                    <span>No sections found for this job</span>
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="totals-section">
                <h4>Job Totals</h4>
                <div className="totals-breakdown">
                  <div className="total-line">
                    <span>Subtotal (Taxable):</span>
                    <span>{formatCurrency(job.subtotal || 0)}</span>
                  </div>
                  <div className="total-line">
                    <span>Labor & Non-Taxable:</span>
                    <span>{formatCurrency(job.labor_total || 0)}</span>
                  </div>
                  <div className="total-line">
                    <span>Tax ({((job.tax_rate || 0) * 100).toFixed(2)}%):</span>
                    <span>{formatCurrency(job.tax_amount || 0)}</span>
                  </div>
                  <div className="total-line grand-total">
                    <span>Grand Total:</span>
                    <span>{formatCurrency(job.total_amount || 0)}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {job && !loading && !error && (
          <div className="job-detail-footer">
            <button className="footer-btn secondary" onClick={onClose}>
              Close
            </button>
            {isEditing && (
              <>
                <button className="footer-btn secondary">
                  Cancel Changes
                </button>
                <button className="footer-btn primary">
                  Save Changes
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Wrapper component with error boundary
const JobDetailWithErrorBoundary: React.FC<JobDetailProps> = (props) => {
  return (
    <JobDetailErrorBoundary>
      <JobDetail {...props} />
    </JobDetailErrorBoundary>
  );
};

export default JobDetailWithErrorBoundary;