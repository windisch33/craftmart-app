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
    } catch (error) {
      console.error('Error creating job:', error);
      // Show more detailed error information
      let errorMessage = 'Failed to create job';
      if (error instanceof Error) {
        errorMessage += ': ' + error.message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage += ': ' + JSON.stringify(error);
      }
      alert(errorMessage);
    } finally {
      setJobFormLoading(false);
    }
  };

  const handleViewPDF = (jobId: number, jobTitle: string) => {
    setPdfPreview({ jobId, jobTitle });
  };

  const handleViewDetails = (jobId: number) => {
    setJobDetail({ jobId });
  };

  const handleNextStage = (job: Job) => {
    // Check if job can advance to next stage
    if (job.status === 'invoice') return; // Already at final stage
    
    // Show confirmation modal
    setConfirmNextStage(job);
  };

  const handleConfirmNextStage = async () => {
    if (!confirmNextStage) return;

    try {
      let nextStatus: 'quote' | 'order' | 'invoice';
      if (confirmNextStage.status === 'quote') nextStatus = 'order';
      else if (confirmNextStage.status === 'order') nextStatus = 'invoice';
      else return; // Already at final stage

      await jobService.updateJob(confirmNextStage.id, { status: nextStatus });
      await fetchData(); // Refresh the jobs list
      setConfirmNextStage(null); // Close confirmation modal
    } catch (error) {
      console.error('Error updating job status:', error);
      alert('Failed to update job status');
    }
  };

  const containerStyle = {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '32px'
  };

  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 20px 25px -5px rgba(0, 0, 0, 0.04)',
    border: '1px solid #f3f4f6',
    transition: 'all 0.3s ease'
  };

  const gradientTitleStyle = {
    fontSize: '3rem',
    fontWeight: 'bold',
    background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: '8px'
  };

  const buttonStyle = {
    backgroundColor: '#3b82f6',
    color: 'white',
    padding: '12px 24px',
    borderRadius: '12px',
    border: 'none',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.39)',
    transition: 'all 0.2s ease'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    fontSize: '16px',
    transition: 'all 0.2s ease',
    outline: 'none'
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
    const statusWord = job.status.charAt(0).toUpperCase() + job.status.slice(1); // Quote, Order, Invoice
    return `${statusWord} #${job.id.toString().padStart(4, '0')}`;
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px'}}>
        <div>
          <h1 style={gradientTitleStyle}>Jobs</h1>
          <p style={{color: '#6b7280', fontSize: '20px', margin: 0}}>Manage quotes, orders, and invoices</p>
        </div>
        <button 
          style={buttonStyle}
          onClick={() => setShowJobForm(true)}
          disabled={loading}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
        >
          <span style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <span style={{fontSize: '20px'}}>📋</span>
            Create Job
          </span>
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
        <div style={{...cardStyle, textAlign: 'center', padding: '48px 24px'}}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f4f6',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{color: '#6b7280'}}>Loading jobs...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div style={{...cardStyle, textAlign: 'center', padding: '48px 24px', backgroundColor: '#fef2f2', borderColor: '#fecaca'}}>
          <div style={{
            width: '64px',
            height: '64px',
            backgroundColor: '#fee2e2',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '24px'
          }}>
            ⚠️
          </div>
          <h3 style={{fontSize: '18px', fontWeight: 'bold', color: '#dc2626', marginBottom: '8px'}}>
            Error Loading Jobs
          </h3>
          <p style={{color: '#991b1b', marginBottom: '24px'}}>
            {error}
          </p>
          <button 
            onClick={() => fetchData()}
            style={{
              ...buttonStyle,
              backgroundColor: '#dc2626'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Jobs Grid */}
      {!loading && !error && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px'
        }}>
        {filteredJobs.map((job) => {
          const statusStyle = getStatusColor(job.status);
          return (
            <div
              key={job.id}
              style={{
                ...cardStyle,
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 10px 60px -15px rgba(0, 0, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 20px 25px -5px rgba(0, 0, 0, 0.04)';
              }}
            >
              {/* Simplified Job Header */}
              <div style={{display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px'}}>
                <div>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#1f2937',
                    margin: '0 0 4px 0'
                  }}>
                    {job.title}
                  </h3>
                  <p style={{fontSize: '16px', color: '#6b7280', margin: '0 0 8px 0'}}>
                    {job.customer_name}
                  </p>
                  <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                    <span style={{fontSize: '14px'}}>📅</span>
                    <span style={{fontSize: '14px', color: '#6b7280'}}>
                      {new Date(job.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <div style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600',
                  backgroundColor: statusStyle.bg,
                  color: statusStyle.color,
                  border: `1px solid ${statusStyle.border}`,
                  textTransform: 'none',
                  whiteSpace: 'nowrap'
                }}>
                  {getJobNumber(job)}
                </div>
              </div>

              {/* Actions */}
              <div style={{display: 'flex', gap: '8px'}}>
                <button 
                  onClick={() => handleViewDetails(job.id)}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }} 
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
                >
                  👁️ View Details
                </button>
                <button 
                  onClick={() => handleViewPDF(job.id, job.title)}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }} 
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                >
                  📄 View PDF
                </button>
                {job.status !== 'invoice' && (
                  <button 
                    onClick={() => handleNextStage(job)}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      backgroundColor: 'white',
                      color: '#374151',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }} 
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#10b981';
                      e.currentTarget.style.backgroundColor = '#f0fdf4';
                    }} 
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.backgroundColor = 'white';
                    }}
                  >
                    ➡️ Next Stage
                  </button>
                )}
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredJobs.length === 0 && (
        <div style={{...cardStyle, textAlign: 'center', padding: '48px 24px'}}>
          <div style={{
            width: '64px',
            height: '64px',
            backgroundColor: '#f3f4f6',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '24px'
          }}>
            📋
          </div>
          <h3 style={{fontSize: '18px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px'}}>
            {getActiveFiltersCount() > 0 ? 'No jobs found' : 'No jobs yet'}
          </h3>
          <p style={{color: '#6b7280', marginBottom: '24px'}}>
            {getActiveFiltersCount() > 0
              ? 'Try adjusting your search criteria or filters' 
              : 'Get started by creating your first job'}
          </p>
          <button 
            onClick={() => setShowJobForm(true)}
            style={buttonStyle}
          >
            <span style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
              <span style={{fontSize: '20px'}}>📋</span>
              Create Job
            </span>
          </button>
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
        <JobDetail
          jobId={jobDetail.jobId}
          isOpen={true}
          onClose={() => setJobDetail(null)}
        />
      )}

      {/* Next Stage Confirmation Modal */}
      {confirmNextStage && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.25)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#fef3c7',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '24px'
            }}>
              ⚠️
            </div>
            <h3 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '12px'
            }}>
              Confirm Status Change
            </h3>
            <p style={{
              color: '#6b7280',
              marginBottom: '24px',
              lineHeight: '1.5'
            }}>
              Are you sure you want to advance "{confirmNextStage.title}" from{' '}
              <strong>{confirmNextStage.status}</strong> to{' '}
              <strong>
                {confirmNextStage.status === 'quote' ? 'order' : 
                 confirmNextStage.status === 'order' ? 'invoice' : 'completed'}
              </strong>?
            </p>
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => setConfirmNextStage(null)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'white',
                  color: '#374151',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmNextStage}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default Jobs;