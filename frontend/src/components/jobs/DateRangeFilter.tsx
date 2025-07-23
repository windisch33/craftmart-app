import React, { useState } from 'react';
import './DateRangeFilter.css';

export interface DateRange {
  type: 'created' | 'delivery' | 'updated';
  startDate: string;
  endDate: string;
}

interface DateRangeFilterProps {
  dateRange: DateRange | null;
  onDateRangeChange: (dateRange: DateRange | null) => void;
  isLoading?: boolean;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  dateRange,
  onDateRangeChange,
  isLoading = false
}) => {
  const [localDateRange, setLocalDateRange] = useState<DateRange>({
    type: 'created',
    startDate: '',
    endDate: ''
  });

  const handleTypeChange = (type: DateRange['type']) => {
    const newRange = { ...localDateRange, type };
    setLocalDateRange(newRange);
    
    if (newRange.startDate && newRange.endDate) {
      onDateRangeChange(newRange);
    }
  };

  const handleStartDateChange = (startDate: string) => {
    const newRange = { ...localDateRange, startDate };
    setLocalDateRange(newRange);
    
    if (startDate && newRange.endDate) {
      onDateRangeChange(newRange);
    } else if (!startDate && !newRange.endDate) {
      onDateRangeChange(null);
    }
  };

  const handleEndDateChange = (endDate: string) => {
    const newRange = { ...localDateRange, endDate };
    setLocalDateRange(newRange);
    
    if (newRange.startDate && endDate) {
      onDateRangeChange(newRange);
    } else if (!newRange.startDate && !endDate) {
      onDateRangeChange(null);
    }
  };

  const clearDateRange = () => {
    const clearedRange = { type: localDateRange.type, startDate: '', endDate: '' };
    setLocalDateRange(clearedRange);
    onDateRangeChange(null);
  };

  const setPresetRange = (preset: 'today' | 'week' | 'month' | 'quarter' | 'year') => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    let startDate = '';
    
    switch (preset) {
      case 'today':
        startDate = today;
        break;
      case 'week':
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        startDate = weekAgo.toISOString().split('T')[0];
        break;
      case 'month':
        const monthAgo = new Date(now);
        monthAgo.setMonth(now.getMonth() - 1);
        startDate = monthAgo.toISOString().split('T')[0];
        break;
      case 'quarter':
        const quarterAgo = new Date(now);
        quarterAgo.setMonth(now.getMonth() - 3);
        startDate = quarterAgo.toISOString().split('T')[0];
        break;
      case 'year':
        const yearAgo = new Date(now);
        yearAgo.setFullYear(now.getFullYear() - 1);
        startDate = yearAgo.toISOString().split('T')[0];
        break;
    }
    
    const newRange = { ...localDateRange, startDate, endDate: today };
    setLocalDateRange(newRange);
    onDateRangeChange(newRange);
  };

  const dateTypeOptions = [
    { value: 'created', label: 'Created Date' },
    { value: 'updated', label: 'Updated Date' },
    { value: 'delivery', label: 'Delivery Date' }
  ];

  const presetOptions = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'Last 7 Days' },
    { value: 'month', label: 'Last 30 Days' },
    { value: 'quarter', label: 'Last 3 Months' },
    { value: 'year', label: 'Last Year' }
  ];

  const isActive = dateRange !== null || (localDateRange.startDate || localDateRange.endDate);

  return (
    <div className={`date-range-filter ${isLoading ? 'loading' : ''}`}>
      {/* Date Type Selection */}
      <div className="date-type-section">
        <label className="section-label">Date Type:</label>
        <div className="date-type-options">
          {dateTypeOptions.map(option => (
            <label key={option.value} className="radio-item">
              <input
                type="radio"
                name="dateType"
                value={option.value}
                checked={localDateRange.type === option.value}
                onChange={(e) => handleTypeChange(e.target.value as DateRange['type'])}
                disabled={isLoading}
              />
              <span className="radio-label">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Date Range Inputs */}
      <div className="date-inputs-section">
        <div className="date-input-group">
          <label className="input-label">From:</label>
          <input
            type="date"
            value={localDateRange.startDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            className="date-input"
            disabled={isLoading}
            max={localDateRange.endDate || undefined}
          />
        </div>
        <div className="date-input-group">
          <label className="input-label">To:</label>
          <input
            type="date"
            value={localDateRange.endDate}
            onChange={(e) => handleEndDateChange(e.target.value)}
            className="date-input"
            disabled={isLoading}
            min={localDateRange.startDate || undefined}
          />
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="preset-section">
        <label className="section-label">Quick Select:</label>
        <div className="preset-buttons">
          {presetOptions.map(preset => (
            <button
              key={preset.value}
              onClick={() => setPresetRange(preset.value as any)}
              className="preset-btn"
              disabled={isLoading}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active Filter Display & Clear */}
      {isActive && (
        <div className="active-filter-display">
          <div className="active-range-info">
            <span className="range-icon">📅</span>
            <span className="range-text">
              {localDateRange.startDate && localDateRange.endDate ? (
                <>
                  {localDateRange.startDate} to {localDateRange.endDate}
                  <span className="range-type">({localDateRange.type} dates)</span>
                </>
              ) : localDateRange.startDate ? (
                <>
                  From {localDateRange.startDate}
                  <span className="range-type">({localDateRange.type} dates)</span>
                </>
              ) : localDateRange.endDate ? (
                <>
                  Until {localDateRange.endDate}
                  <span className="range-type">({localDateRange.type} dates)</span>
                </>
              ) : null}
            </span>
          </div>
          <button
            onClick={clearDateRange}
            className="clear-range-btn"
            disabled={isLoading}
            title="Clear date range"
          >
            ×
          </button>
        </div>
      )}

      {/* Instructions */}
      {!isActive && (
        <div className="filter-instructions">
          <span className="instruction-icon">💡</span>
          <span className="instruction-text">
            Select dates to filter jobs by {localDateRange.type} date
          </span>
        </div>
      )}
    </div>
  );
};

export default DateRangeFilter;