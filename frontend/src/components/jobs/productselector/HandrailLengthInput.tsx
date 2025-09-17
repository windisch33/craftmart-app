import React, { useState, useEffect } from 'react';

interface HandrailLengthInputProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  error?: string;
}

const HandrailLengthInput: React.FC<HandrailLengthInputProps> = ({
  value,
  onChange,
  disabled = false,
  error
}) => {
  const [inputValue, setInputValue] = useState(value.toString());
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');

  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setShowWarning(false);
    
    const numericValue = parseFloat(newValue) || 0;
    if (numericValue === 0 || (numericValue % 6 === 0 && numericValue >= 6 && numericValue <= 240)) {
      onChange(numericValue);
    }
  };

  const handleInputBlur = () => {
    const numericValue = parseFloat(inputValue) || 0;

    if (numericValue === 0) {
      setInputValue('0');
      onChange(0);
      return;
    }

    if (numericValue % 6 !== 0 || numericValue < 6 || numericValue > 240) {
      const rounded = Math.ceil(numericValue / 6) * 6;
      const finalValue = Math.max(6, Math.min(240, rounded));
      setWarningMessage(`Length adjusted from ${numericValue}" to ${finalValue}"`);
      setShowWarning(true);
      setInputValue(finalValue.toString());
      onChange(finalValue);

      // Hide warning after 3 seconds
      setTimeout(() => setShowWarning(false), 3000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleInputBlur();
      // Blur the input to show the change has been applied
      e.currentTarget.blur();
    }
  };

  return (
    <div className="handrail-length-input-simple">
      <input
        type="number"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onKeyPress={handleKeyPress}
        onFocus={(e) => e.target.select()}
        onClick={(e) => e.currentTarget.select()}
        min="6"
        max="240"
        step="6"
        list="handrail-lengths"
        disabled={disabled}
        placeholder="Length in inches (6&quot; increments)"
        className={error ? 'error' : ''}
      />
      
      <datalist id="handrail-lengths">
        {[6,12,18,24,30,36,42,48,54,60,66,72,78,84,90,96,102,108,114,120,
          126,132,138,144,150,156,162,168,174,180,186,192,198,204,210,216,
          222,228,234,240].map(inches => (
          <option key={inches} value={inches}>
            {inches}&quot;
          </option>
        ))}
      </datalist>
      
      {showWarning && (
        <div className="length-warning-simple">
          ⚠️ {warningMessage}
        </div>
      )}
      
      {error && <span className="error-message">{error}</span>}
    </div>
  );
};

export default HandrailLengthInput;