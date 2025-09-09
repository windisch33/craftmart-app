import React from 'react';

type StepNavigationProps = {
  currentStep: number;
};

const StepNavigation: React.FC<StepNavigationProps> = ({ currentStep }) => (
  <div className="job-form-step-navigation">
    <div className={`job-form-step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
      <div className="job-form-step-number">1</div>
      <div className="job-form-step-label">Basic Information</div>
    </div>
    <div className={`job-form-step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
      <div className="job-form-step-number">2</div>
      <div className="job-form-step-label">Sections & Products</div>
    </div>
    <div className={`job-form-step ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
      <div className="job-form-step-number">3</div>
      <div className="job-form-step-label">Review & Submit</div>
    </div>
  </div>
);

export default StepNavigation;

