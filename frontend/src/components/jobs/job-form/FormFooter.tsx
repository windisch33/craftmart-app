import React from 'react';

type FormFooterProps = {
  currentStep: number;
  isLoading: boolean;
  canProceed: boolean;
  onPrev: () => void;
  onCancel: () => void;
  onNext: () => void;
};

const FormFooter: React.FC<FormFooterProps> = ({
  currentStep,
  isLoading,
  canProceed,
  onPrev,
  onCancel,
  onNext,
}) => (
  <div className="job-form-actions">
    {currentStep > 1 && (
      <button
        type="button"
        onClick={onPrev}
        disabled={isLoading}
        className="prev-button"
      >
        ← Previous
      </button>
    )}

    <button
      type="button"
      onClick={onCancel}
      disabled={isLoading}
      className="cancel-button"
    >
      Cancel
    </button>

    {currentStep < 3 ? (
      <button
        type="button"
        onClick={onNext}
        disabled={isLoading || !canProceed}
        className="next-button"
      >
        Next →
      </button>
    ) : (
      <button
        type="submit"
        disabled={isLoading || !canProceed}
        className="submit-button"
      >
        {isLoading ? 'Creating...' : 'Create Job'}
      </button>
    )}
  </div>
);

export default FormFooter;

