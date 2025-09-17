import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import jobService from '../../services/jobService';
import salesmanService from '../../services/salesmanService';
import projectService from '../../services/projectService';
import { useToast } from '../common/ToastProvider';
import type { JobWithDetails, QuoteItem, CreateQuoteItemData } from '../../services/jobService';
import type { Salesman } from '../../services/salesmanService';
import type { Project } from '../../services/projectService';
import stairConfigService from '../../services/stairConfigService';
import type { StairConfigurationDetails } from '../../types/stairTypes';
// Removed unused icons import
import '../../styles/common.css';
import './JobDetail.css';
import DetailHeader from './job-detail/DetailHeader';
import AccessibleModal from '../common/AccessibleModal';
import LoadingState from './job-detail/LoadingState';
import ErrorState from './job-detail/ErrorState';
import Summary from './job-detail/Summary';
import EditJobForm from './job-detail/EditJobForm';
import CopyJobModal from './job-detail/CopyJobModal';
import JobInfoGrid from './job-detail/JobInfoGrid';
import SectionsBlock from './job-detail/SectionsBlock';
import TotalsPanel from './job-detail/TotalsPanel';
import FooterActions from './job-detail/FooterActions';
import JobDetailErrorBoundary from './job-detail/JobDetailErrorBoundary';

const isPresent = (value: unknown): boolean => value !== null && value !== undefined;

const buildStairConfigurationCopyPayload = (config: StairConfigurationDetails) => {
  const configName = config.config_name ?? (config as any).configName;
  const floorToFloor = Number(config.floor_to_floor ?? (config as any).floorToFloor ?? 0);
  const numRisers = Number(config.num_risers ?? (config as any).numRisers ?? 0);
  const riserHeight = config.riser_height ?? (config as any).riserHeight ?? undefined;
  const treadMaterialId = config.tread_material_id ?? (config as any).treadMaterialId;
  const riserMaterialId = config.riser_material_id ?? (config as any).riserMaterialId;
  const stringerMaterialId = config.stringer_material_id ?? (config as any).stringerMaterialId;

  const buildStringer = (
    width?: number | null,
    thickness?: number | null,
    materialId?: number | null
  ) => {
    if (!isPresent(width) && !isPresent(thickness) && !isPresent(materialId)) {
      return undefined;
    }

    return {
      width: isPresent(width) ? Number(width) : undefined,
      thickness: isPresent(thickness) ? Number(thickness) : undefined,
      materialId: isPresent(materialId) ? Number(materialId) : undefined,
    };
  };

  const individualStringers = {
    left: buildStringer(config.left_stringer_width, config.left_stringer_thickness, config.left_stringer_material_id),
    right: buildStringer(config.right_stringer_width, config.right_stringer_thickness, config.right_stringer_material_id),
    center: buildStringer(config.center_stringer_width, config.center_stringer_thickness, config.center_stringer_material_id),
  } as const;

  const hasIndividualStringers = Boolean(
    individualStringers.left || individualStringers.right || individualStringers.center
  );

  const items = (config.items || []).map((item: any) => {
    const width = item.stairWidth ?? item.width;
    const totalWidth = item.totalWidth ?? item.length ?? undefined;

    return {
      itemType: item.itemType ?? item.item_type ?? 'tread',
      riserNumber: item.riserNumber ?? item.riser_number ?? null,
      treadType: item.treadType ?? item.tread_type ?? 'box',
      stairWidth: isPresent(width) ? Number(width) : 0,
      totalWidth: isPresent(totalWidth) ? Number(totalWidth) : undefined,
      boardTypeId: item.boardTypeId ?? item.board_type_id ?? undefined,
      materialId: item.materialId ?? item.material_id ?? treadMaterialId,
      specialPartId: item.specialPartId ?? item.special_part_id ?? undefined,
      quantity: Number(item.quantity ?? 1),
      unitPrice: Number(item.unitPrice ?? item.unit_price ?? 0),
      laborPrice: Number(item.laborPrice ?? item.labor_price ?? 0),
      totalPrice: Number(item.totalPrice ?? item.total_price ?? 0),
      notes: item.notes ?? undefined,
    };
  });

  return {
    configName: configName ?? 'Stair Configuration',
    floorToFloor,
    numRisers,
    riserHeight: isPresent(riserHeight) ? Number(riserHeight) : undefined,
    treadMaterialId,
    riserMaterialId,
    treadSize: config.tread_size ?? (config as any).treadSize ?? '',
    roughCutWidth: Number(config.rough_cut_width ?? (config as any).roughCutWidth ?? 0),
    noseSize: Number(config.nose_size ?? (config as any).noseSize ?? 0),
    stringerType: config.stringer_type ?? (config as any).stringerType ?? undefined,
    stringerMaterialId,
    numStringers: Number(config.num_stringers ?? (config as any).numStringers ?? 0),
    centerHorses: Number(config.center_horses ?? (config as any).centerHorses ?? 0),
    fullMitre: Boolean(config.full_mitre ?? (config as any).fullMitre ?? false),
    bracketType: config.bracket_type ?? (config as any).bracketType ?? undefined,
    subtotal: Number(config.subtotal ?? (config as any).subtotal ?? 0),
    laborTotal: Number(config.labor_total ?? (config as any).laborTotal ?? 0),
    taxAmount: Number(config.tax_amount ?? (config as any).taxAmount ?? 0),
    totalAmount: Number(config.total_amount ?? (config as any).totalAmount ?? 0),
    specialNotes: config.special_notes ?? (config as any).specialNotes ?? undefined,
    items,
    individualStringers: hasIndividualStringers ? individualStringers : undefined,
  };
};

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
  currentProject?: Project;
}

