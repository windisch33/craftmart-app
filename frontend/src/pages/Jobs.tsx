import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import jobService from '../services/jobService';
import salesmanService from '../services/salesmanService';
import type { Job } from '../services/jobService';
import type { Salesman } from '../services/salesmanService';
import JobForm from '../components/jobs/JobForm';
import JobPDFPreview from '../components/jobs/JobPDFPreview';
import JobDetail from '../components/jobs/JobDetail';
import FilterPanel, { type FilterCriteria } from '../components/jobs/FilterPanel';
import { StairConfigurationProvider } from '../contexts/StairConfigurationContext';
import '../styles/common.css';
import './Jobs.css';

const Jobs: React.FC = () => {
  const location = useLocation();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showJobForm, setShowJobForm] = useState(false);
  const [jobFormLoading, setJobFormLoading] = useState(false);
  const [pdfPreview, setPdfPreview] = useState<{ jobId: number; jobTitle: string } | null>(null);
  const [jobDetail, setJobDetail] = useState<{ jobId: number } | null>(null);
  const [confirmNextStage, setConfirmNextStage] = useState<Job | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Filter state for advanced filters
  const [filterCriteria, setFilterCriteria] = useState<FilterCriteria>({
    status: [],
    salesman: [],
    dateRange: null,
    amountRange: null,
    sortBy: 'updated_at',
    sortOrder: 'desc'
  });

  // Load recent jobs on mount
  useEffect(() => {
    loadRecentJobs();
    loadSalesmen();
  }, []);

  // Check for pre-selected job from navigation state
  useEffect(() => {
    const state = location.state as { selectedJobId?: number } | null;
    if (state?.selectedJobId) {
      setJobDetail({ jobId: state.selectedJobId });
      // Clear the state to prevent reopening on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const loadRecentJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const recentJobs = await jobService.getRecentJobs();
      setJobs(recentJobs);
    } catch (err) {
      setError('Failed to load recent jobs');
      console.error('Error loading recent jobs:', err);
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

  const handleSearch = async (query: string) => {
    setSearchTerm(query);
    
    if (!query.trim()) {
      // If search is cleared, show recent jobs again
      setIsSearching(false);
      await loadRecentJobs();
      return;
    }

    try {
      setError(null);
      setIsSearching(true);
      setLoading(true);
      
      const filters = {
        searchTerm: query,
        searchField: 'all',
        searchOperator: 'contains',
        sortBy: 'updated_at',
        sortOrder: 'desc' as const
      };
      
      const searchResults = await jobService.getAllJobs(filters);
      setJobs(searchResults);
    } catch (err: any) {
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAdvancedFilter = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters = {
        statusFilter: filterCriteria.status,
        salesmanFilter: filterCriteria.salesman,
        dateRangeType: filterCriteria.dateRange?.type,
        dateRangeStart: filterCriteria.dateRange?.startDate,
        dateRangeEnd: filterCriteria.dateRange?.endDate,
        amountRangeType: filterCriteria.amountRange?.type,
        amountRangeMin: filterCriteria.amountRange?.min,
        amountRangeMax: filterCriteria.amountRange?.max,
        sortBy: filterCriteria.sortBy,
        sortOrder: filterCriteria.sortOrder,
        searchTerm: searchTerm || undefined,
        searchField: searchTerm ? 'all' : undefined,
        searchOperator: searchTerm ? 'contains' : undefined
      };

      const filteredJobs = await jobService.getAllJobs(filters);
      setJobs(filteredJobs);
    } catch (err) {
      setError('Failed to apply filters');
      console.error('Error applying filters:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (criteria: FilterCriteria) => {
    setFilterCriteria(criteria);
  };

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
      
      // Refresh the jobs list
      if (!isSearching && !showAdvancedFilters) {
        await loadRecentJobs();
      } else {
        await handleSearch(searchTerm);
      }
      
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
      
      // Refresh the jobs list
      if (!isSearching) {
        await loadRecentJobs();
      } else {
        await handleSearch(searchTerm);
      }
      
      setConfirmNextStage(null);
    } catch (err) {
      console.error('Error updating job status:', err);
      setError('Failed to update job status');
    }
  };

  const getStatusColor = (status: string) => {
    return jobService.getStatusColor(status);
  };

  const getJobNumber = (job: Job) => {
    const statusWord = job.status.charAt(0).toUpperCase() + job.status.slice(1);
    return `${statusWord} #${job.id.toString().padStart(4, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleRefresh = async () => {
    if (!isSearching && !showAdvancedFilters) {
      await loadRecentJobs();
    } else if (isSearching) {
      await handleSearch(searchTerm);
    } else {
      await handleAdvancedFilter();
    }
  };

  const handleClearPDFCache = async () => {
    try {
      const response = await fetch('/api/jobs/cache/pdf', { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(result.message || 'PDF cache cleared successfully');
      } else {
        alert('Failed to clear PDF cache');
      }
    } catch (error) {
      console.error('Error clearing PDF cache:', error);
      alert('Failed to clear PDF cache');
    }
  };

  if (loading && jobs.length === 0) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="gradient-title">Jobs</h1>
          <p className="page-subtitle">Search and manage quotes, orders, and invoices</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn btn-secondary"
            onClick={handleRefresh}
            title="Refresh jobs list"
          >
            <span>🔄</span>
            Refresh
          </button>
          <button 
            className="btn btn-secondary"
            onClick={handleClearPDFCache}
            title="Clear PDF cache"
          >
            <span>🗑️</span>
            Clear Cache
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => setShowJobForm(true)}
          >
            <span>📋</span>
            Create Job
          </button>
        </div>
      </div>

      {/* Large Search Bar */}
      <div className="search-section">
        <div className="search-container-large">
          <div className="search-icon-large">🔍</div>
          <input
            type="text"
            placeholder="Search jobs by title, customer, job number, or salesman..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="search-input-large"
            autoFocus
          />
        </div>
        {isSearching && (
          <p className="search-status">Showing search results for "{searchTerm}"</p>
        )}
        {!isSearching && jobs.length > 0 && (
          <p className="search-status">Recently updated jobs</p>
        )}
        
        {/* Advanced Filters Toggle */}
        <div className="advanced-filters-toggle">
          <button
            className="btn btn-secondary"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <span>{showAdvancedFilters ? '🔽' : '▶️'}</span>
            Advanced Filters
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && (
        <div className="advanced-filters-panel">
          <FilterPanel
            onFilterChange={handleFilterChange}
            salesmenOptions={salesmen.map(s => ({ 
              id: s.id.toString(), 
              name: salesmanService.formatSalesmanName(s) 
            }))}
            isLoading={loading}
            activeFiltersCount={0}
          />
          <div className="filter-actions">
            <button
              className="btn btn-primary"
              onClick={handleAdvancedFilter}
            >
              Apply Filters
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setFilterCriteria({
                  status: [],
                  salesman: [],
                  dateRange: null,
                  amountRange: null,
                  sortBy: 'updated_at',
                  sortOrder: 'desc'
                });
                setShowAdvancedFilters(false);
                loadRecentJobs();
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="card" style={{marginBottom: '24px', backgroundColor: '#fef2f2', border: '1px solid #fecaca'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: '#b91c1c'}}>
            <span>⚠️</span>
            {error}
          </div>
        </div>
      )}

      {/* Jobs Grid */}
      {!loading && jobs.length > 0 ? (
        <div className="jobs-grid">
          {jobs.map(job => (
            <div key={job.id} className="job-card">
              <div className="job-header">
                <div className="job-info">
                  <h3 className="job-title">{job.title}</h3>
                  <p className="job-number">{getJobNumber(job)}</p>
                  <p className="job-customer">{job.customer_name}</p>
                </div>
                <div className="job-status">
                  <span 
                    className="status-badge"
                    style={{
                      backgroundColor: getStatusColor(job.status).bg,
                      color: getStatusColor(job.status).color
                    }}
                  >
                    {job.status}
                  </span>
                </div>
              </div>

              <div className="job-details">
                <div className="detail-row">
                  <span className="detail-label">📅 Created:</span>
                  <span className="detail-value">{formatDate(job.created_at)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">🔄 Updated:</span>
                  <span className="detail-value">{formatDate(job.updated_at)}</span>
                </div>
                {job.delivery_date && (
                  <div className="detail-row">
                    <span className="detail-label">🚚 Delivery:</span>
                    <span className="detail-value">{formatDate(job.delivery_date)}</span>
                  </div>
                )}
                {job.salesman_name && (
                  <div className="detail-row">
                    <span className="detail-label">👤 Salesman:</span>
                    <span className="detail-value">{job.salesman_name}</span>
                  </div>
                )}
              </div>

              <div className="job-amount">
                <div className="amount-label">Total Amount</div>
                <div className="amount-value">{jobService.formatCurrency(job.total_amount)}</div>
              </div>

              <div className="job-actions">
                <button 
                  className="action-btn action-btn-primary" 
                  onClick={() => handleViewDetails(job.id)}
                  title="View Details"
                >
                  👁️ View
                </button>
                <button 
                  className="action-btn action-btn-info" 
                  onClick={() => handleViewPDF(job.id, job.title)}
                  title="View PDF"
                >
                  📄 PDF
                </button>
                {job.status !== 'invoice' && (
                  <button 
                    className="action-btn action-btn-warning" 
                    onClick={() => handleNextStage(job)}
                    title="Next Stage"
                  >
                    ➡️ Next
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-jobs">
          <div className="empty-icon">📋</div>
          <h2 className="empty-title">
            {isSearching ? 'No jobs found' : 'No recent jobs'}
          </h2>
          <p className="empty-desc">
            {isSearching 
              ? 'Try adjusting your search terms or filters.'
              : 'Start by creating a new job or search for existing ones.'}
          </p>
          {!isSearching && (
            <button className="btn btn-primary" onClick={() => setShowJobForm(true)}>
              <span>📋</span>
              Create Your First Job
            </button>
          )}
        </div>
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
        <StairConfigurationProvider>
          <JobDetail
            jobId={jobDetail.jobId}
            isOpen={true}
            onClose={() => setJobDetail(null)}
          />
        </StairConfigurationProvider>
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