import React from 'react';
import type { Job } from '../../services/jobService';
import { AlertTriangleIcon } from '../../components/common/icons';

type NextStageConfirmModalProps = {
  job: Job;
  onCancel: () => void;
  onConfirm: () => void;
};

const NextStageConfirmModal: React.FC<NextStageConfirmModalProps> = ({ job, onCancel, onConfirm }) => {
  const nextStatus = job.status === 'quote' ? 'order' : job.status === 'order' ? 'invoice' : 'completed';
  return (
    <div className="modal-overlay">
      <div className="modal confirmation-modal">
        <div className="confirmation-icon"><AlertTriangleIcon /></div>
        <h3>Confirm Status Change</h3>
        <p>
          Are you sure you want to advance "{job.title}" from{' '}
          <strong>{job.status}</strong> to{' '}
          <strong>{nextStatus}</strong>?
        </p>
        <div className="modal-actions">
          <button onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
          <button onClick={onConfirm} className="btn btn-primary">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default NextStageConfirmModal;

