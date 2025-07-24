import React, { useState, useEffect } from 'react';
import customerService from '../services/customerService';
import type { Customer, CreateCustomerRequest } from '../services/customerService';
import CustomerForm from '../components/customers/CustomerForm';
import { SelectableList } from '../components/common/SelectableList';
import './Customers.css';
import '../styles/common.css';

const Customers: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Load customers on component mount
  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setError(null);
      const customerData = await customerService.getAllCustomers();
      setCustomers(customerData);
    } catch (err: any) {
      setError(err.message || 'Failed to load customers');
      console.error('Error loading customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadCustomers();
    setIsRefreshing(false);
  };

  const handleSearch = async (query: string) => {
    setSearchTerm(query);
    if (!query.trim()) {
      await loadCustomers();
      return;
    }

    try {
      setError(null);
      const searchResults = await customerService.searchCustomers(query);
      setCustomers(searchResults);
    } catch (err: any) {
      setError(err.message || 'Search failed');
    }
  };

  const handleDeleteCustomers = async (customersToDelete: Customer[]) => {
    try {
      setError(null);
      // Delete all selected customers
      await Promise.all(
        customersToDelete.map(customer => customerService.deleteCustomer(customer.id))
      );
      // Remove deleted customers from local state
      const deletedIds = customersToDelete.map(c => c.id);
      setCustomers(customers.filter(customer => !deletedIds.includes(customer.id)));
    } catch (err: any) {
      setError(err.message || 'Failed to delete customers');
    }
  };

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setIsFormOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCustomer(null);
  };

  const handleSaveCustomer = async (customerData: CreateCustomerRequest) => {
    if (editingCustomer) {
      // Update existing customer
      const updatedCustomer = await customerService.updateCustomer(editingCustomer.id, customerData);
      setCustomers(customers.map(c => 
        c.id === editingCustomer.id ? updatedCustomer : c
      ));
    } else {
      // Create new customer
      const newCustomer = await customerService.createCustomer(customerData);
      setCustomers([newCustomer, ...customers]);
    }
  };

  const handleBulkAction = (action: string, selectedCustomers: Customer[]) => {
    switch (action) {
      case 'export':
        // Export selected customers to CSV
        const csvContent = [
          ['Customer Name'],
          ...selectedCustomers.map(c => [c.name])
        ].map(row => row.join(',')).join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'customers.csv';
        a.click();
        URL.revokeObjectURL(url);
        break;
    }
  };


  const columns = [
    {
      key: 'name',
      label: 'Customer Name',
      width: '100%',
      render: (customer: Customer) => (
        <div style={{ fontWeight: 600, fontSize: '16px' }}>
          {customer.name}
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="gradient-title">Customers</h1>
          <p className="page-subtitle">Manage your client relationships</p>
        </div>
        <div className="flex gap-3">
          <button 
            className="btn btn-secondary"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? '🔄' : '↻'} Refresh
          </button>
          <button className="btn btn-primary" onClick={handleAddCustomer}>
            <span>👤</span>
            Add Customer
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card" style={{marginBottom: '24px'}}>
        <div className="customers-controls">
          <div className="search-container">
            <div className="search-icon">🔍</div>
            <input
              type="text"
              placeholder="Search customers by name..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="card" style={{marginBottom: '24px', backgroundColor: '#fef2f2', border: '1px solid #fecaca'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: '#b91c1c'}}>
            <span>⚠️</span>
            {error}
          </div>
        </div>
      )}

      {/* Customer List */}
      <SelectableList
        items={customers}
        columns={columns}
        getItemId={(customer) => customer.id}
        onEdit={handleEditCustomer}
        onDelete={handleDeleteCustomers}
        onBulkAction={handleBulkAction}
        bulkActions={[
          { label: 'Export', action: 'export', icon: '📥' }
        ]}
        emptyMessage={
          searchTerm 
            ? 'No customers found. Try adjusting your search criteria.' 
            : 'No customers yet. Get started by adding your first customer.'
        }
      />

      {/* Customer Form Modal */}
      <CustomerForm
        customer={editingCustomer}
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSave={handleSaveCustomer}
      />
    </div>
  );
};

export default Customers;