import React, { useState, useEffect } from 'react';
import { projectService } from '../services/projectService';
import type { Project } from '../services/projectService';
import type { Customer } from '../services/customerService';
import customerService from '../services/customerService';
import ProjectList from '../components/projects/ProjectList';
import ProjectForm from '../components/projects/ProjectForm';
import ProjectDetail from '../components/projects/ProjectDetail';
import EmptyState from '../components/common/EmptyState';
import { SearchIcon, FolderIcon, AlertTriangleIcon } from '../components/common/icons';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '../components/common/ToastProvider';

const Projects: React.FC = () => {
  // Set document title for Jobs (project-level) page
  useEffect(() => {
    document.title = 'Jobs — CraftMart';
  }, []);
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [, setSearchParams] = useSearchParams();
  
  // Modal states
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
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

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const projectsData = await projectService.getAllProjects();
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

  const handleCreateProject = async (projectData: { customer_id: number; name: string }) => {
    try {
      await projectService.createProject(projectData);
      await loadProjects();
      setShowProjectForm(false);
      showToast('Job created successfully', { type: 'success' });
    } catch (err: any) {
      console.error('Error creating project:', err);
      setError(err.message || 'Failed to create project');
      showToast(err.message || 'Failed to create project', { type: 'error' });
    }
  };

  const handleEditProject = async (id: number, projectData: { name: string }) => {
    try {
      await projectService.updateProject(id, projectData);
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
      await projectService.deleteProject(id);
      await loadProjects();
      showToast('Job deleted', { type: 'success' });
    } catch (err: any) {
      console.error('Error deleting project:', err);
      setError(err.message || 'Failed to delete project');
      showToast(err.message || 'Failed to delete project', { type: 'error' });
    }
  };

  const handleViewProject = (project: Project) => {
    setSelectedProject(project);
  };

  const handleEditProjectClick = (project: Project) => {
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
      project.customer_state?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="container">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-title-section">
            <h1 className="page-title">Jobs</h1>
            <p className="page-subtitle">Manage customer jobs and their items</p>
          </div>
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
    </div>
  );
};

export default Projects;
