import React, { useState, useEffect } from 'react';
import salesmanService from '../services/salesmanService';
import type { Salesman, CreateSalesmanData } from '../services/salesmanService';
import SalesmanForm from '../components/salesmen/SalesmanForm';
import { SelectableList } from '../components/common/SelectableList';
import './Salesmen.css';
import '../styles/common.css';
import { UsersIcon, SearchIcon, AlertTriangleIcon, MailIcon, PhoneIcon, RefreshIcon } from '../components/common/icons';

const SalesmenBasic: React.FC = () => {
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
    setIsRefreshing(true);
    await loadSalesmen();
    setIsRefreshing(false);
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

  const handleDeleteSalesmen = async (salesmenToDelete: Salesman[]) => {
    try {
      setError(null);
      // Delete all selected salesmen
      await Promise.all(
        salesmenToDelete.map(salesman => salesmanService.deleteSalesman(salesman.id))
      );
      // Remove deleted salesmen from local state
      const deletedIds = salesmenToDelete.map(s => s.id);
      setSalesmen(salesmen.filter(salesman => !deletedIds.includes(salesman.id)));
    } catch (err: any) {
      setError(err.message || 'Failed to delete salesmen');
    }
  };

  const handleAddSalesman = () => {
    setEditingSalesman(null);
    setIsFormOpen(true);
  };

  const handleEditSalesman = (salesman: Salesman) => {
    setEditingSalesman(salesman);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingSalesman(null);
  };

  const handleSaveSalesman = async (salesmanData: CreateSalesmanData) => {
    if (editingSalesman) {
      // Update existing salesman
      const updatedSalesman = await salesmanService.updateSalesman(editingSalesman.id, {
        ...salesmanData,
        is_active: editingSalesman.is_active
      });
      setSalesmen(salesmen.map(s => s.id === editingSalesman.id ? updatedSalesman : s));
    } else {
      // Create new salesman
      const newSalesman = await salesmanService.createSalesman(salesmanData);
      setSalesmen([newSalesman, ...salesmen]);
    }
  };

  const handleBulkAction = (action: string, selectedSalesmen: Salesman[]) => {
    switch (action) {
      case 'export':
        // Export selected salesmen to CSV
        const csvContent = [
          ['First Name', 'Last Name', 'Email', 'Phone', 'Commission Rate'],
          ...selectedSalesmen.map(s => [
            s.first_name,
            s.last_name,
            s.email || '',
            s.phone || '',
            `${s.commission_rate}%`
          ])
        ].map(row => row.join(',')).join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'salesmen.csv';
        a.click();
        URL.revokeObjectURL(url);
        break;
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Name',
      width: '25%',
      render: (salesman: Salesman) => (
        <div>
          <div style={{ fontWeight: 600 }}>{salesman.first_name} {salesman.last_name}</div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            Commission: {salesman.commission_rate}%
          </div>
        </div>
      )
    },
    {
      key: 'contact',
      label: 'Contact',
      width: '30%',
      render: (salesman: Salesman) => (
        <div style={{ fontSize: '14px' }}>
          {salesman.email && <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}><MailIcon /> {salesman.email}</div>}
          {salesman.phone && <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}><PhoneIcon /> {salesman.phone}</div>}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      width: '15%',
      render: (salesman: Salesman) => (
        <span style={{
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 500,
          backgroundColor: salesman.is_active ? '#dcfce7' : '#fee2e2',
          color: salesman.is_active ? '#166534' : '#991b1b'
        }}>
          {salesman.is_active ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      key: 'notes',
      label: 'Notes',
      width: '20%',
      render: (salesman: Salesman) => salesman.notes ? (
        <div style={{ fontSize: '14px', color: '#6b7280' }}>
          {salesman.notes.length > 50 ? `${salesman.notes.substring(0, 50)}...` : salesman.notes}
        </div>
      ) : <span style={{ color: '#9ca3af' }}>—</span>
    }
  ];

  if (loading) return (
    <div className="container">
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading salesmen...</p>
      </div>
    </div>
  );

  return (
    <div className="container">
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="gradient-title">Salesmen</h1>
          <p className="page-subtitle">Manage your sales team</p>
        </div>
        <div className="flex gap-3">
          <button 
            className="btn btn-secondary"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? <RefreshIcon width={16} height={16} /> : <RefreshIcon width={16} height={16} />} Refresh
          </button>
          <button className="btn btn-primary" onClick={handleAddSalesman}>
            <span className="nav-icon"><UsersIcon /></span>
            Add Salesman
          </button>
        </div>
      </div>

      <div className="card" style={{marginBottom: '24px'}}>
        <div className="customers-controls">
          <div className="search-container">
            <div className="search-icon"><SearchIcon /></div>
            <input
              type="text"
              placeholder="Search salesmen by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="card" style={{marginBottom: '24px', backgroundColor: '#fef2f2', border: '1px solid #fecaca'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: '#b91c1c'}}>
            <AlertTriangleIcon />
            {error}
          </div>
        </div>
      )}

      <SelectableList
        items={salesmen}
        columns={columns}
        getItemId={(salesman) => salesman.id}
        onEdit={handleEditSalesman}
        onDelete={handleDeleteSalesmen}
        onBulkAction={handleBulkAction}
        bulkActions={[
          { label: 'Export', action: 'export', icon: '📥' }
        ]}
        emptyMessage={
          searchTerm 
            ? 'No salesmen found. Try adjusting your search criteria.' 
            : 'No salesmen yet. Get started by adding your first salesman.'
        }
      />

      {/* Salesman Form Modal */}
      <SalesmanForm
        salesman={editingSalesman}
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSave={handleSaveSalesman}
      />
    </div>
  );
};

export default SalesmenBasic;
