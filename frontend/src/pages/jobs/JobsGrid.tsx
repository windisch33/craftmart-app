import React from 'react';
import type { Job } from '../../services/jobService';
import { CalendarIcon, RefreshIcon, UsersIcon, TruckIcon, FileIcon, EyeIcon, ArrowRightIcon } from '../../components/common/icons';

type StatusColor = { bg: string; color: string };

type JobsGridProps = {
  jobs: Job[];
  onViewDetails: (jobId: number) => void;
  onViewPDF: (jobId: number, jobTitle: string) => void;
  onNextStage: (job: Job) => void;
  getStatusColor: (status: string) => StatusColor;
  getJobNumber: (job: Job) => string;
  formatDate: (dateString: string) => string;
  formatCurrency: (amount: number) => string;
};

const JobsGrid: React.FC<JobsGridProps> = ({
  jobs,
  onViewDetails,
  onViewPDF,
  onNextStage,
  getStatusColor,
  getJobNumber,
  formatDate,
  formatCurrency,
}) => {
  return (
    <div className="jobs-grid">
      {jobs.map(job => (
        <div key={job.id} className="job-card">
          <div className="job-header">
            <div className="job-info">
              <h3 className="job-title">{job.title}</h3>
              <p className="job-number">{getJobNumber(job)}</p>
              <p className="job-customer">{job.customer_name}</p>
            </div>
            <div className="job-status">
              <span 
                className="status-badge"
                style={{
                  backgroundColor: getStatusColor(job.status).bg,
                  color: getStatusColor(job.status).color
                }}
              >
                {job.status}
              </span>
            </div>
          </div>

          <div className="job-details">
            <div className="detail-row">
              <span className="detail-label" style={{display: 'inline-flex', alignItems: 'center', gap: '6px'}}><CalendarIcon /> Created:</span>
              <span className="detail-value">{formatDate(job.created_at)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label"><RefreshIcon width={14} height={14} /> Updated:</span>
              <span className="detail-value">{formatDate(job.updated_at)}</span>
            </div>
            {job.delivery_date && (
              <div className="detail-row">
                <span className="detail-label" style={{display: 'inline-flex', alignItems: 'center', gap: '6px'}}><TruckIcon /> Delivery:</span>
                <span className="detail-value">{formatDate(job.delivery_date)}</span>
              </div>
            )}
            {job.salesman_name && (
              <div className="detail-row">
                <span className="detail-label" style={{display: 'inline-flex', alignItems: 'center', gap: '6px'}}><UsersIcon /> Salesman:</span>
                <span className="detail-value">{job.salesman_name}</span>
              </div>
            )}
          </div>

          <div className="job-amount">
            <div className="amount-label">Total Amount</div>
            <div className="amount-value">{formatCurrency(job.total_amount)}</div>
          </div>

          <div className="job-actions">
            <button 
              className="action-btn action-btn-primary" 
              onClick={() => onViewDetails(job.id)}
              title="View Details"
            >
              <EyeIcon width={16} height={16} /> View
            </button>
            <button 
              className="action-btn action-btn-info" 
              onClick={() => onViewPDF(job.id, job.title)}
              title="View PDF"
            >
              <span className="nav-icon"><FileIcon /></span> PDF
            </button>
            {job.status !== 'invoice' && (
              <button 
                className="action-btn action-btn-warning" 
                onClick={() => onNextStage(job)}
                title="Next Stage"
              >
                <ArrowRightIcon width={16} height={16} /> Next
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default JobsGrid;

