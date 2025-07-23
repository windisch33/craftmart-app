import React, { useState, useEffect } from 'react';
import './AdvancedSearchBar.css';

export interface SearchCriteria {
  searchTerm: string;
  searchField: 'all' | 'title' | 'customer' | 'jobNumber' | 'salesman';
  searchOperator: 'contains' | 'startsWith' | 'exact';
}

interface AdvancedSearchBarProps {
  onSearchChange: (criteria: SearchCriteria) => void;
  totalResults: number;
  isLoading?: boolean;
}

const AdvancedSearchBar: React.FC<AdvancedSearchBarProps> = ({
  onSearchChange,
  totalResults,
  isLoading = false
}) => {
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({
    searchTerm: '',
    searchField: 'title',
    searchOperator: 'contains'
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearchChange(searchCriteria);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchCriteria, onSearchChange]);

  const handleSearchTermChange = (value: string) => {
    setSearchCriteria(prev => ({
      ...prev,
      searchTerm: value
    }));
  };

  const handleFieldChange = (field: SearchCriteria['searchField']) => {
    setSearchCriteria(prev => ({
      ...prev,
      searchField: field
    }));
  };

  const handleOperatorChange = (operator: SearchCriteria['searchOperator']) => {
    setSearchCriteria(prev => ({
      ...prev,
      searchOperator: operator
    }));
  };

  const clearSearch = () => {
    setSearchCriteria({
      searchTerm: '',
      searchField: 'title',
      searchOperator: 'contains'
    });
  };

  const quickSearchPresets = [
    { label: 'All Jobs', criteria: { searchTerm: '', searchField: 'all' as const, searchOperator: 'contains' as const } },
    { label: 'Recent Orders', criteria: { searchTerm: 'order', searchField: 'all' as const, searchOperator: 'contains' as const } },
    { label: 'Pending Quotes', criteria: { searchTerm: 'quote', searchField: 'all' as const, searchOperator: 'contains' as const } }
  ];

  const getFieldLabel = (field: string) => {
    switch (field) {
      case 'all': return 'All Fields';
      case 'title': return 'Job Title';
      case 'customer': return 'Customer';
      case 'jobNumber': return 'Job Number';
      case 'salesman': return 'Salesman';
      default: return 'All Fields';
    }
  };

  const getOperatorLabel = (operator: string) => {
    switch (operator) {
      case 'contains': return 'Contains';
      case 'startsWith': return 'Starts With';
      case 'exact': return 'Exact Match';
      default: return 'Contains';
    }
  };

  return (
    <div className="advanced-search-bar">
      {/* Main Search Input */}
      <div className="search-input-section">
        <div className="search-input-wrapper">
          <div className="search-icon">
            {isLoading ? (
              <div className="search-spinner"></div>
            ) : (
              <span>🔍</span>
            )}
          </div>
          <input
            type="text"
            placeholder={`Search ${getFieldLabel(searchCriteria.searchField).toLowerCase()}...`}
            value={searchCriteria.searchTerm}
            onChange={(e) => handleSearchTermChange(e.target.value)}
            className="search-input"
            disabled={isLoading}
          />
          {searchCriteria.searchTerm && (
            <button
              className="clear-search-btn"
              onClick={clearSearch}
              disabled={isLoading}
            >
              ×
            </button>
          )}
        </div>

        <button
          className={`advanced-toggle-btn ${showAdvanced ? 'active' : ''}`}
          onClick={() => setShowAdvanced(!showAdvanced)}
          disabled={isLoading}
        >
          <span>⚙️</span>
          Advanced
        </button>
      </div>

      {/* Advanced Options Panel */}
      {showAdvanced && (
        <div className="advanced-options-panel">
          <div className="advanced-row">
            <div className="option-group">
              <label>Search In:</label>
              <select
                value={searchCriteria.searchField}
                onChange={(e) => handleFieldChange(e.target.value as SearchCriteria['searchField'])}
                className="field-select"
                disabled={isLoading}
              >
                <option value="title">Job Title</option>
                <option value="all">All Fields</option>
                <option value="customer">Customer Name</option>
                <option value="jobNumber">Job Number</option>
                <option value="salesman">Salesman</option>
              </select>
            </div>

            <div className="option-group">
              <label>Match Type:</label>
              <select
                value={searchCriteria.searchOperator}
                onChange={(e) => handleOperatorChange(e.target.value as SearchCriteria['searchOperator'])}
                className="operator-select"
                disabled={isLoading}
              >
                <option value="contains">Contains</option>
                <option value="startsWith">Starts With</option>
                <option value="exact">Exact Match</option>
              </select>
            </div>
          </div>

          {/* Quick Search Presets */}
          <div className="quick-presets">
            <label>Quick Search:</label>
            <div className="preset-buttons">
              {quickSearchPresets.map((preset, index) => (
                <button
                  key={index}
                  className="preset-btn"
                  onClick={() => setSearchCriteria(preset.criteria)}
                  disabled={isLoading}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search Results Summary */}
      <div className="search-summary">
        <span className="results-count">
          {isLoading ? (
            'Searching...'
          ) : (
            <>
              <strong>{totalResults}</strong> job{totalResults !== 1 ? 's' : ''} found
              {searchCriteria.searchTerm && (
                <span className="search-details">
                  {' '}for "{searchCriteria.searchTerm}" in {getFieldLabel(searchCriteria.searchField)}
                </span>
              )}
            </>
          )}
        </span>
        
        {(searchCriteria.searchTerm || searchCriteria.searchField !== 'all' || searchCriteria.searchOperator !== 'contains') && (
          <button
            className="clear-all-btn"
            onClick={clearSearch}
            disabled={isLoading}
          >
            Clear Search
          </button>
        )}
      </div>
    </div>
  );
};

export default AdvancedSearchBar;