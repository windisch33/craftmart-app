import React from 'react';
import { AlertTriangleIcon } from '../../components/common/icons';

type JobsErrorBannerProps = {
  message: string;
};

const JobsErrorBanner: React.FC<JobsErrorBannerProps> = ({ message }) => {
  return (
    <div className="card" style={{marginBottom: '24px', backgroundColor: '#fef2f2', border: '1px solid #fecaca'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: '#b91c1c'}}>
        <AlertTriangleIcon />
        {message}
      </div>
    </div>
  );
};

export default JobsErrorBanner;

