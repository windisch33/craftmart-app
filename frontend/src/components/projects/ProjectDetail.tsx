import React, { useState, useEffect, useCallback } from 'react';
import { jobsService } from '../../services/jobsService';
import type { Project as ParentJob } from '../../services/projectService';
import type { Job as JobItem } from '../../services/jobService';
import jobService from '../../services/jobService';
import JobForm from '../jobs/JobForm';
import JobDetail from '../jobs/JobDetail';
import JobPDFPreview from '../jobs/JobPDFPreview';
import { StairConfigurationProvider } from '../../contexts/StairConfigurationContext';
import { ClipboardIcon, AlertTriangleIcon, FolderIcon, ArrowRightIcon, FileIcon } from '../common/icons';
import AccessibleModal from '../common/AccessibleModal';

interface ProjectDetailProps {
  projectId: number;
  isOpen: boolean;
  onClose: () => void;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({
  projectId,
  isOpen,
  onClose
}) => {
  const [project, setProject] = useState<ParentJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showJobForm, setShowJobForm] = useState(false);
  const [selectedJob, setSelectedJob] = useState<{ jobId: number } | null>(null);
  const [pdfPreview, setPdfPreview] = useState<{ jobId: number; jobTitle: string } | null>(null);
  // Local status filter for job items list: all | quote | order | invoice
  const [statusFilter, setStatusFilter] = useState<'all' | 'quote' | 'order' | 'invoice'>('all');
  // Hover state to add subtle elevation on job cards
  const [hoveredJobId, setHoveredJobId] = useState<number | null>(null);

