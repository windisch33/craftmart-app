import React, { useState, useEffect, useCallback } from 'react';
import jobService from '../../services/jobService';
import salesmanService from '../../services/salesmanService';
import type { JobWithDetails, QuoteItem } from '../../services/jobService';
import type { Salesman } from '../../services/salesmanService';
// Removed unused icons import
import '../../styles/common.css';
import './JobDetail.css';
import DetailHeader from './job-detail/DetailHeader';
import AccessibleModal from '../common/AccessibleModal';
import LoadingState from './job-detail/LoadingState';
import ErrorState from './job-detail/ErrorState';
import Summary from './job-detail/Summary';
import EditJobForm from './job-detail/EditJobForm';
import JobInfoGrid from './job-detail/JobInfoGrid';
import SectionsBlock from './job-detail/SectionsBlock';
import TotalsPanel from './job-detail/TotalsPanel';
import FooterActions from './job-detail/FooterActions';
import JobDetailErrorBoundary from './job-detail/JobDetailErrorBoundary';

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
  display_order: number;
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

// Error boundary moved to ./job-detail/JobDetailErrorBoundary

interface JobDetailProps {
  jobId: number;
  isOpen: boolean;
  onClose: () => void;
  projectName?: string;
}

const JobDetail: React.FC<JobDetailProps> = ({ jobId, isOpen, onClose, projectName }) => {
  const [job, setJob] = useState<JobWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Edit form state
  const [editJobData, setEditJobData] = useState<EditableJobData | null>(null);
  const [editSections, setEditSections] = useState<EditableSection[]>([]);
  const [originalSections, setOriginalSections] = useState<EditableSection[]>([]); // Track original state for deletions
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const loadJobDetails = useCallback(async () => {
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
  }, [jobId]);

  useEffect(() => {
    if (isOpen && jobId) {
      loadJobDetails();
      loadSalesmen();
    }
  }, [isOpen, jobId, loadJobDetails]);

  // loadJobDetails moved into useCallback above

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
      display_order: index + 1,
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
    setOriginalSections(JSON.parse(JSON.stringify(sectionsForEdit))); // Deep copy for comparison
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
      setOriginalSections([]);
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
        delivery_date: editJobData.delivery_date === '' ? undefined : editJobData.delivery_date
      };

      // Update job basic info
      await jobService.updateJob(jobId, jobDataForUpdate);

      // First, identify and delete removed items
      for (const originalSection of originalSections) {
        const currentSection = editSections.find(s => s.id === originalSection.id);
        if (currentSection) {
          // Section still exists, check for deleted items
          for (const originalItem of originalSection.items) {
            const currentItem = currentSection.items.find(i => i.id === originalItem.id);
            if (!currentItem && originalItem.id && originalItem.id > 0) {
              // Item was deleted and has a real ID
              try {
                await jobService.deleteQuoteItem(originalItem.id);
              } catch (err) {
                console.warn('Failed to delete item:', originalItem.id, err);
              }
            }
          }
        }
      }

      // Handle sections and items
      for (const section of editSections) {
        let sectionId = section.id;

        if (section.isNew || !sectionId) {
          // Create new section
          const newSection = await jobService.createJobSection(jobId, {
            name: section.name,
            display_order: section.display_order
          });
          sectionId = newSection.id;
        } else {
          // Update existing section
          await jobService.updateJobSection(sectionId, {
            name: section.name,
            display_order: section.display_order
          });
        }

        // Handle items in this section - only create/update, deletions handled above
        for (const item of section.items) {
          if (item.isNew || !item.id || item.id <= 0) {
            // Create new item
            const itemData: any = {
              part_number: item.part_number,
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_price,
              is_taxable: item.is_taxable
            };
            
            // If this is a stair configuration item, pass the configuration data
            if ((item as any).stair_configuration) {
              itemData.stair_configuration = (item as any).stair_configuration;
            }
            
            await jobService.addQuoteItem(jobId, sectionId!, itemData);
          } else {
            // Update existing item
            const itemData: any = {
              part_number: item.part_number,
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_price,
              is_taxable: item.is_taxable
            };
            
            // If this is a stair configuration item, pass the configuration data
            if ((item as any).stair_configuration) {
              itemData.stair_configuration = (item as any).stair_configuration;
            }
            
            await jobService.updateQuoteItem(item.id, itemData);
          }
        }
      }

      // Reload job details to reflect changes
      await loadJobDetails();
      
      // Exit edit mode
      setIsEditing(false);
      setEditJobData(null);
      setEditSections([]);
      setOriginalSections([]);
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
    setOriginalSections([]);
    setValidationErrors({});
  };

  // Helper functions for managing sections and items
  const addNewSection = () => {
    const newSection: EditableSection = {
      name: '',
      display_order: editSections.length + 1,
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
        return { bg: 'var(--color-primary-100)', color: 'var(--color-primary-800)', border: 'var(--color-primary)' };
      case 'invoice':
        return { bg: '#d1fae5', color: '#065f46', border: '#10b981' };
      default:
        return { bg: '#f3f4f6', color: '#374151', border: '#d1d5db' };
    }
  };

  const titleId = 'job-detail-title';

  if (!isOpen) return null;

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      labelledBy={titleId}
      overlayClassName="job-detail-overlay"
      contentClassName="job-detail-modal"
    >
        {/* Header */}
        <DetailHeader
          isEditing={isEditing}
          loading={loading}
          isSaving={isSaving}
          onToggleEdit={handleEditToggle}
          onClose={onClose}
          titleId={titleId}
        />

        {/* Content */}
        <div className="job-detail-content">
          {loading && (<LoadingState />)}

          {error && (<ErrorState message={error} onRetry={loadJobDetails} />)}

          {job && !loading && !error && (
            <>
              {projectName && (
                <div className="breadcrumb">Projects / {projectName} / {getJobNumber(job)}</div>
              )}
              {/* Job Summary */}
              <Summary job={job} getJobNumber={getJobNumber} getStatusColor={getStatusColor} projectName={projectName} />

                {/* Job Information - Edit/View Toggle */}
                {isEditing && editJobData ? (
                  <EditJobForm
                    data={editJobData}
                    errors={validationErrors as any}
                    salesmen={salesmen}
                    onChange={(next) => setEditJobData(next)}
                  />
                ) : (
                  <JobInfoGrid job={job} />
                )}

              <SectionsBlock
                isEditing={isEditing}
                job={job}
                editSections={editSections}
                validationErrors={validationErrors}
                addNewSection={addNewSection}
                updateSection={updateSection}
                removeSection={removeSection}
                onItemsChange={handleProductSelectorItemsChange}
                jobId={jobId}
              />

              {/* Totals */}
              <TotalsPanel job={job} />
            </>
          )}
        </div>

        {/* Footer Actions */}
        {job && !loading && !error && (
          <FooterActions
            isEditing={isEditing}
            isSaving={isSaving}
            onClose={onClose}
            onCancelChanges={handleCancelChanges}
            onSaveChanges={handleSaveChanges}
          />
        )}
    </AccessibleModal>
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
