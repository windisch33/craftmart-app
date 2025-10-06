import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import customerService from '../services/customerService';
import type { Customer, CreateCustomerRequest } from '../services/customerService';
import CustomerForm from '../components/customers/CustomerForm';
import './Customers.css';
import '../styles/common.css';
import { UsersIcon, SearchIcon, AlertTriangleIcon, MailIcon, PhoneIcon, MobileIcon, BriefcaseIcon, EditIcon } from '../components/common/icons';
import EmptyState from '../components/common/EmptyState';
import { useToast } from '../components/common/ToastProvider';

const Customers: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<'recent' | 'all'>('recent');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  
  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  
  // Removed legacy CustomerJobs modal; navigation goes to Jobs page
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Load recent customers by default
  useEffect(() => {
    void loadRecentCustomers();
  }, []);

  const loadPagedCustomers = async (p: number) => {
    try {
      setError(null);
      setLoading(true);
      const resp = await customerService.getCustomersPaged({ page: p, pageSize });
      setCustomers(resp.data);
      setPage(resp.page);
      setTotalPages(resp.totalPages);
    } catch (err: any) {
      setError(err.message || 'Failed to load customers');
      console.error('Error loading customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentCustomers = async () => {
    try {
      setError(null);
      setLoading(true);
      const recentCustomers = await customerService.getRecentCustomers();
      setCustomers(recentCustomers);
      setPage(1);
      setTotalPages(1);
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
      // If search is cleared, restore current view
      setIsSearching(false);
      if (viewMode === 'recent') {
        await loadRecentCustomers();
      } else {
        await loadPagedCustomers(1);
      }
      return;
    }

    try {
      setError(null);
      setIsSearching(true);
      const searchResults = await customerService.searchCustomers(query);
      setCustomers(searchResults);
      setPage(1); setTotalPages(1);
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
  // Removed legacy CustomerJobs modal handler

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
        if (viewMode === 'recent') { await loadRecentCustomers(); } else { await loadPagedCustomers(1); }
      }
      setIsFormOpen(false);
      setEditingCustomer(null);
    } catch (err: any) {
      showToast(err?.message || 'Failed to save customer', { type: 'error' });
    }
  };

  const handleViewCustomer = async (customer: Customer) => {
    const q = encodeURIComponent(customer.name);
    // Fire-and-forget visit tracking; navigation should proceed regardless of result
    customerService.getCustomerById(customer.id).catch(err => {
      console.warn('visit tracking failed for customer', customer.id, err);
    }).finally(() => {
      navigate(`/jobs?q=${q}`);
    });
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
        <div className="page-actions">
          <button className="btn btn-primary" onClick={handleAddCustomer}>
            <span className="nav-icon"><UsersIcon /></span>
            Add Customer
          </button>
        </div>
      </div>

      {/* View toggle */}
      <div style={{display:'flex', gap:'8px', marginBottom:'12px'}}>
        <button
          className={`btn ${viewMode==='recent' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={async ()=>{ setViewMode('recent'); setIsSearching(false); await loadRecentCustomers(); }}
          disabled={loading || viewMode==='recent'}
        >
          Recent
        </button>
        <button
          className={`btn ${viewMode==='all' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={async ()=>{ setViewMode('all'); setIsSearching(false); await loadPagedCustomers(1); }}
          disabled={loading || viewMode==='all'}
        >
          All
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
          viewMode === 'recent'
            ? <p className="search-status">Recently visited customers</p>
            : <p className="search-status">All customers (page {page} of {totalPages})</p>
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

      {/* Pagination controls (only when not searching and in All view) */}
      {!isSearching && viewMode==='all' && totalPages > 1 && (
        <div style={{display:'flex', gap:'8px', justifyContent:'center', marginTop:'16px'}}>
          <button className="btn btn-secondary" disabled={page<=1 || loading} onClick={()=> loadPagedCustomers(page-1)}>Prev</button>
          <button className="btn btn-secondary" disabled={page>=totalPages || loading} onClick={()=> loadPagedCustomers(page+1)}>Next</button>
        </div>
      )}

      {/* Customer Form Modal */}
      <CustomerForm
        customer={editingCustomer}
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSave={handleSaveCustomer}
      />

      {/* Customer Jobs modal removed; navigation opens Jobs view */}
    </div>
  );
};

export default Customers;
