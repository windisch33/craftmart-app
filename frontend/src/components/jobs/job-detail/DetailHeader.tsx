import React from 'react';
import { EyeIcon, PencilIcon } from '../../common/icons';

type DetailHeaderProps = {
  isEditing: boolean;
  loading: boolean;
  isSaving: boolean;
  onToggleEdit: () => void;
  onClose: () => void;
};

const DetailHeader: React.FC<DetailHeaderProps> = ({
  isEditing,
  loading,
  isSaving,
  onToggleEdit,
  onClose,
}) => (
  <div className="job-detail-header">
    <div className="header-content">
      <h2>Job Details</h2>
      <div className="header-actions">
        <button
          className="edit-toggle-btn"
          onClick={onToggleEdit}
          disabled={loading || isSaving}
        >
          {isEditing ? (
            <><EyeIcon width={16} height={16} /> View</>
          ) : (
            <><PencilIcon width={16} height={16} /> Edit</>
          )}
        </button>
        <button
          className="close-btn"
          onClick={onClose}
          disabled={loading}
        >
          ×
        </button>
      </div>
    </div>
  </div>
);

export default DetailHeader;

