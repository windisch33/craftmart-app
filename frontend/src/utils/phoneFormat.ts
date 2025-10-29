export function formatPhoneInput(value: string): string {
  const digits = (value || '').replace(/\D/g, '');
  if (digits.length === 0) return '';

  if (digits.length <= 3) {
    return digits;
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

export function stripPhoneFormatting(value: string): string {
  return (value || '').replace(/\D/g, '');
}

