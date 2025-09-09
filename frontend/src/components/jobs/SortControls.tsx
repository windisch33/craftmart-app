import React from 'react';
import { CalendarIcon, RefreshIcon, DollarIcon, UserIcon, ClipboardIcon, ChevronUpIcon, ChevronDownIcon } from '../common/icons';
import './SortControls.css';

export type SortField = 'created_date' | 'total_amount' | 'customer_name' | 'title' | 'updated_at';
export type SortOrder = 'asc' | 'desc';

interface SortControlsProps {
  sortBy: SortField;
  sortOrder: SortOrder;
  onSortChange: (sortBy: SortField, sortOrder: SortOrder) => void;
  isLoading?: boolean;
  showLabel?: boolean;
}

const SortControls: React.FC<SortControlsProps> = ({
  sortBy,
  sortOrder,
  onSortChange,
  isLoading = false,
  showLabel = true
}) => {
  const handleSortFieldChange = (newSortBy: SortField) => {
    onSortChange(newSortBy, sortOrder);
  };

  const handleSortOrderToggle = () => {
    const newSortOrder: SortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    onSortChange(sortBy, newSortOrder);
  };

  const sortFieldOptions = [
    { value: 'created_date', label: 'Created Date', icon: <CalendarIcon width={16} height={16} /> },
    { value: 'updated_at', label: 'Updated Date', icon: <RefreshIcon width={16} height={16} /> },
    { value: 'total_amount', label: 'Total Amount', icon: <DollarIcon width={16} height={16} /> },
    { value: 'customer_name', label: 'Customer Name', icon: <UserIcon width={16} height={16} /> },
    { value: 'title', label: 'Job Title', icon: <ClipboardIcon width={16} height={16} /> }
  ];

  const getCurrentFieldLabel = () => {
    const currentField = sortFieldOptions.find(option => option.value === sortBy);
    return currentField ? currentField.label : 'Created Date';
  };

  const getSortOrderIcon = () => {
    return sortOrder === 'asc' ? <ChevronUpIcon width={16} height={16} /> : <ChevronDownIcon width={16} height={16} />;
  };

  const getSortOrderLabel = () => {
    return sortOrder === 'asc' ? 'Ascending' : 'Descending';
  };

  return (
    <div className={`sort-controls ${isLoading ? 'loading' : ''}`}>
      {showLabel && (
        <label className="sort-label">Sort by:</label>
      )}
      
      <div className="sort-controls-group">
        {/* Sort Field Selector */}
        <div className="sort-field-wrapper">
          <select
            value={sortBy}
            onChange={(e) => handleSortFieldChange(e.target.value as SortField)}
            className="sort-field-select"
            disabled={isLoading}
            title={`Sort by ${getCurrentFieldLabel()}`}
          >
            {sortFieldOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="sort-field-display"><ChevronDownIcon width={12} height={12} /></div>
        </div>

        {/* Sort Order Toggle */}
        <button
          onClick={handleSortOrderToggle}
          className={`sort-order-btn ${sortOrder}`}
          disabled={isLoading}
          title={`Sort ${getSortOrderLabel().toLowerCase()}`}
        >
          <span className="order-icon">{getSortOrderIcon()}</span>
          <span className="order-text-mobile">{getSortOrderLabel()}</span>
        </button>
      </div>

      {/* Sort Summary */}
      <div className="sort-summary">
        <span className="summary-text">
          Sorted by {getCurrentFieldLabel().toLowerCase()} ({getSortOrderLabel().toLowerCase()})
        </span>
      </div>
    </div>
  );
};

export default SortControls;
