import React, { useState, useEffect } from 'react';
import './AmountRangeFilter.css';

export interface AmountRange {
  type: 'total' | 'subtotal' | 'labor';
  min: number;
  max: number;
}

interface AmountRangeFilterProps {
  amountRange: AmountRange | null;
  onAmountRangeChange: (amountRange: AmountRange | null) => void;
  isLoading?: boolean;
}

const AmountRangeFilter: React.FC<AmountRangeFilterProps> = ({
  amountRange,
  onAmountRangeChange,
  isLoading = false
}) => {
  const [localAmountRange, setLocalAmountRange] = useState<AmountRange>({
    type: 'total',
    min: 0,
    max: 0
  });
  const [minInput, setMinInput] = useState('');
  const [maxInput, setMaxInput] = useState('');

  // Update local state when prop changes
  useEffect(() => {
    if (amountRange) {
      setLocalAmountRange(amountRange);
      setMinInput(amountRange.min.toString());
      setMaxInput(amountRange.max.toString());
    } else {
      setMinInput('');
      setMaxInput('');
    }
  }, [amountRange]);

  const handleTypeChange = (type: AmountRange['type']) => {
    const newRange = { ...localAmountRange, type };
    setLocalAmountRange(newRange);
    
    if (newRange.min > 0 || newRange.max > 0) {
      onAmountRangeChange(newRange);
    }
  };

  const handleMinChange = (value: string) => {
    setMinInput(value);
    const numValue = parseFloat(value) || 0;
    const newRange = { ...localAmountRange, min: numValue };
    setLocalAmountRange(newRange);
    
    if (numValue > 0 || newRange.max > 0) {
      onAmountRangeChange(newRange);
    } else if (numValue === 0 && newRange.max === 0) {
      onAmountRangeChange(null);
    }
  };

  const handleMaxChange = (value: string) => {
    setMaxInput(value);
    const numValue = parseFloat(value) || 0;
    const newRange = { ...localAmountRange, max: numValue };
    setLocalAmountRange(newRange);
    
    if (newRange.min > 0 || numValue > 0) {
      onAmountRangeChange(newRange);
    } else if (newRange.min === 0 && numValue === 0) {
      onAmountRangeChange(null);
    }
  };

  const clearAmountRange = () => {
    const clearedRange = { type: localAmountRange.type, min: 0, max: 0 };
    setLocalAmountRange(clearedRange);
    setMinInput('');
    setMaxInput('');
    onAmountRangeChange(null);
  };

  const setPresetRange = (preset: 'under1k' | '1k-5k' | '5k-10k' | '10k-25k' | 'over25k') => {
    let min = 0;
    let max = 0;
    
    switch (preset) {
      case 'under1k':
        min = 0;
        max = 1000;
        break;
      case '1k-5k':
        min = 1000;
        max = 5000;
        break;
      case '5k-10k':
        min = 5000;
        max = 10000;
        break;
      case '10k-25k':
        min = 10000;
        max = 25000;
        break;
      case 'over25k':
        min = 25000;
        max = 0; // 0 means no upper limit
        break;
    }
    
    const newRange = { ...localAmountRange, min, max };
    setLocalAmountRange(newRange);
    setMinInput(min.toString());
    setMaxInput(max > 0 ? max.toString() : '');
    onAmountRangeChange(newRange);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const amountTypeOptions = [
    { value: 'total', label: 'Total Amount' },
    { value: 'subtotal', label: 'Subtotal' },
    { value: 'labor', label: 'Labor Cost' }
  ];

  const presetOptions = [
    { value: 'under1k', label: 'Under $1K' },
    { value: '1k-5k', label: '$1K - $5K' },
    { value: '5k-10k', label: '$5K - $10K' },
    { value: '10k-25k', label: '$10K - $25K' },
    { value: 'over25k', label: 'Over $25K' }
  ];

  const isActive = amountRange !== null || (localAmountRange.min > 0 || localAmountRange.max > 0);

  return (
    <div className={`amount-range-filter ${isLoading ? 'loading' : ''}`}>
      {/* Amount Type Selection */}
      <div className="amount-type-section">
        <label className="section-label">Amount Type:</label>
        <div className="amount-type-options">
          {amountTypeOptions.map(option => (
            <label key={option.value} className="radio-item">
              <input
                type="radio"
                name="amountType"
                value={option.value}
                checked={localAmountRange.type === option.value}
                onChange={(e) => handleTypeChange(e.target.value as AmountRange['type'])}
                disabled={isLoading}
              />
              <span className="radio-label">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Amount Range Inputs */}
      <div className="amount-inputs-section">
        <div className="amount-input-group">
          <label className="input-label">Minimum:</label>
          <div className="currency-input-wrapper">
            <span className="currency-symbol">$</span>
            <input
              type="number"
              value={minInput}
              onChange={(e) => handleMinChange(e.target.value)}
              className="amount-input"
              disabled={isLoading}
              min="0"
              step="0.01"
              placeholder="0.00"
              max={maxInput ? parseFloat(maxInput) : undefined}
            />
          </div>
        </div>
        <div className="amount-input-group">
          <label className="input-label">Maximum:</label>
          <div className="currency-input-wrapper">
            <span className="currency-symbol">$</span>
            <input
              type="number"
              value={maxInput}
              onChange={(e) => handleMaxChange(e.target.value)}
              className="amount-input"
              disabled={isLoading}
              min={minInput ? parseFloat(minInput) : "0"}
              step="0.01"
              placeholder="No limit"
            />
          </div>
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
            <span className="range-icon">💰</span>
            <span className="range-text">
              {localAmountRange.min > 0 && localAmountRange.max > 0 ? (
                <>
                  {formatCurrency(localAmountRange.min)} - {formatCurrency(localAmountRange.max)}
                  <span className="range-type">({localAmountRange.type})</span>
                </>
              ) : localAmountRange.min > 0 ? (
                <>
                  {formatCurrency(localAmountRange.min)}+
                  <span className="range-type">({localAmountRange.type})</span>
                </>
              ) : localAmountRange.max > 0 ? (
                <>
                  Up to {formatCurrency(localAmountRange.max)}
                  <span className="range-type">({localAmountRange.type})</span>
                </>
              ) : null}
            </span>
          </div>
          <button
            onClick={clearAmountRange}
            className="clear-range-btn"
            disabled={isLoading}
            title="Clear amount range"
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
            Set minimum and/or maximum {localAmountRange.type} amounts to filter jobs
          </span>
        </div>
      )}

      {/* Validation Messages */}
      {minInput && maxInput && parseFloat(minInput) > parseFloat(maxInput) && (
        <div className="validation-message">
          <span className="warning-icon">⚠️</span>
          <span className="warning-text">
            Minimum amount cannot be greater than maximum amount
          </span>
        </div>
      )}
    </div>
  );
};

export default AmountRangeFilter;