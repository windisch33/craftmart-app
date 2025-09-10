import React from 'react';
import type { JobWithDetails } from '../../../services/jobService';
import { CalendarIcon } from '../../common/icons';

type StatusColor = { bg: string; color: string };

type SummaryProps = {
  job: JobWithDetails;
  getJobNumber: (job: JobWithDetails) => string;
  getStatusColor: (status: string) => StatusColor;
  projectName?: string;
};

const Summary: React.FC<SummaryProps> = ({ job, getJobNumber, getStatusColor, projectName }) => (
  <div className="job-summary-section">
    <div className="summary-header">
      <div className="job-title-section">
        <h3>{job.title}</h3>
        {projectName && (
          <p className="customer-name">Job: {projectName}</p>
        )}
        <p className="customer-name">{job.customer_name}</p>
        <div className="job-meta">
          <span className="created-date">
            <CalendarIcon width={16} height={16} /> Created {new Date(job.created_at).toLocaleDateString()}
          </span>
          <div
            className="job-number-badge"
            style={{
              backgroundColor: getStatusColor(job.status).bg,
              color: getStatusColor(job.status).color,
            }}
          >
            {getJobNumber(job)}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default Summary;
