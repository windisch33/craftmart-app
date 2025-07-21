import React, { useState, useEffect } from 'react';
import customerService from '../services/customerService';
import type { Customer, CreateCustomerRequest } from '../services/customerService';
import CustomerForm from '../components/customers/CustomerForm';
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

  const handleDeleteCustomer = async (customerId: number) => {
    if (!confirm('Are you sure you want to delete this customer?')) {
      return;
    }

    try {
      setError(null);
      await customerService.deleteCustomer(customerId);
      // Remove the deleted customer from the local state
      setCustomers(customers.filter(customer => customer.id !== customerId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete customer');
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

  const formatPhoneNumber = (phone?: string) => {
    if (!phone) return 'N/A';
    return phone;
  };

  const getCustomerDisplayLocation = (customer: Customer) => {
    const parts = [customer.city, customer.state].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Location not specified';
  };

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
      <div className="customers-header">
        <div className="customers-title-section">
          <h1 className="gradient-title">Customers</h1>
          <p className="customers-subtitle">Manage your client relationships</p>
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
              placeholder="Search customers by name, email, city, or state..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="flex gap-3">
            <button className="btn btn-secondary">Filter</button>
            <button className="btn btn-secondary">Export</button>
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

      {/* Customer Grid */}
      <div className="customers-grid">
        {customers.map((customer) => (
          <div key={customer.id} className="customer-card">
            {/* Customer Header */}
            <div className="customer-header">
              <div className="customer-info">
                <h3 className="customer-name">{customer.name}</h3>
                <p className="customer-location">{getCustomerDisplayLocation(customer)}</p>
              </div>
              <div className="customer-status-badge">
                <span className="badge badge-success">Active</span>
              </div>
            </div>

            {/* Contact Information */}
            <div className="customer-contact">
              {customer.email && (
                <div className="contact-item">
                  <span className="contact-icon">📧</span>
                  <span>{customer.email}</span>
                </div>
              )}
              {customer.phone && (
                <div className="contact-item">
                  <span className="contact-icon">📞</span>
                  <span>{formatPhoneNumber(customer.phone)}</span>
                </div>
              )}
              {customer.mobile && (
                <div className="contact-item">
                  <span className="contact-icon">📱</span>
                  <span>{formatPhoneNumber(customer.mobile)}</span>
                </div>
              )}
              {customer.address && (
                <div className="contact-item">
                  <span className="contact-icon">📍</span>
                  <span>{customer.address}</span>
                </div>
              )}
            </div>

            {/* Customer Stats - Placeholder for now */}
            <div className="customer-stats">
              <div className="stat-item">
                <p className="stat-value">-</p>
                <p className="stat-label">Active Jobs</p>
              </div>
              <div className="stat-item">
                <p className="stat-value">-</p>
                <p className="stat-label">Total Value</p>
              </div>
              <div className="stat-item">
                <p className="stat-value">{new Date(customer.created_at).getFullYear()}</p>
                <p className="stat-label">Customer Since</p>
              </div>
            </div>

            {/* Customer Actions */}
            <div className="customer-actions">
              <button className="action-btn">
                👁️ View
              </button>
              <button 
                className="action-btn"
                onClick={() => handleEditCustomer(customer)}
              >
                ✏️ Edit
              </button>
              <button 
                className="action-btn"
                onClick={() => handleDeleteCustomer(customer.id)}
                style={{color: '#dc2626'}}
              >
                🗑️ Delete
              </button>
            </div>

            {/* Notes Preview */}
            {customer.notes && (
              <div style={{marginTop: '16px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px', borderLeft: '3px solid #e5e7eb'}}>
                <p style={{fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0', fontWeight: '500'}}>Notes:</p>
                <p style={{fontSize: '14px', color: '#374151', margin: 0, lineHeight: '1.4'}}>
                  {customer.notes.length > 100 ? `${customer.notes.substring(0, 100)}...` : customer.notes}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {customers.length === 0 && !loading && (
        <div className="empty-customers">
          <div className="empty-icon">
            👤
          </div>
          <h3 className="empty-title">
            {searchTerm ? 'No customers found' : 'No customers yet'}
          </h3>
          <p className="empty-desc">
            {searchTerm 
              ? 'Try adjusting your search criteria' 
              : 'Get started by adding your first customer'}
          </p>
          <button className="btn btn-primary" onClick={handleAddCustomer}>
            <span>👤</span>
            Add Customer
          </button>
        </div>
      )}

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