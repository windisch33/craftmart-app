import React, { useState, useEffect, useMemo, useCallback } from 'react';
import customerService from '../../services/customerService';
import salesmanService from '../../services/salesmanService';
import type { Customer } from '../../services/customerService';
import type { Salesman } from '../../services/salesmanService';
import type { CreateJobData, JobSection, QuoteItem } from '../../services/jobService';
import CustomerForm from '../customers/CustomerForm';
import SalesmanForm from '../salesmen/SalesmanForm';
import SectionManager from './SectionManager';
import ProductSelector from './ProductSelector';
import { calculateJobTotals, getTaxRateForState, formatCurrency } from '../../utils/jobCalculations';
import { StairConfigurationProvider, useStairConfiguration } from '../../contexts/StairConfigurationContext';
import './JobForm.css';
import FormHeader from './job-form/FormHeader';
import StepNavigation from './job-form/StepNavigation';
import TotalsSidebar from './job-form/TotalsSidebar';
import FormFooter from './job-form/FormFooter';
import JobFormErrorBoundary from './job-form/JobFormErrorBoundary';
import AccessibleModal from '../common/AccessibleModal';

// Error boundary moved to ./job-form/JobFormErrorBoundary

interface JobFormProps {
  onSubmit: (job: CreateJobData, sections: JobSection[]) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  projectId?: number;
}

