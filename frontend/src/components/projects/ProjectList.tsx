import React from 'react';
import { jobsService } from '../../services/jobsService';
import type { Project as Job } from '../../services/projectService';
import { FolderIcon, EditIcon, TrashIcon, EyeIcon } from '../common/icons';

interface ProjectListProps {
  projects: Job[];
  isSearching: boolean;
  onViewProject: (project: Job) => void;
  onEditProject: (project: Job) => void;
  onDeleteProject: (id: number) => void;
  onCreateProject: () => void;
}

const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  isSearching,
  onViewProject,
  onEditProject,
  onDeleteProject,
  onCreateProject
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (projects.length === 0) {
    return (
      <div className="empty-customers">
        <div className="empty-icon"><FolderIcon /></div>
        <h2 className="empty-title">
          {isSearching ? 'No jobs found' : 'No jobs yet'}
        </h2>
        <p className="empty-desc">
          {isSearching 
            ? 'Try adjusting your search terms or create a new job.'
            : 'Create your first job to start organizing items by customer.'}
        </p>
        {!isSearching && (
          <button className="btn btn-primary" onClick={onCreateProject}>
            <span className="nav-icon"><FolderIcon /></span>
            Create Your First Job
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="customers-grid">
      {projects.map(project => (
        <div
          key={project.id}
          className="customer-card"
          onClick={() => onViewProject(project)}
          title="View Job"
        >
          <div className="customer-header">
            <div className="customer-info">
              <h3 className="customer-name">{project.name}</h3>
              <p className="customer-location">
                {project.customer_name}
                {project.customer_city && project.customer_state && 
                  ` • ${project.customer_city}, ${project.customer_state}`
                }
              </p>
            </div>
          </div>

          <div className="customer-contact">
            <div className="contact-item">
              <span className="contact-icon"><FolderIcon /></span>
              <span>{project.job_count || 0} job item{(project.job_count || 0) === 1 ? '' : 's'}</span>
            </div>
            {(project.total_value || 0) > 0 && (
              <div className="contact-item">
                <span className="contact-icon">$</span>
                <span>{jobsService.formatCurrency(project.total_value || 0)}</span>
              </div>
            )}
            <div className="contact-item">
              <span className="contact-icon">📅</span>
              <span>Created {formatDate(project.created_at)}</span>
            </div>
          </div>

          <div className="customer-actions">
            <button 
              className="action-btn" 
              onClick={(e) => { e.stopPropagation(); onViewProject(project); }}
              title="View Job"
            >
              <span className="contact-icon"><EyeIcon /></span> View
            </button>
            <button 
              className="action-btn" 
              onClick={(e) => { e.stopPropagation(); onEditProject(project); }}
              title="Edit Job"
            >
              <span className="contact-icon"><EditIcon /></span> Edit
            </button>
            {(project.job_count || 0) === 0 && (
              <button 
                className="action-btn action-btn-danger" 
                onClick={(e) => { e.stopPropagation(); onDeleteProject(project.id); }}
                title="Delete Job"
              >
                <span className="contact-icon"><TrashIcon /></span> Delete
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProjectList;
