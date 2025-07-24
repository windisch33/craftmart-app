import React, { useState } from 'react';
import '../styles/common.css';
import './Shops.css';

const Shops: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Sample shop data
  const shops = [
    {
      id: 1,
      name: "Victorian Staircase - Shop #001",
      job: "Victorian Staircase",
      customer: "Johnson Construction",
      status: "in_progress",
      createdDate: "2024-01-16",
      completedDate: "",
      cutSheetCount: 12,
      notes: "Ready for assembly, all pieces cut to specification"
    },
    {
      id: 2,
      name: "Modern Floating Stairs - Shop #002",
      job: "Modern Floating Stairs",
      customer: "Heritage Homes LLC",
      status: "planning",
      createdDate: "2024-01-19",
      completedDate: "",
      cutSheetCount: 8,
      notes: "Awaiting material delivery for specialty glass components"
    },
    {
      id: 3,
      name: "Spiral Staircase - Shop #003",
      job: "Spiral Staircase",
      customer: "Modern Living Inc",
      status: "completed",
      createdDate: "2024-01-11",
      completedDate: "2024-01-14",
      cutSheetCount: 15,
      notes: "Completed ahead of schedule, ready for delivery"
    }
  ];

  const filteredShops = shops.filter(shop => {
    const matchesSearch = shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shop.job.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shop.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || shop.status === statusFilter;
    return matchesSearch && matchesStatus;
  });


  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 20px 25px -5px rgba(0, 0, 0, 0.04)',
    border: '1px solid #f3f4f6',
    transition: 'all 0.3s ease'
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
      case 'planning':
        return { bg: '#fef3c7', color: '#92400e', border: '#fbbf24' };
      case 'in_progress':
        return { bg: '#dbeafe', color: '#1e40af', border: '#3b82f6' };
      case 'completed':
        return { bg: '#d1fae5', color: '#065f46', border: '#10b981' };
      default:
        return { bg: '#f3f4f6', color: '#374151', border: '#d1d5db' };
    }
  };

  return (
    <div className="container">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="gradient-title">Shops</h1>
          <p className="page-subtitle">Manage production floor and cut sheets</p>
        </div>
        <button className="btn btn-primary">
          <span style={{fontSize: '20px'}}>🏭</span>
          Create Shop
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
                placeholder="Search shops by name, job, or customer..."
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
              <option value="planning">Planning</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
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

      {/* Shops Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
        gap: '24px'
      }}>
        {filteredShops.map((shop) => {
          const statusStyle = getStatusColor(shop.status);
          return (
            <div
              key={shop.id}
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
              {/* Shop Header */}
              <div style={{display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px'
                  }}>
                    🏭
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: '#1f2937',
                      margin: 0,
                      transition: 'color 0.2s ease'
                    }}>
                      {shop.name}
                    </h3>
                    <p style={{fontSize: '14px', color: '#6b7280', margin: 0}}>
                      {shop.customer}
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
                  {shop.status.replace('_', ' ')}
                </div>
              </div>

              {/* Job Reference */}
              <div style={{marginBottom: '16px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <span style={{fontSize: '16px'}}>📋</span>
                  <span style={{fontSize: '14px', fontWeight: '500', color: '#374151'}}>
                    Job: {shop.job}
                  </span>
                </div>
              </div>

              {/* Cut Sheet Info */}
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
                  <div style={{fontSize: '24px', fontWeight: 'bold', color: '#1f2937'}}>{shop.cutSheetCount}</div>
                  <div style={{fontSize: '12px', color: '#6b7280'}}>Cut Sheets</div>
                </div>
                <div style={{textAlign: 'center'}}>
                  <div style={{fontSize: '24px', fontWeight: 'bold', color: shop.status === 'completed' ? '#059669' : '#6b7280'}}>
                    {shop.status === 'completed' ? '✓' : '⏳'}
                  </div>
                  <div style={{fontSize: '12px', color: '#6b7280'}}>
                    {shop.status === 'completed' ? 'Complete' : 'Status'}
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div style={{marginBottom: '16px'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}>
                  <span style={{fontSize: '16px'}}>📅</span>
                  <span style={{fontSize: '14px', color: '#6b7280'}}>Created: {shop.createdDate}</span>
                </div>
                {shop.completedDate && (
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <span style={{fontSize: '16px'}}>✅</span>
                    <span style={{fontSize: '14px', color: '#6b7280'}}>Completed: {shop.completedDate}</span>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div style={{marginBottom: '16px'}}>
                <p style={{fontSize: '14px', color: '#6b7280', lineHeight: '1.5', fontStyle: 'italic'}}>
                  {shop.notes}
                </p>
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
                  View Cut Sheets
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
                  e.currentTarget.style.borderColor = '#8b5cf6';
                  e.currentTarget.style.backgroundColor = '#faf5ff';
                }} onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.backgroundColor = 'white';
                }}>
                  Edit Shop
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredShops.length === 0 && (
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
            🏭
          </div>
          <h3 style={{fontSize: '18px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px'}}>
            {searchTerm || statusFilter !== 'all' ? 'No shops found' : 'No shops yet'}
          </h3>
          <p style={{color: '#6b7280', marginBottom: '24px'}}>
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search criteria or filters' 
              : 'Get started by creating your first shop from an order'}
          </p>
          <button className="btn btn-primary">
            <span style={{fontSize: '20px'}}>🏭</span>
            Create Shop
          </button>
        </div>
      )}
    </div>
  );
};

export default Shops;