import React, { useState, useEffect } from 'react';
import { CopyIcon, FolderIcon } from '../../common/icons';
import AccessibleModal from '../../common/AccessibleModal';
import type { Project } from '../../../services/projectService';
import type { Job } from '../../../services/jobService';
import './CopyJobModal.css';

interface CopyJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (targetProjectId: number | null, newTitle: string) => void;
  job: Job;
  currentProject?: Project;
  availableProjects: Project[];
  isLoading: boolean;
}

const CopyJobModal: React.FC<CopyJobModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  job,
  currentProject,
  availableProjects,
  isLoading
}) => {
  const [copyOption, setCopyOption] = useState<'same' | 'different'>('same');
  const [selectedProjectId, setSelectedProjectId] = useState<number>(currentProject?.id || 0);
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    if (job && isOpen) {
      setNewTitle(`Copy of ${job.title}`);
      setCopyOption('same');
      setSelectedProjectId(currentProject?.id || 0);
    }
  }, [job, isOpen, currentProject]);

  const handleConfirm = () => {
    const targetProjectId = copyOption === 'same' ? null : selectedProjectId;
    onConfirm(targetProjectId, newTitle.trim());
  };

  const titleId = 'copy-job-modal-title';

  if (!isOpen) return null;

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      labelledBy={titleId}
      overlayClassName="modal-overlay"
      contentClassName="modal-content"
    >
      <div className="modal-header">
        <h2 className="modal-title" id={titleId}>
          <CopyIcon width={20} height={20} /> Copy Job Item
        </h2>
        <button className="modal-close" onClick={onClose} aria-label="Close dialog">
          ✕
        </button>
      </div>

      <div className="modal-body">
        {/* Title Input */}
        <div className="form-group">
          <label htmlFor="copy-title" className="form-label">
            New Title <span className="required">*</span>
          </label>
          <input
            type="text"
            id="copy-title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="form-control"
            placeholder="Enter title for the copied job item"
            disabled={isLoading}
            autoFocus
          />
        </div>

        {/* Project Selection Options */}
        <div className="form-group">
          <label className="form-label">Destination</label>
          
          <div className="radio-group">
            <label className="radio-option">
              <input
                type="radio"
                name="copy-option"
                value="same"
                checked={copyOption === 'same'}
                onChange={(e) => setCopyOption(e.target.value as 'same')}
                disabled={isLoading}
              />
              <span className="radio-label">
                <FolderIcon width={16} height={16} />
                Keep in current project
                {currentProject && (
                  <small className="help-text">"{currentProject.name}"</small>
                )}
              </span>
            </label>

            <label className="radio-option">
              <input
                type="radio"
                name="copy-option"
                value="different"
                checked={copyOption === 'different'}
                onChange={(e) => setCopyOption(e.target.value as 'different')}
                disabled={isLoading}
              />
              <span className="radio-label">
                <FolderIcon width={16} height={16} />
                Move to different project
              </span>
            </label>
          </div>

          {/* Project Selector */}
          {copyOption === 'different' && (
            <div className="form-group" style={{ marginTop: '12px' }}>
              <label htmlFor="target-project" className="form-label">
                Select Target Project
              </label>
              <select
                id="target-project"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(Number(e.target.value))}
                className="form-control"
                disabled={isLoading}
              >
                <option value="">Select project...</option>
                {availableProjects
                  .filter(p => p.id !== currentProject?.id)
                  .map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                      {project.customer_city && project.customer_state && 
                        ` (${project.customer_city}, ${project.customer_state})`
                      }
                    </option>
                  ))
                }
              </select>
            </div>
          )}
        </div>

        {/* Summary Info */}
        <div className="copy-summary">
          <h4>What will be copied:</h4>
          <ul>
            <li>All job item details and settings</li>
            <li>All sections and line items</li>
            <li>Stair configurations (if any)</li>
            <li>Pricing and calculations</li>
          </ul>
          <p><strong>Note:</strong> The copy will be created as a new quote.</p>
        </div>
      </div>

      <div className="modal-footer">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onClose}
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleConfirm}
          disabled={
            isLoading || 
            !newTitle.trim() || 
            (copyOption === 'different' && !selectedProjectId)
          }
        >
          {isLoading ? 'Copying...' : (
            <><CopyIcon width={16} height={16} /> Create Copy</>
          )}
        </button>
      </div>
    </AccessibleModal>
  );
};

export default CopyJobModal;