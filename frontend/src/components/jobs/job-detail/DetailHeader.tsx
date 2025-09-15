import React from 'react';
import { EyeIcon, PencilIcon, CopyIcon } from '../../common/icons';

type DetailHeaderProps = {
  isEditing: boolean;
  loading: boolean;
  isSaving: boolean;
  onToggleEdit: () => void;
  onCopy: () => void;
  onClose: () => void;
  titleId?: string;
};

const DetailHeader: React.FC<DetailHeaderProps> = ({
  isEditing,
  loading,
  isSaving,
  onToggleEdit,
  onCopy,
  onClose,
  titleId,
}) => (
  <div className="job-detail-header">
    <div className="header-content">
      <h2 id={titleId}>Job Item Details</h2>
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
          className="copy-btn"
          onClick={onCopy}
          disabled={loading || isSaving}
          title="Copy job item"
        >
          <CopyIcon width={16} height={16} /> Copy
        </button>
        <button
          className="close-btn"
          onClick={onClose}
          disabled={loading}
          aria-label="Close dialog"
        >
          ×
        </button>
      </div>
    </div>
  </div>
);

export default DetailHeader;
