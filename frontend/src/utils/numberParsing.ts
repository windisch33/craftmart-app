// Parse a measurement that may be a decimal or a fraction (e.g., "1 1/2", "3/4", "1-3/8").
// Returns NaN if it cannot be parsed.
export function parseNumberLike(input: unknown): number {
  if (typeof input === 'number') return Number.isFinite(input) ? input : NaN;
  if (input === null || input === undefined) return NaN;

  let s = String(input).trim();
  if (!s) return NaN;

  // Remove inch symbols and quotes
  s = s.replace(/["”″]/g, '');

  // Simple decimal
  const asNum = Number(s);
  if (Number.isFinite(asNum)) return asNum;

  // Replace hyphen between whole and fraction with space (e.g., 1-3/8)
  s = s.replace(/-/g, ' ');

  // Patterns: "a b/c" or "b/c"
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length === 1 && parts[0].includes('/')) {
    const [numStr, denStr] = parts[0].split('/');
    const num = Number(numStr);
    const den = Number(denStr);
    if (Number.isFinite(num) && Number.isFinite(den) && den !== 0) {
      return num / den;
    }
    return NaN;
  }

  if (parts.length === 2 && parts[1].includes('/')) {
    const whole = Number(parts[0]);
    const [numStr, denStr] = parts[1].split('/');
    const num = Number(numStr);
    const den = Number(denStr);
    if (Number.isFinite(whole) && Number.isFinite(num) && Number.isFinite(den) && den !== 0) {
      return whole + num / den;
    }
    return NaN;
  }

  return NaN;
}

// Parse an integer-like value (e.g., allows fractional input but rounds to nearest integer)
export function parseIntegerLike(input: unknown): number {
  const n = parseNumberLike(input);
  return Number.isFinite(n) ? Math.round(n) : NaN;
}

