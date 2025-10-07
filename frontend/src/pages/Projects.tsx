import React, { useState, useEffect } from 'react';
import { jobsService } from '../services/jobsService';
import type { Project as Job } from '../services/projectService';
import type { Customer } from '../services/customerService';
import customerService from '../services/customerService';
import ProjectList from '../components/projects/ProjectList';
import ProjectForm from '../components/projects/ProjectForm';
import ProjectDetail from '../components/projects/ProjectDetail';
import JobDetail from '../components/jobs/JobDetail';
import { StairConfigurationProvider } from '../contexts/StairConfigurationContext';
import EmptyState from '../components/common/EmptyState';
import { SearchIcon, FolderIcon, AlertTriangleIcon } from '../components/common/icons';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '../components/common/ToastProvider';

const Projects: React.FC = () => {
  // Set document title for Jobs (project-level) page
  useEffect(() => {
    document.title = 'Jobs — CraftMart';
  }, []);
  const [projects, setProjects] = useState<Job[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [, setSearchParams] = useSearchParams();
  
  // Modal states
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Job | null>(null);
  const [selectedProject, setSelectedProject] = useState<Job | null>(null);
  const [jobDetail, setJobDetail] = useState<{ jobId: number } | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q') || '';
    if (q) {
      setSearchTerm(q);
      setIsSearching(!!q.trim());
    }
    loadProjects();
    loadCustomers();
  }, []);
  
  // Open Job Detail if navigated with a selected job in location state
  useEffect(() => {
    const state = (window.history.state && (window.history.state as any).usr) as { selectedJobId?: number } | null;
    if (state?.selectedJobId) {
      setJobDetail({ jobId: state.selectedJobId });
      // Clear the state to prevent reopening on refresh
      window.history.replaceState({}, document.title);
    }
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {};
      const q = searchTerm.trim();
      if (q) params.q = q;
      const projectsData = await jobsService.getAllProjects(params);
      setProjects(projectsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load projects');
      console.error('Error loading projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const customersData = await customerService.getAllCustomers();
      setCustomers(customersData);
    } catch (err) {
      console.error('Error loading customers:', err);
    }
  };

  const handleSearch = (query: string) => {
    setSearchTerm(query);
    setIsSearching(!!query.trim());
    setSearchParams(prev => {
      const p = new URLSearchParams(prev);
      if (query.trim()) p.set('q', query); else p.delete('q');
      return p;
    });
  };

  const handleCreateProject = async (projectData: { customer_id: number; name: string; address?: string | null; city?: string | null; state?: string | null; zip_code?: string | null }) => {
    try {
      await jobsService.createProject(projectData);
      await loadProjects();
      setShowProjectForm(false);
      showToast('Job created successfully', { type: 'success' });
    } catch (err: any) {
      console.error('Error creating project:', err);
      setError(err.message || 'Failed to create project');
      showToast(err.message || 'Failed to create project', { type: 'error' });
    }
  };

  const handleCustomerCreate = async (customerData: any) => {
    try {
      const newCustomer = await customerService.createCustomer(customerData);
      setCustomers(prev => [...prev, newCustomer]);
      showToast('Customer created successfully', { type: 'success' });
      return newCustomer; // Return the created customer for auto-selection
    } catch (err: any) {
      console.error('Error creating customer:', err);
      showToast(err.message || 'Failed to create customer', { type: 'error' });
      throw err; // Re-throw to let ProjectForm handle the error state
    }
  };

  const handleEditProject = async (id: number, projectData: { name: string }) => {
    try {
      await jobsService.updateProject(id, projectData);
      await loadProjects();
      setEditingProject(null);
      showToast('Job updated', { type: 'success' });
    } catch (err: any) {
      console.error('Error updating project:', err);
      setError(err.message || 'Failed to update project');
      showToast(err.message || 'Failed to update project', { type: 'error' });
    }
  };

  const handleDeleteProject = async (id: number) => {
    if (!confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return;
    }

    try {
      await jobsService.deleteProject(id);
      await loadProjects();
      showToast('Job deleted', { type: 'success' });
    } catch (err: any) {
      console.error('Error deleting project:', err);
      setError(err.message || 'Failed to delete project');
      showToast(err.message || 'Failed to delete project', { type: 'error' });
    }
  };

  const handleViewProject = (project: Job) => {
    setSelectedProject(project);
  };

  const handleEditProjectClick = (project: Job) => {
    setEditingProject(project);
    setShowProjectForm(true);
  };

  const handleCloseProjectForm = () => {
    setShowProjectForm(false);
    setEditingProject(null);
  };

  const handleCloseProjectDetail = () => {
    setSelectedProject(null);
  };

  // Clear PDF cache (moved from Job Items page)
  const handleClearPDFCache = async () => {
    try {
      const response = await fetch('/api/job-items/cache/pdf', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      if (response.ok) {
        const result = await response.json();
        showToast(result.message || 'PDF cache cleared successfully', { type: 'success' });
      } else {
        showToast('Failed to clear PDF cache', { type: 'error' });
      }
    } catch (error) {
      console.error('Error clearing PDF cache:', error);
      showToast('Failed to clear PDF cache', { type: 'error' });
    }
  };

  if (loading && projects.length === 0) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading projects...</p>
        </div>
      </div>
    );
  }

  // Filter projects based on search
  const filteredProjects = projects.filter(project => {
    if (!isSearching) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      project.name.toLowerCase().includes(searchLower) ||
      project.customer_name?.toLowerCase().includes(searchLower) ||
      project.customer_city?.toLowerCase().includes(searchLower) ||
      project.customer_state?.toLowerCase().includes(searchLower) ||
      (project.address || '').toLowerCase().includes(searchLower) ||
      (project.city || '').toLowerCase().includes(searchLower) ||
      (project.state || '').toLowerCase().includes(searchLower) ||
      (project.zip_code || '').toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="container">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="page-title">Jobs</h1>
          <p className="page-subtitle">Manage customer jobs and their items</p>
        </div>
        <div className="page-actions">
          <button 
            className="btn btn-secondary"
            onClick={handleClearPDFCache}
            title="Clear cached Job PDFs"
          >
            Clear PDF Cache
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => setShowProjectForm(true)}
            disabled={customers.length === 0}
          >
            <span className="nav-icon"><FolderIcon /></span>
            Create Job
          </button>
        </div>
      </div>

      {/* Search Section */}
      <div className="search-section sticky-controls">
        <div className="search-container-large">
          <div className="search-icon-large"><SearchIcon /></div>
          <input
            type="text"
            placeholder="Search jobs by name, customer, or location..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="search-input-large"
            autoFocus
          />
        </div>
        {isSearching && (
          <p className="search-status">Showing search results for "{searchTerm}"</p>
        )}
        {!isSearching && filteredProjects.length > 0 && (
          <p className="search-status">All jobs</p>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="card" style={{marginBottom: '24px', backgroundColor: '#fef2f2', border: '1px solid #fecaca'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: '#b91c1c'}}>
            <AlertTriangleIcon />
            {error}
          </div>
        </div>
      )}

      {/* Projects List */}
      {filteredProjects.length > 0 ? (
        <ProjectList
          projects={filteredProjects}
          isSearching={isSearching}
          onViewProject={handleViewProject}
          onEditProject={handleEditProjectClick}
          onDeleteProject={handleDeleteProject}
          onCreateProject={() => setShowProjectForm(true)}
        />
      ) : (
        <EmptyState
          icon={<FolderIcon />}
          title={isSearching ? 'No jobs found' : 'No jobs yet'}
          description={isSearching ? 'Try adjusting your search terms or create a new job.' : 'Create your first job to start organizing items by customer.'}
          action={!isSearching ? { label: 'Create Job', onClick: () => setShowProjectForm(true) } : undefined}
        />
      )}

      {/* Project Form Modal */}
      {showProjectForm && (
        <ProjectForm
          project={editingProject}
          customers={customers}
          isOpen={showProjectForm}
          onClose={handleCloseProjectForm}
          onSubmit={editingProject ? 
            (data) => handleEditProject(editingProject.id, data) : 
            (data) => handleCreateProject({ customer_id: Number(data.customer_id), name: data.name })
          }
          onCustomerCreate={handleCustomerCreate}
        />
      )}

      {/* Project Detail Modal */}
      {selectedProject && (
        <ProjectDetail
          projectId={selectedProject.id}
          isOpen={true}
          onClose={handleCloseProjectDetail}
        />
      )}

      {/* Job Detail Modal (deep link support) */}
      {jobDetail && (
        <StairConfigurationProvider>
          <JobDetail
            jobId={jobDetail.jobId}
            isOpen={true}
            onClose={() => setJobDetail(null)}
            currentProject={selectedProject || undefined}
          />
        </StairConfigurationProvider>
      )}
    </div>
  );
};

export default Projects;
