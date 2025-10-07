import React, { useEffect, useState } from 'react';
import { parseNumberLike } from '../../../utils/numberParsing';

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> & {
  value: number | undefined | null;
  onCommit: (value: number) => void;
};

// Text input that accepts decimals and fractions (e.g., 1/2, 1 3/8, 1-3/8) and commits a numeric value on blur/Enter.
const FractionalInput: React.FC<Props> = ({ value, onCommit, ...rest }) => {
  const [text, setText] = useState<string>(value === null || value === undefined ? '' : String(value));

  useEffect(() => {
    const next = value === null || value === undefined ? '' : String(value);
    setText(next);
  }, [value]);

  const commit = () => {
    const num = parseNumberLike(text);
    if (Number.isFinite(num)) {
      onCommit(num);
      setText(String(num));
    } else {
      // Revert to last numeric value
      const fallback = value === null || value === undefined ? '' : String(value);
      setText(fallback);
    }
  };

  return (
    <input
      type="text"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          (e.target as HTMLInputElement).blur();
        }
      }}
      {...rest}
    />
  );
};

export default FractionalInput;

