import React from 'react';
import type { JobWithDetails } from '../../../services/jobService';

type JobInfoGridProps = {
  job: JobWithDetails;
};

const JobInfoGrid: React.FC<JobInfoGridProps> = ({ job }) => (
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
);

export default JobInfoGrid;

