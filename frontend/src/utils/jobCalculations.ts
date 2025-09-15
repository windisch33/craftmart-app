import type { JobSection, QuoteItem } from '../services/jobService';
import type { Product } from '../services/productService';
import type { Material } from '../services/materialService';
import productService from '../services/productService';

// Tax rate interfaces
export interface TaxRate {
  state_code: string;
  rate: number;
}

// Job totals interface
export interface JobTotals {
  subtotal: number;        // Total of taxable items (before tax)
  laborTotal: number;      // Total of non-taxable items (labor, etc.)
  taxableAmount: number;   // Same as subtotal (for clarity)
  taxAmount: number;       // Tax applied to taxable items
  grandTotal: number;      // Final total including tax
}

// Section totals interface
export interface SectionTotals {
  sectionId: number;
  sectionName: string;
  itemCount: number;
  taxableTotal: number;
  nonTaxableTotal: number;
  sectionTotal: number;
  isLaborSection: boolean;
}

// Item calculation interface
export interface ItemCalculation {
  unitPrice: number;
  lineTotal: number;
  isTaxable: boolean;
}

/**
 * Calculate the unit price for a handrail product based on length and material
 */
export const calculateHandrailPrice = (
  product: Product,
  material: Material,
  lengthInches: number,
  includeLabor: boolean = false
): number => {
  if (!product.cost_per_6_inches || product.product_type !== 'handrail') {
    return 0;
  }

  return productService.calculateHandrailPrice(
    lengthInches,
    product.cost_per_6_inches,
    material.multiplier,
    0, // Handrails no longer have labor costs
    false // Never include labor for handrails
  );
};

/**
 * Calculate the total price for a quote item
 */
export const calculateItemTotal = (
  product: Product | null,
  material: Material | null,
  quantity: number,
  lengthInches: number = 0,
  customUnitPrice: number | null = null,
  useCustomPrice: boolean = false
): ItemCalculation => {
  let unitPrice = 0;

  if (useCustomPrice && customUnitPrice !== null) {
    // Use custom pricing
    unitPrice = customUnitPrice;
  } else if (product && material) {
    // Calculate based on product and material
    if (product.product_type === 'handrail' && product.cost_per_6_inches) {
      unitPrice = calculateHandrailPrice(product, material, lengthInches, false);
    } else {
      // For other product types, you might have different calculation logic
      // This is a placeholder - implement based on your specific product pricing
      unitPrice = 0;
    }
  }

  const lineTotal = unitPrice * quantity;

  return {
    unitPrice: Math.round(unitPrice * 100) / 100, // Round to 2 decimal places
    lineTotal: Math.round(lineTotal * 100) / 100,
    isTaxable: true // Default to taxable, will be overridden by form
  };
};

/**
 * Calculate totals for a single section
 */
export const calculateSectionTotals = (section: JobSection): SectionTotals => {
  const items = section.items || [];
  
  let taxableTotal = 0;
  let nonTaxableTotal = 0;

  items.forEach(item => {
    const itemTotal = item.line_total || (item.quantity * item.unit_price);
    
    // With product-level labor handling, tax status is determined by the item itself
    // Labor components are always non-taxable, material components follow the item's is_taxable flag
    if (item.is_taxable) {
      taxableTotal += itemTotal;
    } else {
      nonTaxableTotal += itemTotal;
    }
  });

  return {
    sectionId: section.id,
    sectionName: section.name,
    itemCount: items.length,
    taxableTotal: Math.round(taxableTotal * 100) / 100,
    nonTaxableTotal: Math.round(nonTaxableTotal * 100) / 100,
    sectionTotal: Math.round((taxableTotal + nonTaxableTotal) * 100) / 100,
    isLaborSection: Boolean((section as any).is_labor_section)
  };
};

/**
 * Calculate job totals from all sections
 */
