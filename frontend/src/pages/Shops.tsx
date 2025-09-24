import React, { useState, useEffect, useCallback } from 'react';
import '../styles/common.css';
import './Shops.css';
import { shopService, type Shop } from '../services/shopService';
import { useToast } from '../components/common/ToastProvider';
import EmptyState from '../components/common/EmptyState';
import { FactoryIcon, SearchIcon, CalendarIcon } from '../components/common/icons';
import AccessibleModal from '../components/common/AccessibleModal';

const Shops: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGenerationModal, setShowGenerationModal] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [sortBy, setSortBy] = useState<'shop_number' | 'status' | 'generated_date' | 'jobs' | 'cut_sheet_count'>('generated_date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const { showToast } = useToast();

  // Define styles first so they can be used in conditional returns
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
      case 'generated':
        return { bg: '#fef3c7', color: '#92400e', border: '#fbbf24' };
      case 'in_progress':
        return { bg: '#fae8ff', color: '#86198f', border: 'var(--color-primary)' };
      case 'completed':
        return { bg: '#d1fae5', color: '#065f46', border: '#10b981' };
      default:
        return { bg: '#f3f4f6', color: '#374151', border: '#d1d5db' };
    }
  };

  // Load shops on component mount
  useEffect(() => {
    loadShops();
  }, []);

  const loadShops = async () => {
    try {
      setLoading(true);
      setError(null);
      const shopsData = await shopService.getShops();
      setShops(shopsData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredShops = shops.filter(shop => {
    const searchFields = [
      shop.shop_number,
      shop.notes || ''
    ].join(' ').toLowerCase();
    
    const matchesSearch = searchFields.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || shop.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedShops = [...filteredShops].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    if (sortBy === 'jobs') {
      const av = a.jobs?.length || 0; const bv = b.jobs?.length || 0;
      return (av - bv) * dir;
    }
    if (sortBy === 'cut_sheet_count') {
      const av = a.cut_sheet_count || 0; const bv = b.cut_sheet_count || 0;
      return (av - bv) * dir;
    }
    const av: any = (a as any)[sortBy];
    const bv: any = (b as any)[sortBy];
    if (!av && !bv) return 0;
    if (!av) return 1 * dir;
    if (!bv) return -1 * dir;
    if (sortBy === 'generated_date') {
      return (new Date(av).getTime() - new Date(bv).getTime()) * dir;
    }
    return String(av).localeCompare(String(bv)) * dir;
  });

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const allSelectedOnPage = sortedShops.length > 0 && sortedShops.every(s => selected.has(s.id));
  const toggleSelectAll = () => {
    setSelected(prev => {
      const next = new Set(prev);
      if (allSelectedOnPage) {
        sortedShops.forEach(s => next.delete(s.id));
      } else {
        sortedShops.forEach(s => next.add(s.id));
      }
      return next;
    });
  };

  const handleBulkDownload = async (type: 'paper' | 'cut') => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    try {
      for (const id of ids) {
        if (type === 'paper') await shopService.downloadShopPaper(id);
        else await shopService.downloadCutList(id);
      }
      showToast(`Started ${type === 'paper' ? 'Shop Paper' : 'Cut List'} downloads`, { type: 'success' });
    } catch (_e) {
      showToast('Some downloads may have failed', { type: 'error' });
    }
  };

  const handleBulkStatus = async (newStatus: 'generated' | 'in_progress' | 'completed') => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    try {
      for (const id of ids) {
        await shopService.updateShopStatus(id, newStatus);
      }
      await loadShops();
      showToast(`Updated ${ids.length} shop(s) to ${newStatus.replace('_',' ')}`, { type: 'success' });
      setSelected(new Set());
    } catch (_e) {
      showToast('Failed updating some shops', { type: 'error' });
    }
  };

  const handleDownloadShopPaper = async (shopId: number) => {
    try {
      await shopService.downloadShopPaper(shopId);
      showToast('Shop paper downloaded', { type: 'success' });
    } catch (_err: any) {
      showToast('Failed to download shop paper', { type: 'error' });
    }
  };

  const handleDownloadCutList = async (shopId: number) => {
    try {
      await shopService.downloadCutList(shopId);
      showToast('Cut list downloaded', { type: 'success' });
    } catch (_err: any) {
      showToast('Failed to download cut list', { type: 'error' });
    }
  };

  const handleUpdateStatus = async (shopId: number, newStatus: 'generated' | 'in_progress' | 'completed') => {
    try {
      await shopService.updateShopStatus(shopId, newStatus);
      await loadShops(); // Refresh the list
      showToast(`Shop status updated to ${newStatus.replace('_', ' ')}`, { type: 'success' });
    } catch (_err: any) {
      showToast('Failed to update status', { type: 'error' });
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) {
      return '—';
    }
    const parsed = new Date(dateString);
    return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="container">
        <div style={{...cardStyle, textAlign: 'center', padding: '48px 24px'}}>
          <div style={{fontSize: '18px', color: '#6b7280'}}>Loading shops...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div style={{...cardStyle, textAlign: 'center', padding: '48px 24px'}}>
          <div style={{fontSize: '18px', color: '#dc2626', marginBottom: '16px'}}>Error loading shops</div>
          <div style={{color: '#6b7280', marginBottom: '24px'}}>{error}</div>
          <button 
            className="btn btn-primary"
            onClick={loadShops}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`container ${density === 'compact' ? 'density-compact' : ''}`}>
      {/* Header */}
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="gradient-title">Shops</h1>
          <p className="page-subtitle">Manage production floor and cut sheets</p>
        </div>
        <div className="page-actions">
          <button 
            className="btn btn-primary"
            onClick={() => setShowGenerationModal(true)}
          >
            <span className="nav-icon"><FactoryIcon /></span>
            Generate Shops
          </button>
        </div>
      </div>

      {/* Sticky toolbar */}
      <div className="shops-toolbar desktop-only">
        <div className="shops-toolbar-row">
          <div className="shops-search">
            <input
              type="text"
              placeholder="Search shops by number or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search shops"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
            <option value="all">All Status</option>
            <option value="generated">Generated</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <select value={density} onChange={(e) => setDensity(e.target.value as any)} aria-label="Density">
            <option value="comfortable">Comfortable</option>
            <option value="compact">Compact</option>
          </select>
          <select value={viewMode} onChange={(e) => setViewMode(e.target.value as any)} aria-label="View mode">
            <option value="table">Table</option>
            <option value="cards">Cards</option>
          </select>
          <button onClick={loadShops} aria-label="Refresh">Refresh</button>
        </div>
      </div>

      {/* Desktop table view */}
      {viewMode === 'table' && (
        <div className="desktop-only">
          <div className="shops-table-wrap">
            <table className="shops-table">
              <thead>
                <tr>
                  <th><input type="checkbox" checked={allSelectedOnPage} onChange={toggleSelectAll} aria-label="Select all" /></th>
                  <th onClick={() => { setSortBy('shop_number'); setSortDir(sortBy==='shop_number' && sortDir==='asc' ? 'desc' : 'asc'); }}>Shop #</th>
                  <th onClick={() => { setSortBy('status'); setSortDir(sortBy==='status' && sortDir==='asc' ? 'desc' : 'asc'); }}>Status</th>
                  <th onClick={() => { setSortBy('jobs'); setSortDir(sortBy==='jobs' && sortDir==='asc' ? 'desc' : 'asc'); }}>Jobs</th>
                  <th onClick={() => { setSortBy('cut_sheet_count'); setSortDir(sortBy==='cut_sheet_count' && sortDir==='asc' ? 'desc' : 'asc'); }}>Cut Sheets</th>
                  <th onClick={() => { setSortBy('generated_date'); setSortDir(sortBy==='generated_date' && sortDir==='asc' ? 'desc' : 'asc'); }}>Generated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedShops.map(shop => {
                  const statusClass = shop.status === 'generated' ? 'badge--generated' : shop.status === 'in_progress' ? 'badge--in_progress' : 'badge--completed';
                  return (
                    <tr key={shop.id}>
                      <td><input type="checkbox" checked={selected.has(shop.id)} onChange={() => toggleSelect(shop.id)} aria-label={`Select ${shop.shop_number}`} /></td>
                      <td>{shop.shop_number}</td>
                      <td><span className={`badge ${statusClass}`}>{shop.status.replace('_',' ')}</span></td>
                      <td>{shop.jobs?.length || 0}</td>
                      <td>{shop.cut_sheet_count || (shop.cut_sheets?.length || 0)}</td>
                      <td>{shop.generated_date ? new Date(shop.generated_date).toLocaleDateString() : '—'}</td>
                      <td>
                        <div className="actions-row">
                          <button className="btn-primary" onClick={() => handleDownloadShopPaper(shop.id)}>Shop Paper</button>
                          <button onClick={() => handleDownloadCutList(shop.id)}>Cut List</button>
                          <select value={shop.status} onChange={(e) => handleUpdateStatus(shop.id, e.target.value as any)} aria-label={`Update status for ${shop.shop_number}`}>
                            <option value="generated">Generated</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {selected.size > 0 && (
            <div className="bulkbar">
              <span><strong>{selected.size}</strong> selected</span>
              <button onClick={() => handleBulkDownload('paper')}>Download Shop Paper</button>
              <button onClick={() => handleBulkDownload('cut')}>Download Cut List</button>
              <span>Set status:</span>
              <button onClick={() => handleBulkStatus('generated')}>Generated</button>
              <button onClick={() => handleBulkStatus('in_progress')}>In Progress</button>
              <button onClick={() => handleBulkStatus('completed')}>Completed</button>
              <button onClick={() => setSelected(new Set())} aria-label="Clear selection">Clear</button>
            </div>
          )}
        </div>
      )}

      {/* Cards view (mobile always; desktop when viewMode is Cards) */}
      <div className={`${viewMode === 'cards' ? '' : 'mobile-only'}`} style={{
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
                    <FactoryIcon />
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: '#1f2937',
                      margin: 0,
                      transition: 'color 0.2s ease'
                    }}>
                      {shop.shop_number}
                    </h3>
                    <p style={{fontSize: '14px', color: '#6b7280', margin: 0}}>
                      Shop #{shop.id}
                    </p>
                  </div>
              </div>
              <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                <select
                  value={shop.status}
                  onChange={(e) => handleUpdateStatus(shop.id, e.target.value as any)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: statusStyle.bg,
                      color: statusStyle.color,
                      border: `1px solid ${statusStyle.border}`,
                      textTransform: 'uppercase',
                      cursor: 'pointer'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="generated">Generated</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              {shop.jobs && shop.jobs.length > 0 && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  marginBottom: '16px'
                }}>
                  {shop.jobs.map(job => (
                    <div
                      key={job.job_id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: '#f9fafb',
                        borderRadius: '10px',
                        padding: '10px 12px'
                      }}
                    >
                      <div>
                        <div style={{fontSize: '14px', fontWeight: 600, color: '#1f2937'}}>
                          {job.job_title || job.lot_name || job.order_number || `Job ${job.job_id}`}
                        </div>
                        <div style={{fontSize: '12px', color: '#6b7280'}}>
                          {job.customer_name}
                          {job.lot_name ? ` • Lot ${job.lot_name}` : ''}
                        </div>
                        {job.order_designation && (
                          <div style={{fontSize: '12px', color: '#6b7280'}}>
                            Order: {job.order_designation}
                          </div>
                        )}
                        {job.model_name && (
                          <div style={{fontSize: '12px', color: '#6b7280'}}>
                            Model: {job.model_name}
                          </div>
                        )}
                      </div>
                      <div style={{textAlign: 'right', fontSize: '12px', color: '#6b7280'}}>
                        {job.job_location && <div>{job.job_location}</div>}
                        {job.contact_person && <div>Contact: {job.contact_person}</div>}
                        {job.sales_rep_name && <div>Sales: {job.sales_rep_name}</div>}
                        <div>Delivery: {formatDate(job.delivery_date)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Cut Sheet Info */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '16px',
                padding: '16px',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                marginBottom: '16px'
              }}>
                <div style={{textAlign: 'center'}}>
                  <div style={{fontSize: '24px', fontWeight: 'bold', color: '#1f2937'}}>{shop.jobs?.length ?? 0}</div>
                  <div style={{fontSize: '12px', color: '#6b7280'}}>Jobs</div>
                </div>
                <div style={{textAlign: 'center'}}>
                  <div style={{fontSize: '24px', fontWeight: 'bold', color: '#1f2937'}}>{shop.cut_sheet_count || 0}</div>
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
                  <span style={{display: 'inline-flex'}}><CalendarIcon /></span>
                  <span style={{fontSize: '14px', color: '#6b7280'}}>Generated: {formatDate(shop.generated_date)}</span>
                </div>
              </div>

              {/* Notes */}
              {shop.notes && (
                <div style={{marginBottom: '16px'}}>
                  <p style={{fontSize: '14px', color: '#6b7280', lineHeight: '1.5', fontStyle: 'italic'}}>
                    {shop.notes}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
                <button 
                  style={{
                    flex: 1,
                    minWidth: '120px',
                    padding: '10px 16px',
                    backgroundColor: 'var(--color-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontSize: '14px'
                  }} 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadShopPaper(shop.id);
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary)'}
                >
                  Shop Paper
                </button>
                <button 
                  style={{
                    flex: 1,
                    minWidth: '120px',
                    padding: '10px 16px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontSize: '14px'
                  }} 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadCutList(shop.id);
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
                >
                  Cut List
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
            <FactoryIcon />
          </div>
          <h3 style={{fontSize: '18px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px'}}>
            {searchTerm || statusFilter !== 'all' ? 'No shops found' : 'No shops yet'}
          </h3>
          <p style={{color: '#6b7280', marginBottom: '24px'}}>
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search criteria or filters' 
              : 'Get started by generating shops from orders'}
          </p>
          <button 
            className="btn btn-primary"
            onClick={() => setShowGenerationModal(true)}
          >
            <span className="nav-icon"><FactoryIcon /></span>
            Generate Shops
          </button>
        </div>
      )}

      {/* Shop Generation Modal */}
      {showGenerationModal && (
        <ShopGenerationModal
          onClose={() => setShowGenerationModal(false)}
          onShopGenerated={() => {
            setShowGenerationModal(false);
            loadShops();
          }}
        />
      )}
    </div>
  );
};

// Simple modal component for shop generation
const ShopGenerationModal: React.FC<{
  onClose: () => void;
  onShopGenerated: () => void;
}> = ({ onClose, onShopGenerated }) => {
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [filter, setFilter] = useState<'all' | 'unrun'>('unrun');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const loadAvailableOrders = useCallback(async () => {
    try {
      setLoading(true);
      const orders = await shopService.getAvailableOrders(filter);
      setAvailableOrders(orders);
    } catch (err: any) {
      alert('Error loading orders: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadAvailableOrders();
  }, [loadAvailableOrders]);

  const handleGenerateShops = async () => {
    if (selectedOrders.length === 0) {
      alert('Please select at least one order');
      return;
    }

    try {
      setGenerating(true);
      await shopService.generateShops(selectedOrders);
      onShopGenerated();
    } catch (err: any) {
      alert('Error generating shops: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const toggleOrder = (orderId: number) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  return (
    <AccessibleModal 
      isOpen={true}
      onClose={onClose}
      labelledBy="generate-shops-title"
      overlayClassName="shops-modal-overlay"
      contentClassName="shops-modal-content"
    >
      <div>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
          <h2 id="generate-shops-title" style={{margin: 0, fontSize: '20px', fontWeight: 'bold'}}>Generate Shops</h2>
          <button 
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              background: 'none',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              padding: '6px 10px'
            }}
          >
            Close
          </button>
        </div>

        <div style={{marginBottom: '20px'}}>
          <label htmlFor="shops-filter-select" style={{display: 'block', marginBottom: '8px', fontWeight: '500'}}>
            Filter Orders:
          </label>
          <select 
            id="shops-filter-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'unrun')}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px'
            }}
          >
            <option value="unrun">Orders without shops</option>
            <option value="all">All orders</option>
          </select>
        </div>

        {loading ? (
          <div style={{textAlign: 'center', padding: '40px'}}>Loading orders...</div>
        ) : (
          <>
            <div style={{marginBottom: '20px'}}>
              <h3 style={{fontSize: '16px', fontWeight: '600', marginBottom: '12px'}}>
                Available Orders ({availableOrders.length})
              </h3>
              <div style={{maxHeight: '300px', overflow: 'auto', border: '1px solid #e5e7eb', borderRadius: '6px'}}>
                {availableOrders.map(order => (
                  <div 
                    key={order.id}
                    style={{
                      padding: '12px',
                      borderBottom: '1px solid #f3f4f6',
                      cursor: 'pointer',
                      backgroundColor: selectedOrders.includes(order.id) ? '#eff6ff' : 'white'
                    }}
                    onClick={() => toggleOrder(order.id)}
                  >
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                      <input 
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => toggleOrder(order.id)}
                        aria-label={`Select order ${order.title}`}
                      />
                      <div style={{flex: 1}}>
                        <div style={{fontWeight: '500', fontSize: '14px'}}>{order.title}</div>
                        <div style={{fontSize: '12px', color: '#6b7280'}}>
                          {order.customer_name} • {order.stair_config_count} configurations
                          {order.shops_run && ' • Shops already run'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {availableOrders.length === 0 && (
                  <div style={{padding: '40px', textAlign: 'center', color: '#6b7280'}}>
                    No available orders found
                  </div>
                )}
              </div>
            </div>

            <div style={{display: 'flex', gap: '12px', justifyContent: 'flex-end'}}>
              <button 
                onClick={onClose}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleGenerateShops}
                disabled={selectedOrders.length === 0 || generating}
                style={{
                  padding: '10px 20px',
                  backgroundColor: selectedOrders.length > 0 ? 'var(--color-primary)' : '#e5e7eb',
                  color: selectedOrders.length > 0 ? 'white' : '#9ca3af',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: selectedOrders.length > 0 ? 'pointer' : 'not-allowed'
                }}
                aria-disabled={selectedOrders.length === 0 || generating}
              >
                {generating ? 'Generating...' : `Generate Shops (${selectedOrders.length})`}
              </button>
            </div>
          </>
        )}
      </div>
    </AccessibleModal>
  );
};

export default Shops;
