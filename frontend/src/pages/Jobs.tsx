import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import jobService from '../services/jobService';
import salesmanService from '../services/salesmanService';
import type { Job } from '../services/jobService';
import type { Salesman } from '../services/salesmanService';
import JobForm from '../components/jobs/JobForm';
import JobPDFPreview from '../components/jobs/JobPDFPreview';
import JobDetail from '../components/jobs/JobDetail';
import { type FilterCriteria } from '../components/jobs/FilterPanel';
import { StairConfigurationProvider } from '../contexts/StairConfigurationContext';
import '../styles/common.css';
import './Jobs.css';
import JobsHeader from './jobs/JobsHeader';
import JobsSearchSection from './jobs/JobsSearchSection';
import JobsAdvancedFiltersPanel from './jobs/JobsAdvancedFiltersPanel';
import JobsErrorBanner from './jobs/JobsErrorBanner';
import JobsGrid from './jobs/JobsGrid';
import JobsEmptyState from './jobs/JobsEmptyState';
import NextStageConfirmModal from './jobs/NextStageConfirmModal';

const Jobs: React.FC = () => {
  const location = useLocation();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showJobForm, setShowJobForm] = useState(false);
  const [_jobFormLoading, setJobFormLoading] = useState(false);
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
      const nextStatus = confirmNextStage.status === 'quote' ? 'order' : 'invoice';
      
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
      <JobsHeader 
        onRefresh={handleRefresh}
        onClearPDFCache={handleClearPDFCache}
        onCreateJob={() => setShowJobForm(true)}
      />

      {/* Large Search Bar */}
      <JobsSearchSection
        searchTerm={searchTerm}
        onSearch={handleSearch}
        isSearching={isSearching}
        showAdvancedFilters={showAdvancedFilters}
        onToggleAdvancedFilters={() => setShowAdvancedFilters(!showAdvancedFilters)}
      />

      {/* Advanced Filters Panel */}
      <JobsAdvancedFiltersPanel
        visible={showAdvancedFilters}
        salesmenOptions={salesmen.map(s => ({ id: s.id.toString(), name: salesmanService.formatSalesmanName(s) }))}
        isLoading={loading}
        onFilterChange={handleFilterChange}
        onApplyFilters={handleAdvancedFilter}
        onClearFilters={() => {
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
      />

      {/* Error Message */}
      {error && <JobsErrorBanner message={error} />}

      {/* Jobs Grid */}
      {!loading && jobs.length > 0 ? (
        <JobsGrid
          jobs={jobs}
          onViewDetails={handleViewDetails}
          onViewPDF={handleViewPDF}
          onNextStage={handleNextStage}
          getStatusColor={getStatusColor}
          getJobNumber={getJobNumber}
          formatDate={formatDate}
          formatCurrency={jobService.formatCurrency}
        />
      ) : (
        <JobsEmptyState isSearching={isSearching} onCreateJob={() => setShowJobForm(true)} />
      )}

      {/* Job Creation Modal */}
      {showJobForm && (
        <JobForm
          onSubmit={handleCreateJob}
          onCancel={() => setShowJobForm(false)}
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
        <NextStageConfirmModal
          job={confirmNextStage}
          onCancel={() => setConfirmNextStage(null)}
          onConfirm={handleConfirmNextStage}
        />
      )}
    </div>
  );
};

export default Jobs;
