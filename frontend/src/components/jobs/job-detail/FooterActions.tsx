import React from 'react';

type FooterActionsProps = {
  isEditing: boolean;
  isSaving: boolean;
  onClose: () => void;
  onCancelChanges: () => void;
  onSaveChanges: () => void;
};

const FooterActions: React.FC<FooterActionsProps> = ({
  isEditing,
  isSaving,
  onClose,
  onCancelChanges,
  onSaveChanges,
}) => (
  <div className="job-detail-footer">
    <button className="footer-btn secondary" onClick={onClose}>
      Close
    </button>
    {isEditing && (
      <>
        <button
          className="btn btn-secondary"
          onClick={onCancelChanges}
          disabled={isSaving}
        >
          Cancel Changes
        </button>
        <button
          className="btn btn-primary"
          onClick={onSaveChanges}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </>
    )}
  </div>
);

export default FooterActions;

