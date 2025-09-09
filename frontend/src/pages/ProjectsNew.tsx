import React, { useState } from 'react';

// WORKAROUND: Inline interfaces due to critical module import issue
// See CRITICAL_ISSUE_REPORT.md for details

interface Project {
  id: number;
  customer_id: number;
  name: string;
  created_at: string;
  updated_at: string;
  customer_name?: string;
  customer_city?: string;
  customer_state?: string;
  job_count?: number;
  total_value?: number;
}

interface Customer {
  id: number;
  name: string;
  city?: string;
  state?: string;
  email?: string;
  phone?: string;
}

const Projects: React.FC = () => {
  const [projects] = useState<Project[]>([]);
  const [_customers, setCustomers] = useState<Customer[]>([]);
  const [loading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Inline service functions (workaround for import issues)
  // Note: projects are currently mocked inline for this view

  const loadCustomers = async () => {
    try {
      // TODO: Replace with actual API call
      const mockCustomers: Customer[] = [];
      setCustomers(mockCustomers);
    } catch (err) {
      console.error('Error loading customers:', err);
    }
  };

  const handleSearch = (query: string) => {
    setSearchTerm(query);
  };

  // Filter projects based on search
  const filteredProjects = projects.filter(project => {
    if (!searchTerm.trim()) return true;
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
            <h1 className="page-title">Projects</h1>
            <p className="page-subtitle">Manage customer projects and their jobs</p>
          </div>
          <button 
            className="btn btn-primary"
            onClick={loadCustomers}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span>📁</span>
            Create Project
          </button>
        </div>
      </div>

      {/* Search Section */}
      <div className="search-section">
        <div className="search-container-large">
          <div className="search-icon-large">🔍</div>
          <input
            type="text"
            placeholder="Search projects by name, customer, or location..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="search-input-large"
          />
        </div>
        {searchTerm && (
          <p className="search-status">Showing search results for "{searchTerm}"</p>
        )}
        {!searchTerm && filteredProjects.length > 0 && (
          <p className="search-status">All projects</p>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="card" style={{marginBottom: '24px', backgroundColor: '#fef2f2', border: '1px solid #fecaca'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: '#b91c1c'}}>
            ⚠️ {error}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading projects...</p>
        </div>
      ) : (
        /* Projects List */
        <div className="card">
          <div className="card-header">
            <h2>Projects ({filteredProjects.length})</h2>
          </div>
          <div className="card-content">
            {filteredProjects.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <p style={{ fontSize: '18px', marginBottom: '12px' }}>📁</p>
                <p style={{ fontSize: '16px', marginBottom: '8px' }}>No projects found</p>
                <p style={{ fontSize: '14px' }}>Create your first project to get started</p>
                <button 
                  className="btn btn-primary" 
                  style={{ marginTop: '16px' }}
                  onClick={() => setError('Create Project functionality will be implemented when backend API is ready')}
                >
                  Create First Project
                </button>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Project Name</th>
                      <th>Customer</th>
                      <th>Location</th>
                      <th>Jobs</th>
                      <th>Total Value</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.map((project) => (
                      <tr key={project.id}>
                        <td>{project.name}</td>
                        <td>{project.customer_name}</td>
                        <td>{project.customer_city}, {project.customer_state}</td>
                        <td>{project.job_count || 0}</td>
                        <td>${project.total_value?.toFixed(2) || '0.00'}</td>
                        <td>{new Date(project.created_at).toLocaleDateString()}</td>
                        <td>
                          <button className="btn btn-sm">View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ marginTop: '20px', padding: '12px', backgroundColor: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '6px' }}>
        <p style={{ margin: 0, fontSize: '14px', color: '#92400e' }}>
          ⚠️ <strong>Note:</strong> Projects feature is implemented with inline code due to critical module import issue. 
          Backend API integration pending. See CRITICAL_ISSUE_REPORT.md for details.
        </p>
      </div>
    </div>
  );
};

export default Projects;
