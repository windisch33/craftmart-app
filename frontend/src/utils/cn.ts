type ClassValue = string | number | boolean | null | undefined | Record<string, boolean | undefined> | ClassValue[];

export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = [];
  
  for (const input of inputs) {
    if (!input) continue;
    
    if (typeof input === 'string' || typeof input === 'number') {
      classes.push(String(input));
    } else if (typeof input === 'object' && !Array.isArray(input)) {
      for (const [key, value] of Object.entries(input)) {
        if (value) classes.push(key);
      }
    } else if (Array.isArray(input)) {
      const nested = cn(...input);
      if (nested) classes.push(nested);
    }
  }
  
  return classes.join(' ');
}