const JobDetail: React.FC<JobDetailProps> = ({ jobId, isOpen, onClose, projectName, currentProject }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [job, setJob] = useState<JobWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Copy job state
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [isCopying, setIsCopying] = useState(false);
  
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

  // Copy job handlers
  const handleCopyJob = async () => {
    try {
      // Load available projects for the modal
      const projects = await projectService.getAllProjects();
      setAvailableProjects(projects);
      setShowCopyModal(true);
    } catch (error) {
      console.error('Error loading projects:', error);
      showToast('Failed to load projects for copy', { type: 'error' });
    }
  };

  const handleConfirmCopy = async (targetProjectId: number | null, newTitle: string) => {
    if (!job) return;

    try {
      setIsCopying(true);
      
      // Determine the final project ID - either the target or current project
      // Note: job.job_id is the actual database field name (maps to project)
      const finalProjectId = targetProjectId || currentProject?.id || job.job_id;
      
      if (!finalProjectId) {
        throw new Error('No valid project ID found for copy operation');
      }

      // Create a copy of the job data
      const copyData = {
        customer_id: job.customer_id,
        salesman_id: job.salesman_id,
        title: newTitle,
        description: job.description,
        status: 'quote' as const, // Always start as quote
        delivery_date: job.delivery_date,
        job_location: job.job_location,
        order_designation: job.order_designation,
        model_name: job.model_name,
        installer: job.installer,
        terms: job.terms,
        project_id: finalProjectId
      };

      // Create the new job
      const newJob = await jobService.createJob(copyData);

      // Preload stair configurations referenced by quote items so we can clone them
      const stairConfigIds = new Set<number>();
      (job.sections || []).forEach(section => {
        (section.items || []).forEach(item => {
          if (item.stair_config_id) {
            stairConfigIds.add(item.stair_config_id);
          }
        });
      });

      const stairConfigsById = new Map<number, StairConfigurationDetails>();
      if (stairConfigIds.size > 0) {
        try {
          const configs = await Promise.all(
            Array.from(stairConfigIds).map(async (configId) => {
              const config = await stairConfigService.getStairConfiguration(configId);
              return config;
            })
          );
          configs.forEach((config) => {
            if (config?.id) {
              stairConfigsById.set(config.id, config);
            }
          });
        } catch (stairError) {
          console.error('Error loading stair configurations for copy:', stairError);
          throw new Error('Failed to load stair configuration details for copy.');
        }
      }

      // Copy all sections and items
      for (const section of job.sections || []) {
        const newSection = await jobService.createJobSection(newJob.id, {
          name: section.name,
          display_order: section.display_order
        });

        // Copy all items in this section
        if (section.items) {
          for (const item of section.items) {
            const payload: CreateQuoteItemData = {
              part_number: item.part_number,
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_price,
              is_taxable: item.is_taxable
            };

            if (item.stair_config_id) {
              const sourceConfig = stairConfigsById.get(item.stair_config_id);
              if (!sourceConfig) {
                throw new Error(`Unable to locate stair configuration ${item.stair_config_id} for copy.`);
              }

              payload.part_number = 'STAIR-CONFIG';
              payload.stair_configuration = buildStairConfigurationCopyPayload(sourceConfig);
            }

            await jobService.addQuoteItem(newJob.id, newSection.id, payload);
          }
        }
      }

      setShowCopyModal(false);
      setIsCopying(false);
      
      // Show success message
      const targetProject = targetProjectId ? 
        availableProjects.find(p => p.id === targetProjectId) : currentProject;
      const message = targetProjectId ? 
        `Job item copied to "${targetProject?.name}"` : 
        'Job item copied successfully';
      
      showToast(message, { type: 'success' });

      // Navigate to the new job
      if (targetProjectId && targetProjectId !== currentProject?.id) {
        // Navigate to different project with the new job selected
        navigate('/projects', { 
          state: { selectedJobId: newJob.id } 
        });
      } else {
        // Stay in current project, close current job detail and open new one
        onClose();
        // The parent component should handle opening the new job detail
      }
      
    } catch (error) {
      console.error('Error copying job:', error);
      setIsCopying(false);
      showToast('Failed to copy job item', { type: 'error' });
    }
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
        isNew: item.id <= 0, // Negative IDs are new items
        // Preserve stair configuration payload so saves can persist it
        stair_configuration: (item as any).stair_configuration,
        stair_config_id: (item as any).stair_config_id
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
    <>
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
          onCopy={handleCopyJob}
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
                <div className="breadcrumb">Jobs / {projectName} / {getJobNumber(job)}</div>
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

    {/* Copy Job Modal */}
    {job && (
      <CopyJobModal
        isOpen={showCopyModal}
        onClose={() => setShowCopyModal(false)}
        onConfirm={handleConfirmCopy}
        job={job}
        currentProject={currentProject}
        availableProjects={availableProjects}
        isLoading={isCopying}
      />
    )}
    </>
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