  const loadProject = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const projectData = await jobsService.getProjectById(projectId);
      setProject(projectData);
    } catch (err: any) {
      setError(err.message || 'Failed to load job');
      console.error('Error loading project:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (isOpen && projectId) {
      loadProject();
    }
  }, [isOpen, projectId, loadProject]);

  // loadProject moved into useCallback above

  const handleCreateJob = async (jobData: any, sections: any[]) => {
    try {
      // Add project_id to job data
      const jobDataWithProject = {
        ...jobData,
        project_id: projectId
      };

      // Create the job
      const newJob = await jobService.createJob(jobDataWithProject);
      
      // Create sections and items if they exist
      if (sections && sections.length > 0) {
        for (const section of sections) {
          if (section.name && section.name.trim()) {
            // Create the section
            const newSection = await jobService.createJobSection(newJob.id, {
              name: section.name,
              display_order: section.display_order || 1
            });
            
            // Add items to the section if they exist
            if (section.items && section.items.length > 0) {
              for (const item of section.items) {
                const itemData: any = {
                  part_number: item.part_number,
                  description: item.description,
                  quantity: item.quantity,
                  unit_price: item.unit_price,
                  is_taxable: item.is_taxable
                };
                
                // If this is a stair configuration, include the stair data
                if (item.part_number === 'STAIR-CONFIG' && item.stair_configuration) {
                  itemData.stair_configuration = item.stair_configuration;
                }
                
                await jobService.addQuoteItem(newJob.id, newSection.id, itemData);
              }
            }
          }
        }
      }
      
      // Refresh project data
      await loadProject();
      setShowJobForm(false);
    } catch (err: any) {
      console.error('Error creating job:', err);
      setError(err.message || 'Failed to create job');
    }
  };

  const handleViewJob = (jobId: number) => {
    setSelectedJob({ jobId });
  };

  const handleViewPDF = (jobId: number, jobTitle: string) => {
    const titleWithProject = project ? `${project.name} — ${jobTitle}` : jobTitle;
    setPdfPreview({ jobId, jobTitle: titleWithProject });
  };

  const handleNextStage = async (job: JobItem) => {
    if (!confirm(`Move job "${job.title}" to the next stage?`)) {
      return;
    }

    try {
      // Keep within known statuses: quote -> order -> invoice
      const nextStatus = job.status === 'quote' ? 'order' :
                        job.status === 'order' ? 'invoice' : 'invoice';
      
      await jobService.updateJob(job.id, { status: nextStatus });
      await loadProject();
    } catch (err: any) {
      console.error('Error updating job status:', err);
      setError(err.message || 'Failed to update job status');
    }
  };

  const titleId = 'project-detail-title';

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getJobNumber = (job: JobItem) => {
    const statusWord = job.status.charAt(0).toUpperCase() + job.status.slice(1);
    return `${statusWord} #${job.id.toString().padStart(4, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <AccessibleModal isOpen={isOpen} onClose={onClose} labelledBy={titleId} overlayClassName="modal-overlay" contentClassName="modal-content modal-large">
        <div className="modal-header">
          <div className="modal-title-section">
            <h2 className="modal-title" id={titleId}>
              <FolderIcon /> {project?.name || 'Loading...'}
            </h2>
            {project && (
              <p className="modal-subtitle">
                {project.customer_name}
                {project.customer_city && project.customer_state && 
                  ` • ${project.customer_city}, ${project.customer_state}`
                }
              </p>
            )}
            {project && (project.address || project.city || project.state || project.zip_code) && (
              <p className="modal-subtitle" aria-label="Job address">
                {project.address ? `${project.address}, ` : ''}
                {[project.city, project.state].filter(Boolean).join(', ')} {project.zip_code || ''}
              </p>
            )}
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close dialog">
            ✕
          </button>
        </div>

        <div className="modal-body">
          {loading && (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading job...</p>
            </div>
          )}

          {error && (
            <div className="error-message" style={{ marginBottom: '20px' }}>
              <AlertTriangleIcon />
              {error}
            </div>
          )}

          {project && !loading && (
            <>
              {/* Project Summary */}
              <div className="project-summary" style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div>
                    <strong>Job Items:</strong> {project.jobs?.length || 0}
                  </div>
                  <div>
                    <strong>Created:</strong> {formatDate(project.created_at)}
                  </div>
                </div>
              </div>

              {/* Job Items Header + Filter */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0 }}>Job Items in this Job</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <select
                    aria-label="Filter job items by status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="select"
                    style={{ minWidth: 160 }}
                  >
                    <option value="all">All Statuses</option>
                    <option value="quote">Quotes</option>
                    <option value="order">Orders</option>
                    <option value="invoice">Invoices</option>
                  </select>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setShowJobForm(true)}
                  >
                    <ClipboardIcon /> Create Job Item
                  </button>
                </div>
              </div>

              {/* Jobs List */}
              {project.jobs && project.jobs.length > 0 ? (
                <div className="jobs-grid">
                  {(project.jobs as JobItem[]).filter(j => statusFilter === 'all' ? true : j.status === statusFilter).map(job => (
                    <div
                      key={job.id}
                      className="job-card"
                      role="button"
                      tabIndex={0}
                      onClick={() => handleViewJob(job.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleViewJob(job.id); }}
                      onMouseEnter={() => setHoveredJobId(job.id)}
                      onMouseLeave={() => setHoveredJobId(null)}
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '12px',
                        backgroundColor: '#ffffff',
                        cursor: 'pointer',
                        transition: 'box-shadow 160ms ease, transform 160ms ease',
                        boxShadow: hoveredJobId === job.id ? '0 8px 20px rgba(2, 6, 23, 0.10)' : '0 1px 2px rgba(2, 6, 23, 0.05)',
                        transform: hoveredJobId === job.id ? 'translateY(-2px)' : 'translateY(0)'
                      }}
                    >
                      <div className="job-header">
                        <div className="job-info">
                          <span className="job-number">{getJobNumber(job)}</span>
                          <h3 className="job-title">{job.title}</h3>
                        </div>
                        <span 
                          className={`job-status status-${job.status}`}
                          style={jobService.getStatusColor(job.status)}
                        >
                          {jobService.formatJobStatus(job.status)}
                        </span>
                      </div>
                      
                      <div className="job-details">
                        <div className="job-detail-row">
                          <span className="detail-label">Total:</span>
                          <span className="detail-value">{jobService.formatCurrency(job.total_amount || 0)}</span>
                        </div>
                        {job.po_number && (
                          <div className="job-detail-row">
                            <span className="detail-label">PO#:</span>
                            <span className="detail-value">{job.po_number}</span>
                          </div>
                        )}
                        {job.delivery_date && (
                          <div className="job-detail-row">
                            <span className="detail-label">Delivery:</span>
                            <span className="detail-value">{formatDate(job.delivery_date)}</span>
                          </div>
                        )}
                        <div className="job-detail-row">
                          <span className="detail-label">Created:</span>
                          <span className="detail-value">{formatDate(job.created_at)}</span>
                        </div>
                      </div>

                      <div className="job-actions">
                        <button 
                          className="action-btn"
                          onClick={(e) => { e.stopPropagation(); handleViewJob(job.id); }}
                          title="View Details"
                        >
                          👁 Details
                        </button>
                        <button 
                          className="action-btn"
                          onClick={(e) => { e.stopPropagation(); handleViewPDF(job.id, job.title); }}
                          title="View PDF"
                        >
                          <FileIcon /> PDF
                        </button>
                        {job.status !== 'invoice' && (
                          <button 
                            className="action-btn action-btn-warning"
                            onClick={(e) => { e.stopPropagation(); handleNextStage(job); }}
                            title="Next Stage"
                          >
                            <ArrowRightIcon width={16} height={16} /> Next
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-jobs" style={{ textAlign: 'center', padding: '40px' }}>
                  <ClipboardIcon width={48} height={48} style={{ opacity: 0.5 }} />
                  <h3>No job items in this job yet</h3>
                  <p>Create your first job item to get started.</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      

      {/* Job Creation Modal */}
      {showJobForm && (
        <JobForm
          onSubmit={handleCreateJob}
          onCancel={() => setShowJobForm(false)}
          projectId={projectId} // Pass project context
        />
      )}

      {/* Job Detail Modal */}
      {selectedJob && (
        <StairConfigurationProvider>
          <JobDetail
            jobId={selectedJob.jobId}
            isOpen={true}
            onClose={() => setSelectedJob(null)}
            projectName={project?.name}
            currentProject={project ?? undefined}
          />
        </StairConfigurationProvider>
      )}

      {/* PDF Preview Modal */}
      {pdfPreview && (
        <JobPDFPreview
          jobId={pdfPreview.jobId}
          jobTitle={pdfPreview.jobTitle}
          isOpen={true}
          onClose={() => setPdfPreview(null)}
        />
      )}
    </AccessibleModal>
  );
};

export default ProjectDetail;
