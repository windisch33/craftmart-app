import React from 'react';

type FormHeaderProps = {
  title: string;
  onClose: () => void;
  isLoading?: boolean;
  titleId?: string;
};

const FormHeader: React.FC<FormHeaderProps> = ({ title, onClose, isLoading, titleId }) => (
  <div className="job-form-header">
    <h2 id={titleId}>{title}</h2>
    <button
      className="job-form-close"
      onClick={onClose}
      disabled={isLoading}
      aria-label="Close dialog"
    >
      ×
    </button>
  </div>
);

export default FormHeader;
