import React, { useState, useEffect } from 'react';
import customerService from '../services/customerService';
import type { Customer, CreateCustomerRequest } from '../services/customerService';
import CustomerForm from '../components/customers/CustomerForm';
import CustomerJobs from '../components/customers/CustomerJobs';
import './Customers.css';
import '../styles/common.css';
import { UsersIcon, SearchIcon, AlertTriangleIcon, MailIcon, PhoneIcon, MobileIcon, BriefcaseIcon, EditIcon } from '../components/common/icons';
import EmptyState from '../components/common/EmptyState';
import { useToast } from '../components/common/ToastProvider';

const Customers: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  
  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  
  // CustomerJobs modal state
  const [isJobsModalOpen, setIsJobsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const { showToast } = useToast();

  // Load recent customers on component mount
  useEffect(() => {
    loadRecentCustomers();
  }, []);

  const loadRecentCustomers = async () => {
    try {
      setError(null);
      setLoading(true);
      const recentCustomers = await customerService.getRecentCustomers();
      setCustomers(recentCustomers);
    } catch (err: any) {
      setError(err.message || 'Failed to load recent customers');
      console.error('Error loading recent customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchTerm(query);
    
    if (!query.trim()) {
      // If search is cleared, show recent customers again
      setIsSearching(false);
      await loadRecentCustomers();
      return;
    }

    try {
      setError(null);
      setIsSearching(true);
      const searchResults = await customerService.searchCustomers(query);
      setCustomers(searchResults);
    } catch (err: any) {
      setError(err.message || 'Search failed');
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
  const handleCloseJobsModal = () => {
    setIsJobsModalOpen(false);
    setSelectedCustomer(null);
  };

  const handleSaveCustomer = async (customerData: CreateCustomerRequest) => {
    try {
      if (editingCustomer) {
        const updatedCustomer = await customerService.updateCustomer(editingCustomer.id, customerData);
        setCustomers(customers.map(c => c.id === editingCustomer.id ? updatedCustomer : c));
        showToast('Customer updated', { type: 'success' });
      } else {
        const newCustomer = await customerService.createCustomer(customerData);
        setCustomers([newCustomer, ...customers]);
        showToast('Customer created successfully', { type: 'success' });
      }
      if (!isSearching) {
        await loadRecentCustomers();
      }
      setIsFormOpen(false);
      setEditingCustomer(null);
    } catch (err: any) {
      showToast(err?.message || 'Failed to save customer', { type: 'error' });
    }
  };

  const handleViewCustomer = async (customer: Customer) => {
    try {
      // Fetch customer by ID to trigger visit tracking
      await customerService.getCustomerById(customer.id);
      // Open the customer jobs modal
      setSelectedCustomer(customer);
      setIsJobsModalOpen(true);
      // Refresh the list if needed
      if (!isSearching) {
        await loadRecentCustomers();
      }
    } catch (err) {
      console.error('Error viewing customer:', err);
      showToast('Failed to open customer details', { type: 'error' });
    }
  };

  const formatPhoneNumber = (phone?: string) => {
    return phone || 'Not provided';
  };

  const formatAddress = (customer: Customer) => {
    const parts = [customer.address, customer.city, customer.state, customer.zip_code]
      .filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'No address provided';
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
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="gradient-title">Customers</h1>
          <p className="page-subtitle">Search and manage your client relationships</p>
        </div>
        <button className="btn btn-primary" onClick={handleAddCustomer}>
          <span className="nav-icon"><UsersIcon /></span>
          Add Customer
        </button>
      </div>

      {/* Large Search Bar */}
      <div className="search-section sticky-controls">
        <div className="search-container-large">
          <div className="search-icon-large"><SearchIcon /></div>
          <input
            type="text"
            placeholder="Search customers by name, email, city, or state..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="search-input-large"
            autoFocus
          />
        </div>
        {isSearching && (
          <p className="search-status">Showing search results for "{searchTerm}"</p>
        )}
        {!isSearching && customers.length > 0 && (
          <p className="search-status">Recently visited customers</p>
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

      {/* Customer Cards Grid */}
      {customers.length > 0 ? (
        <div className="customers-grid">
          {customers.map(customer => (
            <div key={customer.id} className="customer-card" onClick={() => handleViewCustomer(customer)}>
              <div className="customer-header">
                <div className="customer-info">
                  <h3 className="customer-name">{customer.name}</h3>
                  <p className="customer-location">{formatAddress(customer)}</p>
                </div>
              </div>

              <div className="customer-contact">
                {customer.email && (
                  <div className="contact-item">
                    <span className="contact-icon"><MailIcon /></span>
                    <span>{customer.email}</span>
                  </div>
                )}
                {customer.phone && (
                  <div className="contact-item">
                    <span className="contact-icon"><PhoneIcon /></span>
                    <span>{formatPhoneNumber(customer.phone)}</span>
                  </div>
                )}
                {customer.mobile && (
                  <div className="contact-item">
                    <span className="contact-icon"><MobileIcon /></span>
                    <span>{formatPhoneNumber(customer.mobile)}</span>
                  </div>
                )}
                {customer.accounting_email && (
                  <div className="contact-item">
                    <span className="contact-icon"><BriefcaseIcon /></span>
                    <span>{customer.accounting_email}</span>
                  </div>
                )}
              </div>

              {customer.notes && (
                <div className="customer-notes">
                  <p className="notes-label">Notes:</p>
                  <p className="notes-content">{customer.notes}</p>
                </div>
              )}

              <div className="customer-actions">
                <button 
                  className="action-btn" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditCustomer(customer);
                  }}
                >
                  <span className="contact-icon"><EditIcon /></span> Edit
                </button>

              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<SearchIcon />}
          title={isSearching ? 'No customers found' : 'No recent customers'}
          description={isSearching ? 'Try adjusting your search terms or add a new customer.' : 'Start searching for customers or add a new one to get started.'}
          action={!isSearching ? { label: 'Add Your First Customer', onClick: handleAddCustomer } : undefined}
        />
      )}

      {/* Customer Form Modal */}
      <CustomerForm
        customer={editingCustomer}
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSave={handleSaveCustomer}
      />

      {/* Customer Jobs Modal */}
      <CustomerJobs
        customer={selectedCustomer}
        isOpen={isJobsModalOpen}
        onClose={handleCloseJobsModal}
      />
    </div>
  );
};

export default Customers;