const JobFormInner: React.FC<JobFormProps> = ({ 
  onSubmit, 
  onCancel, 
  isLoading = false,
  projectId 
}) => {
  const { clearDraftConfigurations } = useStairConfiguration();
  const [formData, setFormData] = useState<CreateJobData>({
    customer_id: 0,
    salesman_id: undefined,
    title: '',
    description: '',
    status: 'quote',
    delivery_date: '',
    job_location: '',
    order_designation: 'INSTALL',
    model_name: '',
    installer: '',
    terms: '1/2 DN BAL C.O.D.'
  });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Modal states for inline creation
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showSalesmanForm, setShowSalesmanForm] = useState(false);

  // Job sections and calculations
  const [sections, setSections] = useState<JobSection[]>([]);
  const [currentStep, setCurrentStep] = useState(1); // 1: Basic Info, 2: Sections & Products, 3: Review
  const [taxRate, setTaxRate] = useState(0);
  // Job totals are now calculated via useMemo below

  useEffect(() => {
    loadData();
  }, []);

  // Memoize selected customer and salesman
  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id === formData.customer_id);
  }, [customers, formData.customer_id]);

  const selectedSalesman = useMemo(() => {
    return salesmen.find(s => s.id === formData.salesman_id);
  }, [salesmen, formData.salesman_id]);

  // Memoize job totals calculation to prevent infinite re-renders
  const jobTotals = useMemo(() => {
    console.log('JobForm: Calculating job totals, sections:', sections.length, 'taxRate:', taxRate);
    return calculateJobTotals(sections, taxRate);
  }, [sections, taxRate]);

  // Memoized validation check that doesn't update state
  const isFormValidForStep = useMemo(() => {
    return (step: number): boolean => {
      // Step 1: Basic Information
      if (step >= 1) {
        if (!projectId && !formData.customer_id) return false;
        if (!formData.title.trim()) return false;
        if (formData.delivery_date) {
          const deliveryDate = new Date(formData.delivery_date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (deliveryDate < today) return false;
        }
      }

      // Step 2: Sections and Products
      if (step >= 2) {
        if (sections.length === 0) return false;
        const hasItems = sections.some(section => section.items && section.items.length > 0);
        if (!hasItems) return false;
      }

      return true;
    };
  }, [projectId, formData.customer_id, formData.title, formData.delivery_date, sections]);

  // Update tax rate when customer changes
  useEffect(() => {
    if (selectedCustomer?.state) {
      const rate = getTaxRateForState(selectedCustomer.state);
      console.log('JobForm: Setting tax rate for state', selectedCustomer.state, ':', rate);
      setTaxRate(rate);
    }
  }, [selectedCustomer]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [recentCustomers, salesmenData] = await Promise.all([
        customerService.getRecentCustomers(),
        salesmanService.getAllSalesmen()
      ]);
      setCustomers(recentCustomers);
      setSalesmen(salesmenData);
    } catch (error) {
      console.error('Error loading form data:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (step?: number) => {
    const newErrors: Record<string, string> = {};
    const validateStep = step || currentStep;

    // Step 1: Basic Information
    if (validateStep >= 1) {
      if (!projectId && !formData.customer_id) {
        newErrors.customer_id = 'Please select a customer';
      }

      if (!formData.title.trim()) {
        newErrors.title = 'Job title is required';
      }

      if (formData.delivery_date) {
        const deliveryDate = new Date(formData.delivery_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (deliveryDate < today) {
          newErrors.delivery_date = 'Delivery date cannot be in the past';
        }
      }
    }

    // Step 2: Sections and Products
    if (validateStep >= 2) {
      if (sections.length === 0) {
        newErrors.sections = 'At least one section is required';
      } else {
        const hasItems = sections.some(section => section.items && section.items.length > 0);
        if (!hasItems) {
          newErrors.items = 'At least one item is required across all sections';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only allow submission on step 3 (Review & Submit)
    if (currentStep !== 3) {
      console.log('JobForm: Form submission attempted but not on step 3, currentStep:', currentStep);
      return;
    }
    
    if (!validateForm()) {
      return;
    }

    try {
      const submitData = {
        ...formData,
        delivery_date: formData.delivery_date || undefined,
        job_location: formData.job_location || undefined,
        order_designation: formData.order_designation || undefined,
        model_name: formData.model_name || undefined,
        installer: formData.installer || undefined,
        terms: formData.terms || undefined,
        po_number: formData.po_number?.trim() ? formData.po_number : undefined
      };

      // Call the original onSubmit which will create the job and sections
      await onSubmit(submitData, sections);
      
      // Note: Draft stair configurations are handled in the wrapping JobForm component
      // The parent context will automatically save any draft configurations after job creation
      // We clear the draft configurations to prevent reuse
      clearDraftConfigurations();
      
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  // Handle Enter key press to prevent unwanted form submissions
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Prevent Enter from submitting the form unless we're explicitly on step 3
    if (e.key === 'Enter') {
      const target = e.target as HTMLElement;
      
      // Allow Enter in textareas (they should create new lines)
      if (target.tagName === 'TEXTAREA') {
        return;
      }
      
      // Always prevent default Enter behavior on forms
      e.preventDefault();
      e.stopPropagation();
      
      // Only allow form submission if we're on step 3 AND focused on the submit button
      // Do not attempt to detect submit button via target.type (not on HTMLElement)
      
      // For steps 1 and 2, advance to next step if valid
      if (currentStep < 3 && canProceedToNextStep()) {
        handleNextStep();
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked :
               type === 'number' ? (value === '' ? 0 : parseFloat(value)) :
               value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };


  const handleCustomerCreate = async (customerData: any) => {
    try {
      const newCustomer = await customerService.createCustomer(customerData);
      setCustomers(prev => [...prev, newCustomer]);
      setFormData(prev => ({ ...prev, customer_id: newCustomer.id }));
      setShowCustomerForm(false);
    } catch (error) {
      console.error('Error creating customer:', error);
      alert('Failed to create customer');
    }
  };

  const handleSalesmanCreate = async (salesmanData: any) => {
    try {
      const newSalesman = await salesmanService.createSalesman(salesmanData);
      setSalesmen(prev => [...prev, newSalesman]);
      setFormData(prev => ({ ...prev, salesman_id: newSalesman.id }));
      setShowSalesmanForm(false);
    } catch (error) {
      console.error('Error creating salesman:', error);
      alert('Failed to create salesman');
    }
  };

  // Section and item handlers (memoized to prevent infinite loops)
  const handleSectionsChange = useCallback((updatedSections: JobSection[]) => {
    console.log('JobForm: handleSectionsChange called with', updatedSections.length, 'sections');
    setSections(updatedSections);
  }, []);

  const handleItemsChange = useCallback((sectionId: number, items: QuoteItem[]) => {
    console.log('JobForm: handleItemsChange called for section', sectionId, 'with', items.length, 'items');
    setSections(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, items }
        : section
    ));
  }, []);

  // Step navigation
  const handleNextStep = (e?: React.MouseEvent) => {
    // Prevent any potential form submission when clicking Next button
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log('JobForm: handleNextStep called, currentStep:', currentStep);
    try {
      const isValid = validateForm(currentStep);
      console.log('JobForm: Form validation result:', isValid);
      if (isValid) {
        const nextStep = Math.min(currentStep + 1, 3);
        console.log('JobForm: Moving to step:', nextStep);
        setCurrentStep(nextStep);
      }
    } catch (error) {
      console.error('JobForm: Error in handleNextStep:', error);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const canProceedToNextStep = () => {
    if (currentStep === 1) {
      return ((projectId != null) || formData.customer_id > 0) && formData.title.trim().length > 0;
    }
    if (currentStep === 2) {
      return sections.length > 0 && sections.some(s => s.items && s.items.length > 0);
    }
    return true;
  };

  // selectedCustomer and selectedSalesman are now memoized above

  const titleId = 'job-form-title';

  if (loading) {
    return (
      <AccessibleModal isOpen={true} onClose={onCancel} labelledBy={titleId} overlayClassName="job-form-overlay" contentClassName="job-form-modal">
        <div className="loading-state">
          <h2 id={titleId} style={{ position: 'absolute', left: -9999 }}>Create New Job</h2>
          <div className="loading-spinner"></div>
          <p>Loading form data...</p>
        </div>
      </AccessibleModal>
    );
  }

  return (
    <>
      <AccessibleModal isOpen={true} onClose={onCancel} labelledBy={titleId} overlayClassName="job-form-overlay" contentClassName="job-form-modal">
          <FormHeader title="Create New Job Item" onClose={onCancel} isLoading={isLoading} titleId={titleId} />

          {/* Step Navigation */}
          <StepNavigation currentStep={currentStep} />

          <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="job-form">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <>
                <div className="job-form-section">
              <h3 className="section-title">Basic Information</h3>
              
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="title">Job Item Title *</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className={errors.title ? 'error' : ''}
                    disabled={isLoading}
                    placeholder="e.g., Custom Oak Staircase"
                    required
                  />
                  {errors.title && <span className="error-message">{errors.title}</span>}
                </div>

                <div className="form-field">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    disabled={isLoading}
                  >
                    <option value="quote">Quote</option>
                    <option value="order">Order</option>
                    <option value="invoice">Invoice</option>
                  </select>
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  disabled={isLoading}
                  rows={3}
                  placeholder="Detailed description of the job requirements..."
                />
              </div>
            </div>

            {/* Customer & Salesman Selection */}
            <div className="job-form-section">
              <h3 className="section-title">Customer & Salesman</h3>
              
              <div className="form-row">
                {!projectId && (
                  <div className="form-field">
                    <label htmlFor="customer_id">Customer *</label>
                    <div className="select-with-add">
                      <select
                        id="customer_id"
                        name="customer_id"
                        value={formData.customer_id}
                        onChange={handleChange}
                        className={errors.customer_id ? 'error' : ''}
                        disabled={isLoading}
                        required
                      >
                        <option value="">Select Customer</option>
                        {customers.map(customer => (
                          <option key={customer.id} value={customer.id}>
                            {customer.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="add-button"
                        onClick={() => setShowCustomerForm(true)}
                        disabled={isLoading}
                      >
                        + New
                      </button>
                    </div>
                    {errors.customer_id && <span className="error-message">{errors.customer_id}</span>}
                    {selectedCustomer && (
                      <div className="selected-info">
                        <small>
                          📧 {selectedCustomer.email} • 📞 {selectedCustomer.phone} • 📍 {selectedCustomer.city}, {selectedCustomer.state}
                        </small>
                      </div>
                    )}
                  </div>
                )}

                <div className="form-field">
                  <label htmlFor="salesman_id">Salesman</label>
                  <div className="select-with-add">
                    <select
                      id="salesman_id"
                      name="salesman_id"
                      value={formData.salesman_id || ''}
                      onChange={handleChange}
                      disabled={isLoading}
                    >
                      <option value="">Select Salesman</option>
                      {salesmen.map(salesman => (
                        <option key={salesman.id} value={salesman.id}>
                          {salesmanService.formatSalesmanName(salesman)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="add-button"
                      onClick={() => setShowSalesmanForm(true)}
                      disabled={isLoading}
                    >
                      + New
                    </button>
                  </div>
                  {selectedSalesman && (
                    <div className="selected-info">
                      <small>
                        📧 {selectedSalesman.email} • 📞 {selectedSalesman.phone} • 💼 {salesmanService.formatCommissionRate(selectedSalesman.commission_rate)}
                      </small>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Job Details */}
            <div className="job-form-section">
              <h3 className="section-title">Job Details</h3>
              
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="delivery_date">Delivery Date</label>
                  <input
                    type="date"
                    id="delivery_date"
                    name="delivery_date"
                    value={formData.delivery_date}
                    onChange={handleChange}
                    className={errors.delivery_date ? 'error' : ''}
                    disabled={isLoading}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {errors.delivery_date && <span className="error-message">{errors.delivery_date}</span>}
                </div>

                <div className="form-field">
                  <label htmlFor="order_designation">Order Designation</label>
                  <select
                    id="order_designation"
                    name="order_designation"
                    value={formData.order_designation}
                    onChange={handleChange}
                    disabled={isLoading}
                  >
                    <option value="INSTALL">INSTALL</option>
                    <option value="PICKUP">PICKUP</option>
                    <option value="DELIVERY">DELIVERY</option>
                    <option value="CUSTOM">CUSTOM</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="model_name">Model Name</label>
                  <input
                    type="text"
                    id="model_name"
                    name="model_name"
                    value={formData.model_name}
                    onChange={handleChange}
                    disabled={isLoading}
                    placeholder="e.g., Custom Rails per Dave's Measure"
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="installer">Installer</label>
                  <input
                    type="text"
                    id="installer"
                    name="installer"
                    value={formData.installer}
                    onChange={handleChange}
                    disabled={isLoading}
                    placeholder="Installer name"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="terms">Payment Terms</label>
                  <input
                    type="text"
                    id="terms"
                    name="terms"
                    value={formData.terms}
                    onChange={handleChange}
                    disabled={isLoading}
                    placeholder="e.g., 1/2 DN BAL C.O.D."
                  />
                </div>


              </div>

              <div className="form-field">
                <label htmlFor="job_location">Job Item Location / Directions</label>
                <textarea
                  id="job_location"
                  name="job_location"
                  value={formData.job_location}
                  onChange={handleChange}
                  disabled={isLoading}
                  rows={2}
                  placeholder="Specific directions or location details..."
                />
              </div>
                </div>
              </>
            )}

            {/* Step 2: Sections & Products */}
            {currentStep === 2 && (
              <>
                <div className="job-form-section">
                  <h3 className="section-title">Job Item Sections & Products</h3>
                  
                  {/* Section Management */}
                  <SectionManager
                    sections={sections}
                    onSectionsChange={handleSectionsChange}
                    isLoading={isLoading}
                  />
                  
                  {/* Product Selection for Each Section */}
                  {sections.map((section) => (
                    <ProductSelector
                      key={section.id}
                      section={section}
                      onItemsChange={handleItemsChange}
                      isLoading={isLoading}
                      isDraftMode={true}
                    />
                  ))}
                  
                  {/* Error Messages */}
                  {errors.sections && <div className="error-message">{errors.sections}</div>}
                  {errors.items && <div className="error-message">{errors.items}</div>}
                </div>

                {/* Running Totals Sidebar */}
                <TotalsSidebar jobTotals={jobTotals} taxRate={taxRate} selectedCustomer={selectedCustomer} />
              </>
            )}

            {/* Step 3: Review & Submit */}
            {currentStep === 3 && (
              <>
                <div className="job-form-section">
                  <h3 className="section-title">Review Job Item Details</h3>
                  
                  {/* Job Summary */}
                  <div className="job-summary">
                    <div className="summary-section">
                      <h4>Basic Information</h4>
                      <div className="summary-item">
                        <strong>Title:</strong> {formData.title}
                      </div>
                      <div className="summary-item">
                        <strong>Customer:</strong> {selectedCustomer?.name}
                      </div>
                      {selectedSalesman && (
                        <div className="summary-item">
                          <strong>Salesman:</strong> {salesmanService.formatSalesmanName(selectedSalesman)}
                        </div>
                      )}
                      <div className="summary-item">
                        <strong>Status:</strong> {formData.status}
                      </div>
                      {formData.delivery_date && (
                        <div className="summary-item">
                          <strong>Delivery:</strong> {new Date(formData.delivery_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    <div className="summary-section">
                      <h4>Sections & Items</h4>
                      {sections.map((section) => (
                        <div key={section.id} className="section-summary">
                          <div className="section-header">
                            <strong>{section.name}</strong>
                            <span className="item-count">({section.items?.length || 0} items)</span>
                          </div>
                          {section.items && section.items.length > 0 && (
                            <div className="items-preview">
                              {section.items.slice(0, 3).map((item) => (
                                <div key={item.id} className="item-preview">
                                  {item.quantity}x {item.description} - {formatCurrency(item.line_total)}
                                </div>
                              ))}
                              {section.items.length > 3 && (
                                <div className="more-items">
                                  +{section.items.length - 3} more items
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="summary-section">
                      <h4>Final Totals</h4>
                      <div className="final-totals">
                        <div className="total-line">
                          <span>Taxable Items:</span>
                          <span>{formatCurrency(jobTotals.taxableAmount)}</span>
                        </div>
                        <div className="total-line">
                          <span>Labor & Non-Taxable:</span>
                          <span>{formatCurrency(jobTotals.laborTotal)}</span>
                        </div>
                        <div className="total-line">
                          <span>Tax:</span>
                          <span>{formatCurrency(jobTotals.taxAmount)}</span>
                        </div>
                        <div className="total-line grand-total">
                          <span>Grand Total:</span>
                          <span>{formatCurrency(jobTotals.grandTotal)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Step Navigation Actions */}
            <FormFooter
              currentStep={currentStep}
              isLoading={isLoading}
              canProceed={currentStep < 3 ? canProceedToNextStep() : isFormValidForStep(3)}
              onPrev={handlePrevStep}
              onCancel={onCancel}
              onNext={handleNextStep}
            />
          </form>
      </AccessibleModal>

      {/* Customer Creation Modal */}
      <CustomerForm
        isOpen={showCustomerForm}
        onClose={() => setShowCustomerForm(false)}
        onSave={handleCustomerCreate}
      />

      {/* Salesman Creation Modal */}
      <SalesmanForm
        isOpen={showSalesmanForm}
        onClose={() => setShowSalesmanForm(false)}
        onSave={handleSalesmanCreate}
      />
    </>
  );
};

// Main JobForm component with stair configuration handling
const JobForm: React.FC<JobFormProps> = ({ onSubmit, ...otherProps }) => {
  return (
    <StairConfigurationProvider>
      <JobFormWithStairHandling onSubmit={onSubmit} {...otherProps} />
    </StairConfigurationProvider>
  );
};

// Intermediate wrapper to handle stair configurations
const JobFormWithStairHandling: React.FC<JobFormProps> = ({ onSubmit, ...otherProps }) => {
  const { draftConfigurations } = useStairConfiguration();

  const handleSubmitWithStairConfigs = async (jobData: CreateJobData, sections: JobSection[]) => {
    // First create the job and sections normally
    await onSubmit(jobData, sections);
    
    // TODO: Future enhancement - save draft stair configurations here
    // For now, the draft configurations are handled in the StairConfigurator itself
    // which saves them as quote items to the job sections
    
    console.log('Draft stair configurations available for processing:', draftConfigurations.length);
  };

  return (
    <JobFormInner onSubmit={handleSubmitWithStairConfigs} {...otherProps} />
  );
};

// Wrapper component with error boundary
const JobFormWithErrorBoundary: React.FC<JobFormProps> = (props) => {
  return (
    <JobFormErrorBoundary>
      <JobForm {...props} />
    </JobFormErrorBoundary>
  );
};

export default JobFormWithErrorBoundary;
