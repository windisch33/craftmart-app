import React from 'react';
import type { Job } from '../../services/jobService';
import { AlertTriangleIcon } from '../../components/common/icons';
import AccessibleModal from '../../components/common/AccessibleModal';

type NextStageConfirmModalProps = {
  job: Job;
  onCancel: () => void;
  onConfirm: () => void;
};

const NextStageConfirmModal: React.FC<NextStageConfirmModalProps> = ({ job, onCancel, onConfirm }) => {
  const nextStatus = job.status === 'quote' ? 'order' : job.status === 'order' ? 'invoice' : 'completed';
  const titleId = 'next-stage-confirm-title';
  return (
    <AccessibleModal isOpen={true} onClose={onCancel} labelledBy={titleId} overlayClassName="modal-overlay" contentClassName="modal confirmation-modal">
      <div className="confirmation-icon"><AlertTriangleIcon /></div>
      <h3 id={titleId}>Confirm Status Change</h3>
      <p>
        Are you sure you want to advance "{job.title}" from{' '}
        <strong>{job.status}</strong> to{' '}
        <strong>{nextStatus}</strong>?
      </p>
      <div className="modal-actions">
        <button onClick={onCancel} className="btn btn-secondary" aria-label="Cancel">
          Cancel
        </button>
        <button onClick={onConfirm} className="btn btn-primary" aria-label="Confirm">
          Confirm
        </button>
      </div>
    </AccessibleModal>
  );
};

export default NextStageConfirmModal;
