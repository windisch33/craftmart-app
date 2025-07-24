import React, { useState } from 'react';
import '../styles/common.css';
import './Reports.css';

const Reports: React.FC = () => {
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [reportType, setReportType] = useState('sales');


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

  // Sample report data
  const recentReports = [
    {
      id: 1,
      type: 'Sales',
      dateRange: '2024-01-01 to 2024-01-31',
      totalRevenue: '$48,250',
      generatedDate: '2024-02-01',
      status: 'completed'
    },
    {
      id: 2,
      type: 'Tax',
      dateRange: '2024-Q1',
      totalRevenue: '$142,750',
      generatedDate: '2024-04-01',
      status: 'completed'
    },
    {
      id: 3,
      type: 'Sales',
      dateRange: '2024-02-01 to 2024-02-29',
      totalRevenue: '$52,100',
      generatedDate: '2024-03-01',
      status: 'completed'
    }
  ];

  return (
    <div className="container">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="gradient-title">Reports</h1>
          <p className="page-subtitle">Generate sales and tax reports for accounting</p>
        </div>
      </div>

      {/* Report Generation Section */}
      <div style={{...cardStyle, marginBottom: '32px'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px'}}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}>
            📊
          </div>
          <div>
            <h2 style={{fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: 0}}>Generate New Report</h2>
            <p style={{fontSize: '14px', color: '#6b7280', margin: 0}}>Create custom reports for any date range</p>
          </div>
        </div>

        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px'}}>
          {/* Report Type Selection */}
          <div>
            <label style={{display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px'}}>
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              style={inputStyle}
              onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
            >
              <option value="sales">Sales Report</option>
              <option value="tax">Tax Report</option>
              <option value="customer">Customer Summary</option>
              <option value="job">Job Analysis</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label style={{display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px'}}>
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              style={inputStyle}
              onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
            />
          </div>

          <div>
            <label style={{display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px'}}>
              End Date
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              style={inputStyle}
              onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
            />
          </div>
        </div>

        <div style={{display: 'flex', gap: '12px', marginTop: '24px'}}>
          <button className="btn btn-primary">
            <span style={{fontSize: '18px'}}>📊</span>
            Generate Report
          </button>
          <button style={{
            padding: '12px 24px',
            border: '2px solid #e5e7eb',
            borderRadius: '12px',
            backgroundColor: 'white',
            cursor: 'pointer',
            fontWeight: '600',
            transition: 'all 0.2s ease'
          }} onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#10b981';
            e.currentTarget.style.backgroundColor = '#f0fdf4';
          }} onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e5e7eb';
            e.currentTarget.style.backgroundColor = 'white';
          }}>
            <span style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
              <span style={{fontSize: '18px'}}>📧</span>
              Email Report
            </span>
          </button>
        </div>
      </div>

      {/* Quick Report Cards */}
      <div style={{marginBottom: '32px'}}>
        <h3 style={{fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px'}}>Quick Reports</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px'
        }}>
          {[
            {
              title: 'Monthly Sales',
              description: 'Current month sales performance',
              icon: '💰',
              color: '#10b981',
              action: 'Generate Now'
            },
            {
              title: 'Quarterly Tax',
              description: 'Q1 2024 tax summary',
              icon: '📋',
              color: '#3b82f6',
              action: 'Generate Now'
            },
            {
              title: 'Customer Report',
              description: 'Top customers by revenue',
              icon: '👥',
              color: '#8b5cf6',
              action: 'Generate Now'
            },
            {
              title: 'Job Analysis',
              description: 'Job completion rates',
              icon: '📈',
              color: '#f59e0b',
              action: 'Generate Now'
            }
          ].map((report, index) => (
            <div
              key={index}
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
              <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px'}}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: report.color + '20',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px'
                }}>
                  {report.icon}
                </div>
                <div>
                  <h4 style={{fontSize: '18px', fontWeight: 'bold', color: '#1f2937', margin: 0}}>
                    {report.title}
                  </h4>
                  <p style={{fontSize: '14px', color: '#6b7280', margin: 0}}>
                    {report.description}
                  </p>
                </div>
              </div>
              <button style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: report.color,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }} onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                 onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
                {report.action}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Reports */}
      <div style={cardStyle}>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>
              📄
            </div>
            <div>
              <h3 style={{fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: 0}}>Recent Reports</h3>
              <p style={{fontSize: '14px', color: '#6b7280', margin: 0}}>Previously generated reports</p>
            </div>
          </div>
          <button style={{color: '#3b82f6', fontWeight: '500', fontSize: '14px', border: 'none', background: 'none', cursor: 'pointer'}}>
            View all
          </button>
        </div>

        <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
          {recentReports.map((report) => (
            <div key={report.id} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px',
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              transition: 'all 0.2s ease'
            }} onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f1f5f9';
              e.currentTarget.style.borderColor = '#cbd5e1';
            }} onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f8fafc';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}>
              <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: report.type === 'Sales' ? '#dbeafe' : '#d1fae5',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px'
                }}>
                  {report.type === 'Sales' ? '💰' : '📋'}
                </div>
                <div>
                  <div style={{fontWeight: '500', color: '#1f2937', fontSize: '16px'}}>
                    {report.type} Report
                  </div>
                  <div style={{fontSize: '14px', color: '#6b7280'}}>
                    {report.dateRange} • {report.totalRevenue}
                  </div>
                </div>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                <span style={{fontSize: '12px', color: '#6b7280'}}>
                  Generated {report.generatedDate}
                </span>
                <button style={{
                  padding: '8px 12px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                   onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}>
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Reports;