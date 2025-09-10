import React from 'react';
import { RefreshIcon, TrashIcon, ClipboardIcon } from '../../components/common/icons';

type JobsHeaderProps = {
  onRefresh: () => void;
  onClearPDFCache: () => void;
  onCreateJob: () => void;
};

const JobsHeader: React.FC<JobsHeaderProps> = ({ onRefresh, onClearPDFCache, onCreateJob }) => {
  return (
    <div className="page-header">
      <div className="page-title-section">
        <h1 className="gradient-title">Job Items</h1>
        <p className="page-subtitle">Search and manage job items</p>
      </div>
      <div style={{ display: 'flex', gap: '12px' }}>
        <button 
          className="btn btn-secondary"
          onClick={onRefresh}
          title="Refresh job items list"
        >
          <span><RefreshIcon width={16} height={16} /></span>
          Refresh
        </button>
        <button 
          className="btn btn-secondary"
          onClick={onClearPDFCache}
          title="Clear PDF cache"
        >
          <span><TrashIcon width={16} height={16} /></span>
          Clear Cache
        </button>
        <button 
          className="btn btn-primary"
          onClick={onCreateJob}
        >
          <span className="nav-icon"><ClipboardIcon /></span>
          Create Job Item
        </button>
      </div>
    </div>
  );
};

export default JobsHeader;
