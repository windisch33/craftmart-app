import stairService from '../../../services/stairService';
import type { Product } from '../../../services/productService';
import type { Material } from '../../../services/materialService';
import type { StairSpecialPart, TreadConfiguration } from '../../../services/stairService';
import type {
  StairFormData,
  LinearProductFormData,
  RailPartsFormData,
  PricingResult,
  TreadBulkConfig,
  StairStringersConfig
} from './types';

// Function to generate treads array from bulk configuration
export const generateTreadsFromBulkConfig = (
  bulkConfig: TreadBulkConfig
): TreadConfiguration[] => {
  const generatedTreads: TreadConfiguration[] = [];
  let riserNumber = 1;
  
  // Add box treads
  for (let i = 0; i < bulkConfig.boxTreadCount; i++) {
    generatedTreads.push({
      riserNumber: riserNumber++,
      type: 'box',
      stairWidth: bulkConfig.boxTreadWidth
    });
  }
  
  // Add open treads
  for (let i = 0; i < bulkConfig.openTreadCount; i++) {
    generatedTreads.push({
      riserNumber: riserNumber++,
      type: bulkConfig.openTreadDirection === 'left' ? 'open_left' : 'open_right',
      stairWidth: bulkConfig.openTreadWidth
    });
  }
  
  // Add double open treads
  for (let i = 0; i < bulkConfig.doubleOpenCount; i++) {
    generatedTreads.push({
      riserNumber: riserNumber++,
      type: 'double_open',
      stairWidth: bulkConfig.doubleOpenWidth
    });
  }
  
  return generatedTreads;
};

export const calculateStairPrice = async (
  stairFormData: StairFormData,
  bulkConfig: TreadBulkConfig,
  stringersConfig: StairStringersConfig,
  specialParts: StairSpecialPart[]
) => {
  // Generate treads from bulk configuration
  const generatedTreads = generateTreadsFromBulkConfig(bulkConfig);
  
  // Calculate equivalent stringerType from individual configurations for backward compatibility
  const avgWidth = (
    stringersConfig.leftStringerWidth + 
    stringersConfig.rightStringerWidth + 
    (stringersConfig.hasCenter ? stringersConfig.centerStringerWidth : 0)
  ) / (stringersConfig.hasCenter ? 3 : 2);
  
  const avgThickness = (
    stringersConfig.leftStringerThickness + 
    stringersConfig.rightStringerThickness + 
    (stringersConfig.hasCenter ? stringersConfig.centerStringerThickness : 0)
  ) / (stringersConfig.hasCenter ? 3 : 2);
  
  const equivalentStringerType = `${avgThickness}x${avgWidth}`;

  // Add special parts configurations
  const specialPartsConfig = specialParts.map(part => ({
    partId: part.stpart_id,
    quantity: part.quantity ?? 1
  }));

  const request = {
    floorToFloor: stairFormData.floorToFloor,
    numRisers: stairFormData.numRisers,
    treads: generatedTreads,
    treadMaterialId: stairFormData.treadMaterialId,
    riserMaterialId: stairFormData.riserMaterialId,
    roughCutWidth: stairFormData.roughCutWidth,
    noseSize: stairFormData.noseSize,
    stringerType: equivalentStringerType,
    stringerMaterialId: stringersConfig.leftStringerMaterial,
    numStringers: stringersConfig.hasCenter ? 3 : 2,
    centerHorses: stringersConfig.hasCenter ? 1 : 0,
    fullMitre: (bulkConfig.openTreadCount > 0 && bulkConfig.openTreadFullMitre) || 
               (bulkConfig.doubleOpenCount > 0 && bulkConfig.doubleOpenFullMitre) || 
               stairFormData.fullMitre,
    bracketType: bulkConfig.openTreadCount > 0 ? bulkConfig.openTreadBracket : 
                 bulkConfig.doubleOpenCount > 0 ? bulkConfig.doubleOpenBracket : 
                 stairFormData.bracketType,
    specialParts: specialPartsConfig,
    includeLandingTread: bulkConfig.hasLandingTread,
    individualStringers: {
      left: { 
        width: stringersConfig.leftStringerWidth, 
        thickness: stringersConfig.leftStringerThickness, 
        materialId: stringersConfig.leftStringerMaterial 
      },
      right: { 
        width: stringersConfig.rightStringerWidth, 
        thickness: stringersConfig.rightStringerThickness, 
        materialId: stringersConfig.rightStringerMaterial 
      },
      center: stringersConfig.hasCenter ? { 
        width: stringersConfig.centerStringerWidth, 
        thickness: stringersConfig.centerStringerThickness, 
        materialId: stringersConfig.centerStringerMaterial 
      } : null
    }
  };

  const response = await stairService.calculatePrice(request);
  
  const pricingResult: PricingResult = {
    subtotal: parseFloat(response.subtotal),
    laborCost: parseFloat(response.laborTotal),
    total: parseFloat(response.total),
    details: response
  };
  
  return { pricingResult, stairPricingDetails: response };
};

