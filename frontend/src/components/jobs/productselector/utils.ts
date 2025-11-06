import productService from '../../../services/productService';
import type { Product } from '../../../services/productService';
import type { Material } from '../../../services/materialService';
import type { ProductFormData } from './types';

export const calculateMaterialPrice = (
  product: Product | null,
  material: Material | null,
  formData: ProductFormData
): number => {
  try {
    if (formData.useCustomPrice) {
      const price = (formData.customUnitPrice || 0) * (formData.quantity || 1);
      return isNaN(price) ? 0 : price;
    }

    if (!product) return 0;

    // Handle handrail and landing tread products with length calculation
    if ((product.product_type === 'handrail' || product.product_type === 'landing_tread') && product.cost_per_6_inches) {
      // For handrail and landing tread products, we need a material to calculate price
      if (!material) return 0;
      
      const price = productService.calculateHandrailPrice(
        formData.lengthInches || 0,
        Number(product.cost_per_6_inches) || 0,
        Number(material.multiplier) || 1,
        0, // Don't include labor in material price
        false
      ) * (formData.quantity || 1);
      return isNaN(price) ? 0 : price;
    }

    // Handle rail parts products with base price calculation
    if (product.product_type === 'rail_parts' && product.base_price) {
      // For rail parts, we need a material to calculate price
      if (!material) return 0;
      
      const price = productService.calculateRailPartsPrice(
        Number(product.base_price) || 0,
        Number(material.multiplier) || 1,
        0, // Don't include labor in material price
        false,
        formData.quantity || 1
      );
      return isNaN(price) ? 0 : price;
    }

    // For other products, use base price if available
    return 0;
  } catch (error) {
    console.error('Error in calculateMaterialPrice:', error);
    return 0;
  }
};

export const calculateLaborPrice = (product: Product | null, formData: ProductFormData): number => {
  try {
    if (!formData.includeLabor) return 0;

    // Handrail products don't have labor costs
    if (product?.product_type === 'handrail') return 0;

    if (!product || !product.labor_install_cost) return 0;

    const laborCost = Number(product.labor_install_cost) || 0;
    const price = laborCost * (formData.quantity || 1);
    return isNaN(price) ? 0 : price;
  } catch (error) {
    console.error('Error in calculateLaborPrice:', error);
    return 0;
  }
};

export const getCalculatedUnitPrice = (
  formData: ProductFormData,
  totalPrice: number
): number => {
  try {
    if (formData.useCustomPrice || (formData.quantity || 0) === 0) {
      return formData.customUnitPrice || 0;
    }
    const quantity = formData.quantity || 1;
    const unitPrice = totalPrice / quantity;
    return isNaN(unitPrice) ? 0 : unitPrice;
  } catch (error) {
    console.error('Error in getCalculatedUnitPrice:', error);
    return 0;
  }
};

export const buildItemDescription = (
  formData: ProductFormData,
  selectedProduct: Product | null,
  selectedMaterial: Material | null
): string => {
  const trimmedCustomDescription = formData.customDescription.trim();
  const isHandrailProduct = selectedProduct?.product_type === 'handrail' || selectedProduct?.product_type === 'landing_tread';
  const isRailPartsProduct = selectedProduct?.product_type === 'rail_parts';
  const requiresMaterial = isHandrailProduct || isRailPartsProduct;

  let description;
  if (selectedProduct) {
    if (selectedProduct.product_type === 'handrail' && trimmedCustomDescription) {
      return trimmedCustomDescription;
    }
    // Product-based item: build description from product and material
    description = selectedProduct.name;
    if (selectedMaterial && requiresMaterial) {
      description += ` - ${selectedMaterial.name}`;
      if (isHandrailProduct && formData.lengthInches > 0) {
        description += ` (${formData.lengthInches}")`;
      }
    }
  } else {
    // Custom item: use custom description
    description = formData.customDescription.trim();
  }
  return description;
};

export const calculateSectionTotal = (items: any[]): number => {
  return items.reduce((total, item) => {
    return total + ((item.unit_price || 0) * (item.quantity || 1));
  }, 0);
};

// Handrail length validation utilities
export const isValidHandrailLength = (inches: number): boolean => {
  return inches >= 6 && inches <= 240 && inches % 6 === 0;
};

export const roundToNearestSixInches = (inches: number): number => {
  if (inches < 6) return 6;
  if (inches > 240) return 240;
  return Math.round(inches / 6) * 6;
};

// Note: formatLengthDisplay and generateHandrailLengthOptions functions removed
// as they are no longer needed with the simplified datalist implementation
