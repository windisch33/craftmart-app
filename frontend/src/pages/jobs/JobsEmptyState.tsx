import React from 'react';
import { ClipboardIcon } from '../../components/common/icons';

type JobsEmptyStateProps = {
  isSearching: boolean;
  onCreateJob: () => void;
};

const JobsEmptyState: React.FC<JobsEmptyStateProps> = ({ isSearching, onCreateJob }) => {
  return (
    <div className="empty-jobs">
      <div className="empty-icon"><ClipboardIcon /></div>
      <h2 className="empty-title">
        {isSearching ? 'No jobs found' : 'No recent jobs'}
      </h2>
      <p className="empty-desc">
        {isSearching 
          ? 'Try adjusting your search terms or filters.'
          : 'Start by creating a new job or search for existing ones.'}
      </p>
      {!isSearching && (
        <button className="btn btn-primary" onClick={onCreateJob}>
          <span className="nav-icon"><ClipboardIcon /></span>
          Create Your First Job
        </button>
      )}
    </div>
  );
};

export default JobsEmptyState;

