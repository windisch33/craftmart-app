import React, { useState, useEffect } from 'react';
import jobService from '../services/jobService';
import salesmanService from '../services/salesmanService';
import type { Job } from '../services/jobService';
import type { Salesman } from '../services/salesmanService';
import JobForm from '../components/jobs/JobForm';
import JobPDFPreview from '../components/jobs/JobPDFPreview';
import JobDetail from '../components/jobs/JobDetail';
import AdvancedSearchBar, { type SearchCriteria } from '../components/jobs/AdvancedSearchBar';
import FilterPanel, { type FilterCriteria } from '../components/jobs/FilterPanel';
import { SelectableList } from '../components/common/SelectableList';
import '../styles/common.css';
import './Jobs.css';

const Jobs: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [salesmanFilter, setSalesmanFilter] = useState('all');
  const [showJobForm, setShowJobForm] = useState(false);
  const [jobFormLoading, setJobFormLoading] = useState(false);
  const [pdfPreview, setPdfPreview] = useState<{ jobId: number; jobTitle: string } | null>(null);
  const [jobDetail, setJobDetail] = useState<{ jobId: number } | null>(null);
  const [confirmNextStage, setConfirmNextStage] = useState<Job | null>(null);
  
  // Advanced search and filter state
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({
    searchTerm: '',
    searchField: 'title',
    searchOperator: 'contains'
  });
  const [filterCriteria, setFilterCriteria] = useState<FilterCriteria>({
    status: [],
    salesman: [],
    dateRange: null,
    amountRange: null,
    sortBy: 'created_date',
    sortOrder: 'desc'
  });

  useEffect(() => {
    fetchData();
  }, [statusFilter, salesmanFilter, searchCriteria, filterCriteria]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Build filters from both legacy and advanced criteria
      const filters: any = {
        // Legacy filters (for backward compatibility)
        status: statusFilter !== 'all' ? statusFilter : undefined,
        salesman_id: salesmanFilter !== 'all' ? parseInt(salesmanFilter) : undefined,
        
        // Advanced search parameters
        searchTerm: searchCriteria.searchTerm || undefined,
        searchField: searchCriteria.searchField !== 'title' ? searchCriteria.searchField : undefined,
        searchOperator: searchCriteria.searchOperator !== 'contains' ? searchCriteria.searchOperator : undefined,
        
        // Filter parameters
        statusFilter: filterCriteria.status.length > 0 ? filterCriteria.status : undefined,
        salesmanFilter: filterCriteria.salesman.length > 0 ? filterCriteria.salesman : undefined,
        dateRangeType: filterCriteria.dateRange?.type,
        dateRangeStart: filterCriteria.dateRange?.startDate,
        dateRangeEnd: filterCriteria.dateRange?.endDate,
        amountRangeType: filterCriteria.amountRange?.type,
        amountRangeMin: filterCriteria.amountRange?.min,
        amountRangeMax: filterCriteria.amountRange?.max,
        
        // Sort parameters
        sortBy: filterCriteria.sortBy,
        sortOrder: filterCriteria.sortOrder
      };

      const [jobsData, salesmenData] = await Promise.all([
        jobService.getAllJobs(filters),
        salesmanService.getAllSalesmen()
      ]);

      setJobs(jobsData);
      setSalesmen(salesmenData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch jobs');
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (criteria: SearchCriteria) => {
    setSearchCriteria(criteria);
  };

  const handleFilterChange = (criteria: FilterCriteria) => {
    setFilterCriteria(criteria);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchCriteria.searchTerm) count++;
    if (filterCriteria.status.length > 0) count++;
    if (filterCriteria.salesman.length > 0) count++;
    if (filterCriteria.dateRange) count++;
    if (filterCriteria.amountRange) count++;
    return count;
  };

  // All filtering is now done server-side, so we use jobs directly
  const filteredJobs = jobs;

  const handleCreateJob = async (jobData: any, sections: any[]) => {
    try {
      setJobFormLoading(true);
      
      // Create the job first
      const newJob = await jobService.createJob(jobData);
      
      // Create sections and items if they exist
      if (sections && sections.length > 0) {
        for (const section of sections) {
          if (section.name && section.name.trim()) {
            // Create the section
            const newSection = await jobService.createJobSection(newJob.id, {
              name: section.name,
              description: section.description,
              display_order: section.display_order || 1,
              is_labor_section: section.is_labor_section || false,
              is_misc_section: section.is_misc_section || false
            });
            
            // Add items to the section if they exist
            if (section.items && section.items.length > 0) {
              for (const item of section.items) {
                await jobService.addQuoteItem(newJob.id, newSection.id, {
                  part_number: item.part_number,
                  description: item.description,
                  quantity: item.quantity,
                  unit_price: item.unit_price,
                  is_taxable: item.is_taxable
                });
              }
            }
          }
        }
      }
      
      await fetchData(); // Refresh the jobs list
      setShowJobForm(false);
    } catch (err) {
      console.error('Error creating job:', err);
      setError('Failed to create job');
    } finally {
      setJobFormLoading(false);
    }
  };

  const handleViewDetails = (jobId: number) => {
    setJobDetail({ jobId });
  };

  const handleViewPDF = (jobId: number, jobTitle: string) => {
    setPdfPreview({ jobId, jobTitle });
  };

  const handleNextStage = (job: Job) => {
    setConfirmNextStage(job);
  };

  const handleConfirmNextStage = async () => {
    if (!confirmNextStage) return;

    try {
      const nextStatus = confirmNextStage.status === 'quote' ? 'order' : 
                        confirmNextStage.status === 'order' ? 'invoice' : 'completed';
      
      await jobService.updateJob(confirmNextStage.id, {
        status: nextStatus
      });
      
      await fetchData(); // Refresh the jobs list
      setConfirmNextStage(null);
    } catch (err) {
      console.error('Error updating job status:', err);
      setError('Failed to update job status');
    }
  };

  const handleBulkAction = (action: string, selectedJobs: Job[]) => {
    switch (action) {
      case 'export':
        // Export selected jobs to CSV
        const csvContent = [
          ['Job Number', 'Title', 'Customer', 'Status', 'Created Date', 'Delivery Date'],
          ...selectedJobs.map(job => [
            getJobNumber(job),
            job.title,
            job.customer_name,
            job.status,
            new Date(job.created_at).toLocaleDateString(),
            job.delivery_date ? new Date(job.delivery_date).toLocaleDateString() : 'Not set'
          ])
        ].map(row => row.join(',')).join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'jobs.csv';
        a.click();
        URL.revokeObjectURL(url);
        break;
        
      case 'bulk_next_stage':
        // Bulk status progression for jobs that can advance
        const eligibleJobs = selectedJobs.filter(job => job.status !== 'invoice');
        if (eligibleJobs.length > 0) {
          if (window.confirm(`Advance ${eligibleJobs.length} job(s) to the next stage?`)) {
            Promise.all(
              eligibleJobs.map(job => {
                const nextStatus = job.status === 'quote' ? 'order' : 'invoice';
                return jobService.updateJob(job.id, { status: nextStatus });
              })
            ).then(() => {
              fetchData();
            }).catch(err => {
              console.error('Error updating job statuses:', err);
              setError('Failed to update job statuses');
            });
          }
        }
        break;
    }
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

  const getJobNumber = (job: Job) => {
    const statusWord = job.status.charAt(0).toUpperCase() + job.status.slice(1);
    return `${statusWord} #${job.id.toString().padStart(4, '0')}`;
  };

  const columns = [
    {
      key: 'job_info',
      label: 'Job Info',
      width: '40%',
      render: (job: Job) => (
        <div>
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>{job.title}</div>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '2px' }}>
            {job.customer_name}
          </div>
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>
            {getJobNumber(job)}
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      width: '20%',
      render: (job: Job) => {
        const statusStyle = getStatusColor(job.status);
        return (
          <span style={{
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 600,
            backgroundColor: statusStyle.bg,
            color: statusStyle.color,
            border: `1px solid ${statusStyle.border}`,
            textTransform: 'capitalize'
          }}>
            {job.status}
          </span>
        );
      }
    },
    {
      key: 'dates',
      label: 'Dates',
      width: '40%',
      render: (job: Job) => (
        <div>
          <div style={{ fontSize: '14px', marginBottom: '2px' }}>
            Created: {new Date(job.created_at).toLocaleDateString()}
          </div>
          {job.delivery_date && (
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              Delivery: {new Date(job.delivery_date).toLocaleDateString()}
            </div>
          )}
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>
            Updated: {new Date(job.updated_at).toLocaleDateString()}
          </div>
        </div>
      )
    }
  ];

  // Custom render function for job rows to include special actions
  const renderJobRow = (job: Job, isSelected: boolean, toggleSelection: (id: string | number) => void) => {
    const statusStyle = getStatusColor(job.status);
    
    return (
      <div
        key={job.id}
        className={`list-row ${isSelected ? 'selected' : ''}`}
        style={{ position: 'relative' }}
        onClick={(e) => {
          if (!(e.target as HTMLElement).closest('.row-actions')) {
            toggleSelection(job.id);
          }
        }}
      >
        <div className="list-cell checkbox-cell">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleSelection(job.id)}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Select job ${job.id}`}
          />
        </div>
        
        {columns.map(column => (
          <div 
            key={column.key} 
            className="list-cell"
            style={{ width: column.width }}
          >
            {column.render(job)}
          </div>
        ))}
        
        <div className="list-cell actions-cell">
          <div className="row-actions job-actions">
            <button
              className="row-action-button view"
              onClick={(e) => {
                e.stopPropagation();
                handleViewDetails(job.id);
              }}
              title="View Details"
            >
              👁️
            </button>
            <button
              className="row-action-button pdf"
              onClick={(e) => {
                e.stopPropagation();
                handleViewPDF(job.id, job.title);
              }}
              title="View PDF"
            >
              📄
            </button>
            {job.status !== 'invoice' && (
              <button
                className="row-action-button next-stage"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextStage(job);
                }}
                title="Next Stage"
              >
                ➡️
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="gradient-title">Jobs</h1>
          <p className="page-subtitle">Manage quotes, orders, and invoices</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowJobForm(true)}
          disabled={loading}
        >
          <span>📋</span>
          Create Job
        </button>
      </div>

      {/* Advanced Search */}
      <AdvancedSearchBar
        onSearchChange={handleSearchChange}
        totalResults={filteredJobs.length}
        isLoading={loading}
      />

      {/* Advanced Filters */}
      <FilterPanel
        onFilterChange={handleFilterChange}
        salesmenOptions={salesmen.map(s => ({ 
          id: s.id.toString(), 
          name: salesmanService.formatSalesmanName(s) 
        }))}
        isLoading={loading}
        activeFiltersCount={getActiveFiltersCount()}
      />

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading jobs...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Error Loading Jobs</h3>
          <p>{error}</p>
          <button 
            onClick={() => fetchData()}
            className="btn btn-primary"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Jobs List */}
      {!loading && !error && (
        <SelectableList
          items={filteredJobs}
          columns={columns}
          getItemId={(job) => job.id}
          renderItem={renderJobRow}
          onBulkAction={handleBulkAction}
          bulkActions={[
            { label: 'Export', action: 'export', icon: '📥' },
            { label: 'Next Stage', action: 'bulk_next_stage', icon: '➡️' }
          ]}
          emptyMessage={
            getActiveFiltersCount() > 0
              ? 'No jobs found. Try adjusting your search criteria or filters.' 
              : 'No jobs yet. Get started by creating your first job.'
          }
        />
      )}

      {/* Job Creation Modal */}
      {showJobForm && (
        <JobForm
          onSubmit={handleCreateJob}
          onCancel={() => setShowJobForm(false)}
          isLoading={jobFormLoading}
        />
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

      {/* Job Detail Modal */}
      {jobDetail && (
        <JobDetail
          jobId={jobDetail.jobId}
          isOpen={true}
          onClose={() => setJobDetail(null)}
        />
      )}

      {/* Next Stage Confirmation Modal */}
      {confirmNextStage && (
        <div className="modal-overlay">
          <div className="modal confirmation-modal">
            <div className="confirmation-icon">⚠️</div>
            <h3>Confirm Status Change</h3>
            <p>
              Are you sure you want to advance "{confirmNextStage.title}" from{' '}
              <strong>{confirmNextStage.status}</strong> to{' '}
              <strong>
                {confirmNextStage.status === 'quote' ? 'order' : 
                 confirmNextStage.status === 'order' ? 'invoice' : 'completed'}
              </strong>?
            </p>
            <div className="modal-actions">
              <button
                onClick={() => setConfirmNextStage(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmNextStage}
                className="btn btn-primary"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Jobs;