export const calculateJobTotals = (
  sections: JobSection[],
  taxRate: number = 0
): JobTotals => {
  let totalTaxable = 0;
  let totalNonTaxable = 0;

  // Sum up all sections
  sections.forEach(section => {
    const sectionTotals = calculateSectionTotals(section);
    totalTaxable += sectionTotals.taxableTotal;
    totalNonTaxable += sectionTotals.nonTaxableTotal;
  });

  // Calculate tax and grand total
  const taxAmount = totalTaxable * taxRate;
  const grandTotal = totalTaxable + totalNonTaxable + taxAmount;

  return {
    subtotal: Math.round(totalTaxable * 100) / 100,
    laborTotal: Math.round(totalNonTaxable * 100) / 100,
    taxableAmount: Math.round(totalTaxable * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    grandTotal: Math.round(grandTotal * 100) / 100
  };
};

/**
 * Get section totals for all sections
 */
export const getAllSectionTotals = (sections: JobSection[]): SectionTotals[] => {
  return sections.map(section => calculateSectionTotals(section));
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Format tax rate for display (e.g., 0.06 -> "6.00%")
 */
export const formatTaxRate = (rate: number): string => {
  return `${(rate * 100).toFixed(2)}%`;
};

/**
 * Parse tax rate from percentage string (e.g., "6%" -> 0.06)
 */
export const parseTaxRate = (rateString: string): number => {
  const numericValue = parseFloat(rateString.replace('%', ''));
  return isNaN(numericValue) ? 0 : numericValue / 100;
};

/**
 * Validate that a price is valid (positive number)
 */
export const validatePrice = (price: number): boolean => {
  return !isNaN(price) && price >= 0 && isFinite(price);
};

/**
 * Validate that a quantity is valid (positive number)
 */
export const validateQuantity = (quantity: number): boolean => {
  return !isNaN(quantity) && quantity > 0 && isFinite(quantity);
};

/**
 * Calculate the tax amount for a specific item
 */
export const calculateItemTax = (
  item: QuoteItem,
  taxRate: number,
  isLaborSection: boolean = false
): number => {
  // Labor sections are typically non-taxable
  if (isLaborSection || !item.is_taxable) {
    return 0;
  }
  
  const itemTotal = item.line_total || (item.quantity * item.unit_price);
  return Math.round(itemTotal * taxRate * 100) / 100;
};

/**
 * Get default tax status based on section type
 */
export const getDefaultTaxStatus = (section: JobSection): boolean => {
  // Labor sections default to non-taxable
  if ((section as any).is_labor_section) {
    return false;
  }
  
  // Material sections default to taxable
  return true;
};

/**
 * Common tax rates by state (for reference/lookup)
 */
export const commonTaxRates: Record<string, number> = {
  'AL': 0.04,     // Alabama
  'AK': 0.0,      // Alaska
  'AZ': 0.056,    // Arizona
  'AR': 0.065,    // Arkansas
  'CA': 0.0725,   // California
  'CO': 0.029,    // Colorado
  'CT': 0.0635,   // Connecticut
  'DE': 0.0,      // Delaware
  'FL': 0.06,     // Florida
  'GA': 0.04,     // Georgia
  'HI': 0.04,     // Hawaii
  'ID': 0.06,     // Idaho
  'IL': 0.0625,   // Illinois
  'IN': 0.07,     // Indiana
  'IA': 0.06,     // Iowa
  'KS': 0.065,    // Kansas
  'KY': 0.06,     // Kentucky
  'LA': 0.0445,   // Louisiana
  'ME': 0.055,    // Maine
  'MD': 0.06,     // Maryland
  'MA': 0.0625,   // Massachusetts
  'MI': 0.06,     // Michigan
  'MN': 0.06875,  // Minnesota
  'MS': 0.07,     // Mississippi
  'MO': 0.04225,  // Missouri
  'MT': 0.0,      // Montana
  'NE': 0.055,    // Nebraska
  'NV': 0.0685,   // Nevada
  'NH': 0.0,      // New Hampshire
  'NJ': 0.06625,  // New Jersey
  'NM': 0.05125,  // New Mexico
  'NY': 0.08,     // New York
  'NC': 0.0475,   // North Carolina
  'ND': 0.05,     // North Dakota
  'OH': 0.0575,   // Ohio
  'OK': 0.045,    // Oklahoma
  'OR': 0.0,      // Oregon
  'PA': 0.06,     // Pennsylvania
  'RI': 0.07,     // Rhode Island
  'SC': 0.06,     // South Carolina
  'SD': 0.045,    // South Dakota
  'TN': 0.07,     // Tennessee
  'TX': 0.0625,   // Texas
  'UT': 0.047,    // Utah
  'VT': 0.06,     // Vermont
  'VA': 0.0575,   // Virginia
  'WA': 0.065,    // Washington
  'WV': 0.06,     // West Virginia
  'WI': 0.05,     // Wisconsin
  'WY': 0.04      // Wyoming
};

/**
 * Get tax rate for a state (fallback to common rates if not in backend)
 */
export const getTaxRateForState = (stateCode: string): number => {
  const upperStateCode = stateCode.toUpperCase();
  return commonTaxRates[upperStateCode] || 0;
};

/**
 * Calculate savings when switching from quote to order/invoice
 */
export const calculatePotentialSavings = (
  currentTotal: number,
  discountPercent: number
): number => {
  const savings = currentTotal * (discountPercent / 100);
  return Math.round(savings * 100) / 100;
};

/**
 * Generate a summary object for reporting
 */
export const generateJobSummary = (
  sections: JobSection[],
  taxRate: number
): {
  totals: JobTotals;
  sectionBreakdown: SectionTotals[];
  itemCount: number;
  sectionCount: number;
  taxRateFormatted: string;
} => {
  const totals = calculateJobTotals(sections, taxRate);
  const sectionBreakdown = getAllSectionTotals(sections);
  const itemCount = sections.reduce((count, section) => count + (section.items?.length || 0), 0);

  return {
    totals,
    sectionBreakdown,
    itemCount,
    sectionCount: sections.length,
    taxRateFormatted: formatTaxRate(taxRate)
  };
};
