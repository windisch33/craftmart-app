import React, { useState, useEffect, Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import jobService from '../../services/jobService';
import salesmanService from '../../services/salesmanService';
import ProductSelector from './ProductSelector';
import type { JobWithDetails, QuoteItem } from '../../services/jobService';
import type { Salesman } from '../../services/salesmanService';
import { formatCurrency } from '../../utils/jobCalculations';
import '../../styles/common.css';
import './JobDetail.css';

interface EditableJobData {
  title: string;
  description: string;
  delivery_date: string;
  salesman_id?: number;
  order_designation: string;
  model_name: string;
  installer: string;
  terms: string;
}

interface EditableSection {
  id?: number;
  name: string;
  description?: string;
  display_order: number;
  is_labor_section: boolean;
  is_misc_section: boolean;
  items: EditableItem[];
  isNew?: boolean;
}

interface EditableItem {
  id?: number;
  part_number?: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  is_taxable: boolean;
  isNew?: boolean;
}

interface ValidationErrors {
  title?: string;
  sections?: { [sectionIndex: number]: { name?: string; items?: { [itemIndex: number]: { description?: string; quantity?: string; unit_price?: string } } } };
}

interface JobDetailErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

interface JobDetailErrorBoundaryProps {
  children: ReactNode;
}

class JobDetailErrorBoundary extends Component<JobDetailErrorBoundaryProps, JobDetailErrorBoundaryState> {
  constructor(props: JobDetailErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): JobDetailErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('JobDetail Error Boundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="job-detail error">
          <h3>Something went wrong loading the job details</h3>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            <summary>Error Details (click to expand)</summary>
            <strong>Error:</strong> {this.state.error && this.state.error.toString()}
            <br />
            <strong>Stack:</strong> {this.state.error && this.state.error.stack}
            <br />
            <strong>Component Stack:</strong> {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
          <button onClick={() => this.setState({ hasError: false })}>
            Try Again
          </button>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

interface JobDetailProps {
  jobId: number;
  isOpen: boolean;
  onClose: () => void;
}

const JobDetail: React.FC<JobDetailProps> = ({ jobId, isOpen, onClose }) => {
  const [job, setJob] = useState<JobWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Edit form state
  const [editJobData, setEditJobData] = useState<EditableJobData | null>(null);
  const [editSections, setEditSections] = useState<EditableSection[]>([]);
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  useEffect(() => {
    if (isOpen && jobId) {
      loadJobDetails();
      loadSalesmen();
    }
  }, [isOpen, jobId]);

  const loadJobDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const jobData = await jobService.getJobWithDetails(jobId);
      setJob(jobData);
    } catch (err) {
      console.error('Error loading job details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const loadSalesmen = async () => {
    try {
      const salesmenData = await salesmanService.getAllSalesmen();
      setSalesmen(salesmenData);
    } catch (err) {
      console.error('Error loading salesmen:', err);
    }
  };

  const initializeEditState = () => {
    if (!job) return;
    
    // Initialize job data for editing
    setEditJobData({
      title: job.title || '',
      description: job.description || '',
      delivery_date: job.delivery_date ? String(job.delivery_date).split('T')[0] : '',
      salesman_id: job.salesman_id || undefined,
      order_designation: job.order_designation || '',
      model_name: job.model_name || '',
      installer: job.installer || '',
      terms: job.terms || ''
    });

    // Initialize sections for editing
    const sectionsForEdit: EditableSection[] = (job.sections || []).map((section, index) => ({
      id: section.id,
      name: section.name,
      description: section.description || '',
      display_order: index + 1,
      is_labor_section: section.is_labor_section || false,
      is_misc_section: section.is_misc_section || false,
      items: (section.items || []).map(item => ({
        id: item.id,
        part_number: item.part_number || '',
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.line_total,
        is_taxable: item.is_taxable
      }))
    }));

    setEditSections(sectionsForEdit);
    setValidationErrors({});
  };

  const handleEditToggle = () => {
    if (!isEditing) {
      // Entering edit mode
      initializeEditState();
      setIsEditing(true);
    } else {
      // Exiting edit mode without saving
      setIsEditing(false);
      setEditJobData(null);
      setEditSections([]);
      setValidationErrors({});
    }
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    
    // Validate job data
    if (!editJobData?.title?.trim()) {
      errors.title = 'Title is required';
    }

    // Validate sections
    const sectionErrors: ValidationErrors['sections'] = {};
    editSections.forEach((section, sectionIndex) => {
      const sectionError: { name?: string; items?: { [itemIndex: number]: { description?: string; quantity?: string; unit_price?: string } } } = {};
      
      if (!section.name?.trim()) {
        sectionError.name = 'Section name is required';
      }

      // Validate items within each section
      const itemErrors: { [itemIndex: number]: { description?: string; quantity?: string; unit_price?: string } } = {};
      section.items.forEach((item, itemIndex) => {
        const itemError: { description?: string; quantity?: string; unit_price?: string } = {};
        
        if (!item.description?.trim()) {
          itemError.description = 'Description is required';
        }
        if (item.quantity <= 0) {
          itemError.quantity = 'Quantity must be greater than 0';
        }
        if (item.unit_price < 0) {
          itemError.unit_price = 'Unit price cannot be negative';
        }

        if (Object.keys(itemError).length > 0) {
          itemErrors[itemIndex] = itemError;
        }
      });

      if (Object.keys(itemErrors).length > 0) {
        sectionError.items = itemErrors;
      }

      if (Object.keys(sectionError).length > 0) {
        sectionErrors[sectionIndex] = sectionError;
      }
    });

    if (Object.keys(sectionErrors).length > 0) {
      errors.sections = sectionErrors;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveChanges = async () => {
    if (!editJobData || !validateForm()) {
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      // Prepare job data - convert empty delivery_date to null for database
      const jobDataForUpdate = {
        ...editJobData,
        delivery_date: editJobData.delivery_date === '' ? null : editJobData.delivery_date
      };

      // Update job basic info
      await jobService.updateJob(jobId, jobDataForUpdate);

      // Handle sections and items
      for (const section of editSections) {
        let sectionId = section.id;

        if (section.isNew || !sectionId) {
          // Create new section
          const newSection = await jobService.createJobSection(jobId, {
            name: section.name,
            description: section.description,
            display_order: section.display_order,
            is_labor_section: section.is_labor_section,
            is_misc_section: section.is_misc_section
          });
          sectionId = newSection.id;
        } else {
          // Update existing section
          await jobService.updateJobSection(sectionId, {
            name: section.name,
            description: section.description,
            display_order: section.display_order,
            is_labor_section: section.is_labor_section,
            is_misc_section: section.is_misc_section
          });
        }

        // Handle items in this section
        for (const item of section.items) {
          if (item.isNew || !item.id) {
            // Create new item
            await jobService.addQuoteItem(jobId, sectionId!, {
              part_number: item.part_number,
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_price,
              is_taxable: item.is_taxable
            });
          } else {
            // Update existing item
            await jobService.updateQuoteItem(item.id, {
              part_number: item.part_number,
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_price,
              is_taxable: item.is_taxable
            });
          }
        }
      }

      // Reload job details to reflect changes
      await loadJobDetails();
      
      // Exit edit mode
      setIsEditing(false);
      setEditJobData(null);
      setEditSections([]);
      setValidationErrors({});
      
    } catch (err) {
      console.error('Error saving job changes:', err);
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelChanges = () => {
    setIsEditing(false);
    setEditJobData(null);
    setEditSections([]);
    setValidationErrors({});
  };

  // Helper functions for managing sections and items
  const addNewSection = () => {
    const newSection: EditableSection = {
      name: '',
      description: '',
      display_order: editSections.length + 1,
      is_labor_section: false,
      is_misc_section: false,
      items: [],
      isNew: true
    };
    setEditSections([...editSections, newSection]);
  };

  const updateSection = (sectionIndex: number, updates: Partial<EditableSection>) => {
    const updatedSections = [...editSections];
    updatedSections[sectionIndex] = { ...updatedSections[sectionIndex], ...updates };
    setEditSections(updatedSections);
  };

  const removeSection = (sectionIndex: number) => {
    const updatedSections = editSections.filter((_, index) => index !== sectionIndex);
    setEditSections(updatedSections);
  };

  const addNewItem = (sectionIndex: number) => {
    const newItem: EditableItem = {
      part_number: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      line_total: 0,
      is_taxable: true,
      isNew: true
    };
    
    const updatedSections = [...editSections];
    updatedSections[sectionIndex].items.push(newItem);
    setEditSections(updatedSections);
  };

  const updateItem = (sectionIndex: number, itemIndex: number, updates: Partial<EditableItem>) => {
    const updatedSections = [...editSections];
    const updatedItem = { ...updatedSections[sectionIndex].items[itemIndex], ...updates };
    
    // Recalculate line total if quantity or unit_price changed
    if ('quantity' in updates || 'unit_price' in updates) {
      updatedItem.line_total = updatedItem.quantity * updatedItem.unit_price;
    }
    
    updatedSections[sectionIndex].items[itemIndex] = updatedItem;
    setEditSections(updatedSections);
  };

  const removeItem = (sectionIndex: number, itemIndex: number) => {
    const updatedSections = [...editSections];
    updatedSections[sectionIndex].items = updatedSections[sectionIndex].items.filter((_, index) => index !== itemIndex);
    setEditSections(updatedSections);
  };

  // Handler for ProductSelector items changes during job editing
  const handleProductSelectorItemsChange = (sectionId: number, items: QuoteItem[]) => {
    const sectionIndex = editSections.findIndex(section => section.id === sectionId);
    if (sectionIndex !== -1) {
      const updatedSections = [...editSections];
      // Convert QuoteItem[] to EditableItem[] for consistency
      const editableItems = items.map(item => ({
        id: item.id,
        part_number: item.part_number || '',
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.line_total,
        is_taxable: item.is_taxable,
        isNew: item.id <= 0 // Negative IDs are new items
      }));
      updatedSections[sectionIndex].items = editableItems;
      setEditSections(updatedSections);
    }
  };

  const getJobNumber = (job: JobWithDetails) => {
    const statusWord = job.status.charAt(0).toUpperCase() + job.status.slice(1);
    return `${statusWord} #${job.id.toString().padStart(4, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'quote':
        return { bg: '#fef3c7', color: '#92400e', border: '#fbbf24' };
      case 'order':
        return { bg: '#dbeafe', color: '#1e40af', border: '#3b82f6' };
      case 'invoice':
        return { bg: '#d1fae5', color: '#065f46', border: '#10b981' };
      default:
        return { bg: '#f3f4f6', color: '#374151', border: '#d1d5db' };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="job-detail-overlay">
      <div className="job-detail-modal">
        {/* Header */}
        <div className="job-detail-header">
          <div className="header-content">
            <h2>Job Details</h2>
            <div className="header-actions">
              <button 
                className="edit-toggle-btn"
                onClick={handleEditToggle}
                disabled={loading || isSaving}
              >
                {isEditing ? '👁️ View' : '✏️ Edit'}
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

        {/* Content */}
        <div className="job-detail-content">
          {loading && (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading job details...</p>
            </div>
          )}

          {error && (
            <div className="error-state">
              <div className="error-icon">⚠️</div>
              <h3>Error Loading Job</h3>
              <p>{error}</p>
              <button onClick={loadJobDetails} className="retry-btn">
                Try Again
              </button>
            </div>
          )}

          {job && !loading && !error && (
            <>
              {/* Job Summary */}
              <div className="job-summary-section">
                <div className="summary-header">
                  <div className="job-title-section">
                    <h3>{job.title}</h3>
                    <p className="customer-name">{job.customer_name}</p>
                    <div className="job-meta">
                      <span className="created-date">
                        📅 Created {new Date(job.created_at).toLocaleDateString()}
                      </span>
                      <div 
                        className="job-number-badge"
                        style={{
                          backgroundColor: getStatusColor(job.status).bg,
                          color: getStatusColor(job.status).color
                        }}
                      >
                        {getJobNumber(job)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Job Information - Edit/View Toggle */}
                {isEditing && editJobData ? (
                  <div className="edit-job-form">
                    <h4>Edit Job Information</h4>
                    <div className="edit-form-grid">
                      <div className="form-section">
                        <div className="form-field">
                          <label>Title: <span className="required">*</span></label>
                          <input
                            type="text"
                            value={editJobData.title}
                            onChange={(e) => setEditJobData({ ...editJobData, title: e.target.value })}
                            className={validationErrors.title ? 'error' : ''}
                            placeholder="Enter job title"
                          />
                          {validationErrors.title && <span className="error-message">{validationErrors.title}</span>}
                        </div>

                        <div className="form-field">
                          <label>Description:</label>
                          <textarea
                            value={editJobData.description}
                            onChange={(e) => setEditJobData({ ...editJobData, description: e.target.value })}
                            placeholder="Enter job description"
                            rows={3}
                          />
                        </div>

                        <div className="form-field">
                          <label>Delivery Date:</label>
                          <input
                            type="date"
                            value={editJobData.delivery_date}
                            onChange={(e) => setEditJobData({ ...editJobData, delivery_date: e.target.value })}
                          />
                        </div>

                        <div className="form-field">
                          <label>Salesman:</label>
                          <select
                            value={editJobData.salesman_id || ''}
                            onChange={(e) => setEditJobData({ ...editJobData, salesman_id: e.target.value ? parseInt(e.target.value) : undefined })}
                          >
                            <option value="">Select Salesman</option>
                            {salesmen.map(salesman => (
                              <option key={salesman.id} value={salesman.id}>
                                {salesmanService.formatSalesmanName(salesman)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="form-section">
                        <div className="form-field">
                          <label>Order Type:</label>
                          <input
                            type="text"
                            value={editJobData.order_designation}
                            onChange={(e) => setEditJobData({ ...editJobData, order_designation: e.target.value })}
                            placeholder="e.g., INSTALL"
                          />
                        </div>

                        <div className="form-field">
                          <label>Model Name:</label>
                          <input
                            type="text"
                            value={editJobData.model_name}
                            onChange={(e) => setEditJobData({ ...editJobData, model_name: e.target.value })}
                            placeholder="Enter model name"
                          />
                        </div>

                        <div className="form-field">
                          <label>Installer:</label>
                          <input
                            type="text"
                            value={editJobData.installer}
                            onChange={(e) => setEditJobData({ ...editJobData, installer: e.target.value })}
                            placeholder="Enter installer name"
                          />
                        </div>

                        <div className="form-field">
                          <label>Terms:</label>
                          <input
                            type="text"
                            value={editJobData.terms}
                            onChange={(e) => setEditJobData({ ...editJobData, terms: e.target.value })}
                            placeholder="e.g., 1/2 DN BAL C.O.D."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="job-info-grid">
                    <div className="info-section">
                      <h4>Basic Information</h4>
                      <div className="info-items">
                        {job.description && (
                          <div className="info-item">
                            <label>Description:</label>
                            <span>{job.description}</span>
                          </div>
                        )}
                        {job.delivery_date && (
                          <div className="info-item">
                            <label>Delivery Date:</label>
                            <span>{new Date(job.delivery_date).toLocaleDateString()}</span>
                          </div>
                        )}
                        {job.salesman_first_name && job.salesman_last_name && (
                          <div className="info-item">
                            <label>Salesman:</label>
                            <span>{job.salesman_first_name} {job.salesman_last_name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="info-section">
                      <h4>Job Details</h4>
                      <div className="info-items">
                        {job.order_designation && (
                          <div className="info-item">
                            <label>Order Type:</label>
                            <span>{job.order_designation}</span>
                          </div>
                        )}
                        {job.model_name && (
                          <div className="info-item">
                            <label>Model:</label>
                            <span>{job.model_name}</span>
                          </div>
                        )}
                        {job.installer && (
                          <div className="info-item">
                            <label>Installer:</label>
                            <span>{job.installer}</span>
                          </div>
                        )}
                        {job.terms && (
                          <div className="info-item">
                            <label>Terms:</label>
                            <span>{job.terms}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sections & Items - Edit/View Toggle */}
              <div className="sections-section">
                <div className="sections-header">
                  <h4>Sections & Items</h4>
                  {isEditing && (
                    <button className="add-section-btn" onClick={addNewSection}>
                      ➕ Add Section
                    </button>
                  )}
                </div>

                {isEditing ? (
                  // Edit Mode - Editable Sections
                  <div className="edit-sections-list">
                    {editSections.length > 0 ? (
                      editSections.map((section, sectionIndex) => (
                        <div key={section.id || `new-${sectionIndex}`} className="edit-section-card">
                          <div className="edit-section-header">
                            <div className="section-name-field">
                              <input
                                type="text"
                                value={section.name}
                                onChange={(e) => updateSection(sectionIndex, { name: e.target.value })}
                                placeholder="Section name"
                                className={validationErrors.sections?.[sectionIndex]?.name ? 'error' : ''}
                              />
                              {validationErrors.sections?.[sectionIndex]?.name && (
                                <span className="error-message">{validationErrors.sections[sectionIndex].name}</span>
                              )}
                            </div>
                            <div className="section-actions">
                              <button 
                                className="add-item-btn" 
                                onClick={() => addNewItem(sectionIndex)}
                                title="Add Item"
                              >
                                ➕ Item
                              </button>
                              <button 
                                className="remove-section-btn" 
                                onClick={() => removeSection(sectionIndex)}
                                title="Remove Section"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>

                          <div className="section-description-field">
                            <textarea
                              value={section.description || ''}
                              onChange={(e) => updateSection(sectionIndex, { description: e.target.value })}
                              placeholder="Section description (optional)"
                              rows={2}
                            />
                          </div>

                          <div className="section-options">
                            <label>
                              <input
                                type="checkbox"
                                checked={section.is_labor_section}
                                onChange={(e) => updateSection(sectionIndex, { is_labor_section: e.target.checked })}
                              />
                              Labor Section
                            </label>
                            <label>
                              <input
                                type="checkbox"
                                checked={section.is_misc_section}
                                onChange={(e) => updateSection(sectionIndex, { is_misc_section: e.target.checked })}
                              />
                              Misc Section
                            </label>
                          </div>

                          {/* Edit Items */}
                          <div className="edit-items-section">
                            {section.items.length > 0 ? (
                              <div className="edit-items-table">
                                <div className="edit-table-header">
                                  <div className="col-part">Part #</div>
                                  <div className="col-desc">Description</div>
                                  <div className="col-qty">Qty</div>
                                  <div className="col-price">Price</div>
                                  <div className="col-total">Total</div>
                                  <div className="col-tax">Tax</div>
                                  <div className="col-actions">Actions</div>
                                </div>
                                {section.items.map((item, itemIndex) => (
                                  <div key={item.id || `new-item-${itemIndex}`} className="edit-table-row">
                                    <div className="col-part">
                                      <input
                                        type="text"
                                        value={item.part_number || ''}
                                        onChange={(e) => updateItem(sectionIndex, itemIndex, { part_number: e.target.value })}
                                        placeholder="Part #"
                                      />
                                    </div>
                                    <div className="col-desc">
                                      <input
                                        type="text"
                                        value={item.description}
                                        onChange={(e) => updateItem(sectionIndex, itemIndex, { description: e.target.value })}
                                        placeholder="Description"
                                        className={validationErrors.sections?.[sectionIndex]?.items?.[itemIndex]?.description ? 'error' : ''}
                                      />
                                      {validationErrors.sections?.[sectionIndex]?.items?.[itemIndex]?.description && (
                                        <span className="error-message">{validationErrors.sections[sectionIndex].items![itemIndex].description}</span>
                                      )}
                                    </div>
                                    <div className="col-qty">
                                      <input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => updateItem(sectionIndex, itemIndex, { quantity: parseFloat(e.target.value) || 0 })}
                                        min="0"
                                        step="0.01"
                                        className={validationErrors.sections?.[sectionIndex]?.items?.[itemIndex]?.quantity ? 'error' : ''}
                                      />
                                      {validationErrors.sections?.[sectionIndex]?.items?.[itemIndex]?.quantity && (
                                        <span className="error-message">{validationErrors.sections[sectionIndex].items![itemIndex].quantity}</span>
                                      )}
                                    </div>
                                    <div className="col-price">
                                      <input
                                        type="number"
                                        value={item.unit_price}
                                        onChange={(e) => updateItem(sectionIndex, itemIndex, { unit_price: parseFloat(e.target.value) || 0 })}
                                        min="0"
                                        step="0.01"
                                        className={validationErrors.sections?.[sectionIndex]?.items?.[itemIndex]?.unit_price ? 'error' : ''}
                                      />
                                      {validationErrors.sections?.[sectionIndex]?.items?.[itemIndex]?.unit_price && (
                                        <span className="error-message">{validationErrors.sections[sectionIndex].items![itemIndex].unit_price}</span>
                                      )}
                                    </div>
                                    <div className="col-total">
                                      {formatCurrency(item.line_total)}
                                    </div>
                                    <div className="col-tax">
                                      <input
                                        type="checkbox"
                                        checked={item.is_taxable}
                                        onChange={(e) => updateItem(sectionIndex, itemIndex, { is_taxable: e.target.checked })}
                                      />
                                    </div>
                                    <div className="col-actions">
                                      <button 
                                        className="remove-item-btn"
                                        onClick={() => removeItem(sectionIndex, itemIndex)}
                                        title="Remove Item"
                                      >
                                        🗑️
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="no-items-edit">
                                <span>No items in this section</span>
                                <button onClick={() => addNewItem(sectionIndex)}>Add First Item</button>
                              </div>
                            )}
                          </div>

                          {/* Product Selector for Adding New Items */}
                          <div className="product-selector-section job-edit-product-selector">
                            <ProductSelector
                              jobId={jobId}
                              section={{
                                id: section.id || -1,
                                name: section.name,
                                description: section.description,
                                display_order: section.display_order,
                                is_labor_section: section.is_labor_section,
                                is_misc_section: section.is_misc_section,
                                items: section.items.map(item => ({
                                  id: item.id || -1,
                                  job_id: jobId,
                                  section_id: section.id || -1,
                                  part_number: item.part_number || '',
                                  description: item.description,
                                  quantity: item.quantity,
                                  unit_price: item.unit_price,
                                  line_total: item.line_total,
                                  is_taxable: item.is_taxable,
                                  created_at: new Date().toISOString()
                                }))
                              }}
                              onItemsChange={handleProductSelectorItemsChange}
                              isReadOnly={isSaving}
                              isLoading={isSaving}
                              isDraftMode={false}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="no-sections-edit">
                        <span>No sections found for this job</span>
                        <button onClick={addNewSection}>Add First Section</button>
                      </div>
                    )}
                  </div>
                ) : (
                  // View Mode - Read-only Sections
                  job.sections && job.sections.length > 0 ? (
                    <div className="sections-list">
                      {job.sections.map((section) => (
                        <div key={section.id} className="section-card">
                          <div className="section-header">
                            <h5>{section.name}</h5>
                            <span className="item-count">
                              {section.items?.length || 0} items
                            </span>
                          </div>
                          
                          {section.description && (
                            <p className="section-description">{section.description}</p>
                          )}

                          {section.items && section.items.length > 0 ? (
                            <div className="items-table">
                              <div className="table-header">
                                <div className="col-qty">Qty</div>
                                <div className="col-description">Description</div>
                                <div className="col-unit-price">Unit Price</div>
                                <div className="col-total">Total</div>
                                <div className="col-tax">Tax</div>
                              </div>
                              {section.items.map((item) => (
                                <div key={item.id} className="table-row">
                                  <div className="col-qty">{item.quantity}</div>
                                  <div className="col-description">
                                    {item.part_number && (
                                      <div className="part-number">{item.part_number}</div>
                                    )}
                                    <div className="description">{item.description}</div>
                                  </div>
                                  <div className="col-unit-price">
                                    {formatCurrency(item.unit_price)}
                                  </div>
                                  <div className="col-total">
                                    {formatCurrency(item.line_total)}
                                  </div>
                                  <div className={`col-tax ${item.is_taxable ? 'taxable' : 'non-taxable'}`}>
                                    {item.is_taxable ? '✓' : '✗'}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="no-items">
                              <span>No items in this section</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-sections">
                      <span>No sections found for this job</span>
                    </div>
                  )
                )}
              </div>

              {/* Totals */}
              <div className="totals-section">
                <h4>Job Totals</h4>
                <div className="totals-breakdown">
                  <div className="total-line">
                    <span>Subtotal (Taxable):</span>
                    <span>{formatCurrency(job.subtotal || 0)}</span>
                  </div>
                  <div className="total-line">
                    <span>Labor & Non-Taxable:</span>
                    <span>{formatCurrency(job.labor_total || 0)}</span>
                  </div>
                  <div className="total-line">
                    <span>Tax ({((job.tax_rate || 0) * 100).toFixed(2)}%):</span>
                    <span>{formatCurrency(job.tax_amount || 0)}</span>
                  </div>
                  <div className="total-line grand-total">
                    <span>Grand Total:</span>
                    <span>{formatCurrency(job.total_amount || 0)}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {job && !loading && !error && (
          <div className="job-detail-footer">
            <button className="footer-btn secondary" onClick={onClose}>
              Close
            </button>
            {isEditing && (
              <>
                <button 
                  className="btn btn-secondary"
                  onClick={handleCancelChanges}
                  disabled={isSaving}
                >
                  Cancel Changes
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Wrapper component with error boundary
const JobDetailWithErrorBoundary: React.FC<JobDetailProps> = (props) => {
  return (
    <JobDetailErrorBoundary>
      <JobDetail {...props} />
    </JobDetailErrorBoundary>
  );
};

export default JobDetailWithErrorBoundary;