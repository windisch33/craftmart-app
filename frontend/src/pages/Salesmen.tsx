import React, { useState, useEffect } from 'react';
import salesmanService from '../services/salesmanService';
import type { Salesman, CreateSalesmanData } from '../services/salesmanService';
import SalesmanForm from '../components/salesmen/SalesmanForm';
import './Salesmen.css';
import '../styles/common.css';

const Salesmen: React.FC = () => {
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSalesman, setEditingSalesman] = useState<Salesman | null>(null);

  useEffect(() => {
    loadSalesmen();
  }, []);

  const loadSalesmen = async () => {
    try {
      console.log('Loading salesmen...');
      const data = await salesmanService.getAllSalesmen(true);
      console.log('Salesmen loaded:', data);
      setSalesmen(data);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Failed to load salesmen');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    console.log('Refresh button clicked');
    setIsRefreshing(true);
    setError(null); // Clear any existing errors
    try {
      await loadSalesmen();
      // Show success feedback
      setError('✅ Salesmen list refreshed successfully!');
      setTimeout(() => setError(null), 3000); // Clear success message after 3 seconds
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchTerm(query);
    if (!query.trim()) {
      await loadSalesmen();
      return;
    }

    try {
      setError(null);
      const searchResults = await salesmanService.searchSalesmen(query);
      setSalesmen(searchResults);
    } catch (err: any) {
      setError(err.message || 'Search failed');
    }
  };



  const handleAddSalesman = () => {
    console.log('Add Salesman button clicked');
    setEditingSalesman(null);
    setIsFormOpen(true);
    console.log('Form should now be open:', true);
  };

  const handleEditSalesman = (salesman: Salesman) => {
    console.log('Edit button clicked for:', salesman.first_name, salesman.last_name);
    setEditingSalesman(salesman);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingSalesman(null);
  };

  const handleSaveSalesman = async (salesmanData: CreateSalesmanData) => {
    if (editingSalesman) {
      const updatedSalesman = await salesmanService.updateSalesman(editingSalesman.id, {
        ...salesmanData,
        is_active: editingSalesman.is_active
      });
      setSalesmen(salesmen.map(s => s.id === editingSalesman.id ? updatedSalesman : s));
    } else {
      const newSalesman = await salesmanService.createSalesman(salesmanData);
      setSalesmen([newSalesman, ...salesmen]);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading salesmen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="gradient-title">Salesmen</h1>
          <p className="page-subtitle">Manage your sales team</p>
        </div>
        <button onClick={handleAddSalesman} className="btn btn-primary">
          <span>👤</span>
          Add Salesman
        </button>
      </div>

      <div className="search-section">
        <div className="search-container-large">
          <div className="search-icon-large">🔍</div>
          <input
            type="text"
            placeholder="Search salesmen by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="search-input-large"
            autoFocus
          />
        </div>
      </div>

      {error && (
        <div className="card" style={{marginBottom: '24px', backgroundColor: error.startsWith('✅') ? '#dcfce7' : '#fef2f2', border: error.startsWith('✅') ? '1px solid #86efac' : '1px solid #fecaca'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: error.startsWith('✅') ? '#166534' : '#b91c1c'}}>
            {!error.startsWith('✅') && <span>⚠️</span>}
            {error}
          </div>
        </div>
      )}

      {salesmen.length === 0 ? (
        <div className="empty-customers">
          <div className="empty-icon">🔍</div>
          <h2 className="empty-title">No salesmen found</h2>
          <p className="empty-desc">
            Try adjusting your search terms or add a new salesman.
          </p>
        </div>
      ) : (
        <div className="customers-grid">
          {salesmen.map(salesman => (
            <div key={salesman.id} className="customer-card">
              <div className="customer-header">
                <div className="customer-info">
                  <h3 className="customer-name">{salesman.first_name} {salesman.last_name}</h3>

                </div>
              </div>

              <div className="customer-contact">
                {salesman.email && (
                  <div className="contact-item">
                    <span className="contact-icon">✉️</span>
                    <span>{salesman.email}</span>
                  </div>
                )}
                {salesman.phone && (
                  <div className="contact-item">
                    <span className="contact-icon">📞</span>
                    <span>{salesman.phone}</span>
                  </div>
                )}
                <div className="contact-item">
                  <span className="contact-icon">💰</span>
                  <span>Commission: {salesman.commission_rate}%</span>
                </div>
              </div>

              {salesman.notes && (
                <div className="customer-notes">
                  <p className="notes-label">Notes:</p>
                  <p className="notes-content">{salesman.notes}</p>
                </div>
              )}

              <div className="customer-actions">
                <button 
                  className="action-btn" 
                  onClick={() => handleEditSalesman(salesman)}
                >
                  ✏️ Edit
                </button>

              </div>
            </div>
          ))}
        </div>
      )}

      <SalesmanForm
        salesman={editingSalesman}
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSave={handleSaveSalesman}
      />
    </div>
  );
};

export default Salesmen;