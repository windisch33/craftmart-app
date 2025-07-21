import React, { useState } from 'react';
import './Customers.css';
import '../styles/common.css';

const Customers: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Sample customer data
  const customers = [
    {
      id: 1,
      name: "Johnson Construction",
      email: "info@johnsonconstruction.com",
      phone: "(555) 123-4567",
      city: "Seattle",
      state: "WA",
      activeJobs: 2,
      totalValue: "$24,500",
      status: "active"
    },
    {
      id: 2,
      name: "Heritage Homes LLC",
      email: "contact@heritagehomes.com",
      phone: "(555) 987-6543",
      city: "Portland",
      state: "OR",
      activeJobs: 1,
      totalValue: "$18,200",
      status: "active"
    },
    {
      id: 3,
      name: "Modern Living Inc",
      email: "hello@modernliving.com",
      phone: "(555) 456-7890",
      city: "Vancouver",
      state: "WA",
      activeJobs: 0,
      totalValue: "$8,750",
      status: "inactive"
    }
  ];

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );


  return (
    <div className="container">
      {/* Header */}
      <div className="customers-header">
        <div className="customers-title-section">
          <h1 className="gradient-title">Customers</h1>
          <p className="customers-subtitle">Manage your client relationships</p>
        </div>
        <button className="btn btn-primary">
          <span style={{fontSize: '20px'}}>👤</span>
          Add Customer
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card" style={{marginBottom: '24px'}}>
        <div className="customers-controls">
          <div className="search-container">
            <div className="search-icon">🔍</div>
            <input
              type="text"
              placeholder="Search customers by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="flex gap-3">
            <button className="btn btn-secondary">Filter</button>
            <button className="btn btn-secondary">Export</button>
          </div>
        </div>
      </div>

      {/* Customer Grid */}
      <div className="customers-grid">
        {filteredCustomers.map((customer) => (
          <div key={customer.id} className="customer-card">
            {/* Customer Header */}
            <div className="customer-header">
              <div className="flex items-center gap-3">
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px'
                }}>
                  👤
                </div>
                <div className="customer-info">
                  <h3 className="customer-name">{customer.name}</h3>
                  <p className="customer-location">{customer.city}, {customer.state}</p>
                </div>
              </div>
              <div className={`badge customer-status-badge ${
                customer.status === 'active' ? 'badge-success' : 'badge-gray'
              }`}>
                {customer.status}
              </div>
            </div>

            {/* Contact Info */}
            <div className="customer-contact">
              <div className="contact-item">
                <span className="contact-icon">📧</span>
                <span>{customer.email}</span>
              </div>
              <div className="contact-item" style={{marginBottom: '0'}}>
                <span className="contact-icon">📞</span>
                <span>{customer.phone}</span>
              </div>
            </div>

            {/* Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              padding: '16px',
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              marginBottom: '16px'
            }}>
              <div style={{textAlign: 'center'}}>
                <div style={{fontSize: '24px', fontWeight: 'bold', color: '#1f2937'}}>{customer.activeJobs}</div>
                <div style={{fontSize: '12px', color: '#6b7280'}}>Active Jobs</div>
              </div>
              <div style={{textAlign: 'center'}}>
                <div style={{fontSize: '24px', fontWeight: 'bold', color: '#1f2937'}}>{customer.totalValue}</div>
                <div style={{fontSize: '12px', color: '#6b7280'}}>Total Value</div>
              </div>
            </div>

            {/* Actions */}
            <div style={{display: 'flex', gap: '8px'}}>
              <button style={{
                flex: 1,
                padding: '10px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                 onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}>
                View Details
              </button>
              <button style={{
                flex: 1,
                padding: '10px 16px',
                backgroundColor: 'white',
                color: '#374151',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }} onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.backgroundColor = '#f8fafc';
              }} onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.backgroundColor = 'white';
              }}>
                New Quote
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredCustomers.length === 0 && (
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
          <button className="btn btn-primary">
            <span>👤</span>
            Add Customer
          </button>
        </div>
      )}
    </div>
  );
};

export default Customers;