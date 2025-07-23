import React, { useState } from 'react';
import DateRangeFilter from './DateRangeFilter';
import AmountRangeFilter from './AmountRangeFilter';
import SortControls from './SortControls';
import './FilterPanel.css';

export interface FilterCriteria {
  status: string[];
  salesman: string[];
  dateRange: {
    type: 'created' | 'delivery' | 'updated';
    startDate: string;
    endDate: string;
  } | null;
  amountRange: {
    type: 'total' | 'subtotal' | 'labor';
    min: number;
    max: number;
  } | null;
  sortBy: 'created_date' | 'total_amount' | 'customer_name' | 'title' | 'updated_at';
  sortOrder: 'asc' | 'desc';
}

interface FilterPanelProps {
  onFilterChange: (filters: FilterCriteria) => void;
  salesmenOptions: Array<{ id: string; name: string }>;
  isLoading?: boolean;
  activeFiltersCount: number;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  onFilterChange,
  salesmenOptions,
  isLoading = false,
  activeFiltersCount
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<FilterCriteria>({
    status: [],
    salesman: [],
    dateRange: null,
    amountRange: null,
    sortBy: 'created_date',
    sortOrder: 'desc'
  });

  const handleFilterUpdate = (newFilters: Partial<FilterCriteria>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const handleStatusChange = (status: string, checked: boolean) => {
    const newStatus = checked
      ? [...filters.status, status]
      : filters.status.filter(s => s !== status);
    
    handleFilterUpdate({ status: newStatus });
  };

  const handleSalesmanChange = (salesmanId: string, checked: boolean) => {
    const newSalesman = checked
      ? [...filters.salesman, salesmanId]
      : filters.salesman.filter(s => s !== salesmanId);
    
    handleFilterUpdate({ salesman: newSalesman });
  };

  const clearAllFilters = () => {
    const clearedFilters: FilterCriteria = {
      status: [],
      salesman: [],
      dateRange: null,
      amountRange: null,
      sortBy: 'created_date',
      sortOrder: 'desc'
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.status.length > 0) count++;
    if (filters.salesman.length > 0) count++;
    if (filters.dateRange) count++;
    if (filters.amountRange) count++;
    return count;
  };

  const statusOptions = [
    { value: 'quote', label: 'Quotes', color: '#f59e0b' },
    { value: 'order', label: 'Orders', color: '#3b82f6' },
    { value: 'invoice', label: 'Invoices', color: '#10b981' }
  ];

  return (
    <div className="filter-panel">
      {/* Filter Panel Header */}
      <div className="filter-header">
        <button
          className={`filter-toggle-btn ${isExpanded ? 'expanded' : ''}`}
          onClick={() => setIsExpanded(!isExpanded)}
          disabled={isLoading}
        >
          <span className="filter-icon">🔽</span>
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <span className="filter-badge">{activeFiltersCount}</span>
          )}
        </button>

        <div className="filter-actions">
          <SortControls
            sortBy={filters.sortBy}
            sortOrder={filters.sortOrder}
            onSortChange={(sortBy, sortOrder) => handleFilterUpdate({ sortBy, sortOrder })}
            isLoading={isLoading}
          />
          
          {getActiveFiltersCount() > 0 && (
            <button
              className="clear-filters-btn"
              onClick={clearAllFilters}
              disabled={isLoading}
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Expanded Filter Options */}
      {isExpanded && (
        <div className="filter-content">
          <div className="filter-sections">
            {/* Status Filters */}
            <div className="filter-section">
              <h4 className="filter-section-title">Status</h4>
              <div className="checkbox-group">
                {statusOptions.map(option => (
                  <label key={option.value} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={filters.status.includes(option.value)}
                      onChange={(e) => handleStatusChange(option.value, e.target.checked)}
                      disabled={isLoading}
                    />
                    <span 
                      className="checkbox-label"
                      style={{ borderLeft: `4px solid ${option.color}` }}
                    >
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Salesman Filters */}
            <div className="filter-section">
              <h4 className="filter-section-title">Salesman</h4>
              <div className="checkbox-group">
                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={filters.salesman.length === 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleFilterUpdate({ salesman: [] });
                      }
                    }}
                    disabled={isLoading}
                  />
                  <span className="checkbox-label">All Salesmen</span>
                </label>
                {salesmenOptions.map(salesman => (
                  <label key={salesman.id} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={filters.salesman.includes(salesman.id)}
                      onChange={(e) => handleSalesmanChange(salesman.id, e.target.checked)}
                      disabled={isLoading}
                    />
                    <span className="checkbox-label">{salesman.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="filter-section">
              <h4 className="filter-section-title">Date Range</h4>
              <DateRangeFilter
                dateRange={filters.dateRange}
                onDateRangeChange={(dateRange) => handleFilterUpdate({ dateRange })}
                isLoading={isLoading}
              />
            </div>

            {/* Amount Range Filter */}
            <div className="filter-section">
              <h4 className="filter-section-title">Amount Range</h4>
              <AmountRangeFilter
                amountRange={filters.amountRange}
                onAmountRangeChange={(amountRange) => handleFilterUpdate({ amountRange })}
                isLoading={isLoading}
              />
            </div>
          </div>

          {/* Filter Summary */}
          <div className="filter-summary">
            <div className="active-filters">
              {filters.status.length > 0 && (
                <span className="filter-tag">
                  Status: {filters.status.join(', ')}
                  <button 
                    onClick={() => handleFilterUpdate({ status: [] })}
                    className="remove-filter"
                  >×</button>
                </span>
              )}
              {filters.salesman.length > 0 && (
                <span className="filter-tag">
                  Salesman: {filters.salesman.length} selected
                  <button 
                    onClick={() => handleFilterUpdate({ salesman: [] })}
                    className="remove-filter"
                  >×</button>
                </span>
              )}
              {filters.dateRange && (
                <span className="filter-tag">
                  {filters.dateRange.type} date range
                  <button 
                    onClick={() => handleFilterUpdate({ dateRange: null })}
                    className="remove-filter"
                  >×</button>
                </span>
              )}
              {filters.amountRange && (
                <span className="filter-tag">
                  {filters.amountRange.type} amount range
                  <button 
                    onClick={() => handleFilterUpdate({ amountRange: null })}
                    className="remove-filter"
                  >×</button>
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;