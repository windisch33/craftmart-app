import React from 'react';
import { WarningIcon } from '../../common/icons';

type ErrorStateProps = {
  message: string;
  onRetry: () => void;
};

const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => (
  <div className="error-state">
    <div className="error-icon"><WarningIcon width={20} height={20} /></div>
    <h3>Error Loading Job Item</h3>
    <p>{message}</p>
    <button onClick={onRetry} className="retry-btn">
      Try Again
    </button>
  </div>
);

export default ErrorState;
