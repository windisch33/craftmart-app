import React from 'react';

type FormHeaderProps = {
  title: string;
  onClose: () => void;
  isLoading?: boolean;
};

const FormHeader: React.FC<FormHeaderProps> = ({ title, onClose, isLoading }) => (
  <div className="job-form-header">
    <h2>{title}</h2>
    <button
      className="job-form-close"
      onClick={onClose}
      disabled={isLoading}
    >
      ×
    </button>
  </div>
);

export default FormHeader;