export const calculateLinearProductPrice = async (
  type: 'handrail' | 'landing_tread',
  linearProductFormData: LinearProductFormData,
  products: Product[],
  materials: Material[]
): Promise<PricingResult> => {
  const product = products.find(p => p.id === linearProductFormData.productId);
  
  if (!product) {
    throw new Error(`Selected ${type} product not found. Please refresh the page and try again.`);
  }

  const material = materials.find(m => m.id === linearProductFormData.materialId);
  if (!material) {
    throw new Error('Selected material not found. Please refresh the page and try again.');
  }
  const materialMultiplier = material?.multiplier || 1;
  
  // Calculate: (length / 6) * cost_per_6_inches * material_multiplier * quantity
  const lengthIn6InchIncrements = linearProductFormData.length / 6;
  const basePrice = (product.cost_per_6_inches || 0) * lengthIn6InchIncrements * materialMultiplier;
  const subtotal = basePrice * linearProductFormData.quantity;
  
  // Only include labor cost for landing_tread products, not handrails
  const laborCost = linearProductFormData.includeLabor && type === 'landing_tread'
    ? (product.labor_install_cost || 0) * linearProductFormData.quantity 
    : 0;

  return {
    subtotal,
    laborCost,
    total: subtotal + laborCost,
    details: {
      product: product.name,
      material: material?.name || 'Unknown',
      length: linearProductFormData.length,
      quantity: linearProductFormData.quantity,
      lengthIn6InchIncrements,
      costPer6Inches: product.cost_per_6_inches,
      materialMultiplier,
      basePrice,
      laborCostPerUnit: type === 'landing_tread' ? product.labor_install_cost : 0
    }
  };
};

export const calculateRailPartsPrice = async (
  railPartsFormData: RailPartsFormData,
  railPartsProducts: Product[],
  materials: Material[]
): Promise<PricingResult> => {
  const product = railPartsProducts.find(p => p.id === railPartsFormData.productId);
  
  if (!product) {
    throw new Error('Selected rail part product not found. Please refresh the page and try again.');
  }

  const material = materials.find(m => m.id === railPartsFormData.materialId);
  if (!material) {
    throw new Error('Selected material not found. Please refresh the page and try again.');
  }
  const materialMultiplier = material?.multiplier || 1;
  
  // Calculate: base_price * material_multiplier * quantity
  const subtotal = (product.base_price || 0) * materialMultiplier * railPartsFormData.quantity;
  
  const laborCost = railPartsFormData.includeLabor 
    ? (product.labor_install_cost || 0) * railPartsFormData.quantity 
    : 0;

  return {
    subtotal,
    laborCost,
    total: subtotal + laborCost,
    details: {
      product: product.name,
      material: material?.name || 'Unknown',
      quantity: railPartsFormData.quantity,
      basePrice: product.base_price,
      materialMultiplier,
      laborCostPerUnit: product.labor_install_cost
    }
  };
};
