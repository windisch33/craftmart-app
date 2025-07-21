import React, { useState } from 'react';
import './Jobs.css';

const Jobs: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Sample job data
  const jobs = [
    {
      id: 1,
      title: "Victorian Staircase",
      customer: "Johnson Construction",
      status: "order",
      quoteAmount: "$12,500",
      orderAmount: "$12,500",
      invoiceAmount: "",
      createdDate: "2024-01-15",
      description: "Custom Victorian style staircase with ornate balusters"
    },
    {
      id: 2,
      title: "Modern Floating Stairs",
      customer: "Heritage Homes LLC",
      status: "quote",
      quoteAmount: "$18,200",
      orderAmount: "",
      invoiceAmount: "",
      createdDate: "2024-01-18",
      description: "Minimalist floating staircase with glass railings"
    },
    {
      id: 3,
      title: "Spiral Staircase",
      customer: "Modern Living Inc",
      status: "invoice",
      quoteAmount: "$8,750",
      orderAmount: "$8,750",
      invoiceAmount: "$8,750",
      createdDate: "2024-01-10",
      description: "Compact spiral staircase for loft conversion"
    }
  ];

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const containerStyle = {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '32px'
  };

  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 20px 25px -5px rgba(0, 0, 0, 0.04)',
    border: '1px solid #f3f4f6',
    transition: 'all 0.3s ease'
  };

  const gradientTitleStyle = {
    fontSize: '3rem',
    fontWeight: 'bold',
    background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: '8px'
  };

  const buttonStyle = {
    backgroundColor: '#3b82f6',
    color: 'white',
    padding: '12px 24px',
    borderRadius: '12px',
    border: 'none',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.39)',
    transition: 'all 0.2s ease'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    fontSize: '16px',
    transition: 'all 0.2s ease',
    outline: 'none'
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'quote':
        return { bg: '#fef3c7', color: '#92400e', border: '#fbbf24' };
      case 'order':
        return { bg: '#dbeafe', color: '#1e40af', border: '#3b82f6' };
      case 'invoice':
        return { bg: '#d1fae5', color: '#065f46', border: '#10b981' };
      default:
        return { bg: '#f3f4f6', color: '#374151', border: '#d1d5db' };
    }
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px'}}>
        <div>
          <h1 style={gradientTitleStyle}>Jobs</h1>
          <p style={{color: '#6b7280', fontSize: '20px', margin: 0}}>Manage quotes, orders, and invoices</p>
        </div>
        <button 
          style={buttonStyle}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
        >
          <span style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <span style={{fontSize: '20px'}}>📋</span>
            Create Job
          </span>
        </button>
      </div>

      {/* Search and Filters */}
      <div style={{...cardStyle, marginBottom: '24px'}}>
        <div style={{display: 'flex', gap: '16px', flexWrap: 'wrap'}}>
          <div style={{flex: 1, minWidth: '300px'}}>
            <div style={{position: 'relative'}}>
              <div style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af',
                pointerEvents: 'none',
                zIndex: 1
              }}>
                🔍
              </div>
              <input
                type="text"
                placeholder="Search jobs by title or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{...inputStyle, paddingLeft: '48px'}}
                onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
              />
            </div>
          </div>
          <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                backgroundColor: 'white',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
            >
              <option value="all">All Status</option>
              <option value="quote">Quotes</option>
              <option value="order">Orders</option>
              <option value="invoice">Invoices</option>
            </select>
            <button style={{
              padding: '12px 20px',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              backgroundColor: 'white',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }} onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#3b82f6';
              e.currentTarget.style.backgroundColor = '#f8fafc';
            }} onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.backgroundColor = 'white';
            }}>
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Jobs Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '24px'
      }}>
        {filteredJobs.map((job) => {
          const statusStyle = getStatusColor(job.status);
          return (
            <div
              key={job.id}
              style={{
                ...cardStyle,
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 10px 60px -15px rgba(0, 0, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 20px 25px -5px rgba(0, 0, 0, 0.04)';
              }}
            >
              {/* Job Header */}
              <div style={{display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
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
                    📋
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: '#1f2937',
                      margin: 0,
                      transition: 'color 0.2s ease'
                    }}>
                      {job.title}
                    </h3>
                    <p style={{fontSize: '14px', color: '#6b7280', margin: 0}}>
                      {job.customer}
                    </p>
                  </div>
                </div>
                <div style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600',
                  backgroundColor: statusStyle.bg,
                  color: statusStyle.color,
                  border: `1px solid ${statusStyle.border}`,
                  textTransform: 'uppercase'
                }}>
                  {job.status}
                </div>
              </div>

              {/* Description */}
              <div style={{marginBottom: '16px'}}>
                <p style={{fontSize: '14px', color: '#6b7280', lineHeight: '1.5'}}>
                  {job.description}
                </p>
              </div>

              {/* Pricing Information */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                padding: '16px',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                marginBottom: '16px'
              }}>
                <div style={{textAlign: 'center'}}>
                  <div style={{fontSize: '18px', fontWeight: 'bold', color: job.quoteAmount ? '#1f2937' : '#9ca3af'}}>
                    {job.quoteAmount || '-'}
                  </div>
                  <div style={{fontSize: '12px', color: '#6b7280'}}>Quote</div>
                </div>
                <div style={{textAlign: 'center'}}>
                  <div style={{fontSize: '18px', fontWeight: 'bold', color: job.orderAmount ? '#1f2937' : '#9ca3af'}}>
                    {job.orderAmount || '-'}
                  </div>
                  <div style={{fontSize: '12px', color: '#6b7280'}}>Order</div>
                </div>
                <div style={{textAlign: 'center'}}>
                  <div style={{fontSize: '18px', fontWeight: 'bold', color: job.invoiceAmount ? '#1f2937' : '#9ca3af'}}>
                    {job.invoiceAmount || '-'}
                  </div>
                  <div style={{fontSize: '12px', color: '#6b7280'}}>Invoice</div>
                </div>
              </div>

              {/* Job Meta */}
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <span style={{fontSize: '16px'}}>📅</span>
                  <span style={{fontSize: '14px', color: '#6b7280'}}>Created {job.createdDate}</span>
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
                  e.currentTarget.style.borderColor = '#10b981';
                  e.currentTarget.style.backgroundColor = '#f0fdf4';
                }} onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.backgroundColor = 'white';
                }}>
                  Next Stage
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredJobs.length === 0 && (
        <div style={{...cardStyle, textAlign: 'center', padding: '48px 24px'}}>
          <div style={{
            width: '64px',
            height: '64px',
            backgroundColor: '#f3f4f6',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '24px'
          }}>
            📋
          </div>
          <h3 style={{fontSize: '18px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px'}}>
            {searchTerm || statusFilter !== 'all' ? 'No jobs found' : 'No jobs yet'}
          </h3>
          <p style={{color: '#6b7280', marginBottom: '24px'}}>
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search criteria or filters' 
              : 'Get started by creating your first job'}
          </p>
          <button style={buttonStyle}>
            <span style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
              <span style={{fontSize: '20px'}}>📋</span>
              Create Job
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

export default Jobs;