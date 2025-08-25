import type { Product } from '../../../services/productService';
import type { Material } from '../../../services/materialService';
import type { StairMaterial } from '../../../services/stairService';
import type {
  StairFormData,
  LinearProductFormData,
  RailPartsFormData,
  TreadBulkConfig,
  StairStringersConfig
} from './types';

export const validateTreadConfiguration = (
  bulkConfig: TreadBulkConfig,
  numRisers: number
): { hasLandingTread: boolean; error?: string } => {
  const totalTreads = bulkConfig.boxTreadCount + bulkConfig.openTreadCount + bulkConfig.doubleOpenCount;
  
  if (totalTreads === numRisers) {
    // Equal treads and risers = no landing tread, top gets full tread
    return { hasLandingTread: false };
  } else if (totalTreads === (numRisers - 1)) {
    // One less tread than risers = has landing tread
    return { hasLandingTread: true };
  }
  
  return { 
    hasLandingTread: true, 
    error: 'Total treads must be either equal to risers or one less than risers' 
  };
};

export const validateStairForm = (
  stairFormData: StairFormData,
  bulkConfig: TreadBulkConfig,
  stringersConfig: StairStringersConfig,
  stairMaterials: StairMaterial[]
): string | null => {
  // Check if data is loaded
  if (stairMaterials.length === 0) {
    return 'Stair materials are still loading. Please wait and try again.';
  }

  // Check basic stair data
  if (!stairFormData.floorToFloor || stairFormData.floorToFloor <= 0) {
    return 'Floor to floor height must be greater than 0';
  }
  if (!stairFormData.numRisers || stairFormData.numRisers <= 0) {
    return 'Number of risers must be greater than 0';
  }
  if (!stairFormData.treadMaterialId) {
    return 'Please select a tread material';
  }
  if (!stairFormData.riserMaterialId) {
    return 'Please select a riser material';
  }

  // Check tread configuration
  const totalTreads = bulkConfig.boxTreadCount + bulkConfig.openTreadCount + bulkConfig.doubleOpenCount;
  if (totalTreads === 0) {
    return 'Please specify at least one tread type with count greater than 0';
  }
  if (totalTreads > stairFormData.numRisers) {
    return 'Total treads cannot exceed number of risers';
  }
  if (totalTreads < stairFormData.numRisers - 1) {
    return 'Total treads must be either equal to risers or one less than risers';
  }

  // Check tread widths
  if (bulkConfig.boxTreadCount > 0 && (!bulkConfig.boxTreadWidth || bulkConfig.boxTreadWidth <= 0)) {
    return 'Box tread width must be specified and greater than 0';
  }
  if (bulkConfig.openTreadCount > 0 && (!bulkConfig.openTreadWidth || bulkConfig.openTreadWidth <= 0)) {
    return 'Open tread width must be specified and greater than 0';
  }
  if (bulkConfig.doubleOpenCount > 0 && (!bulkConfig.doubleOpenWidth || bulkConfig.doubleOpenWidth <= 0)) {
    return 'Double open tread width must be specified and greater than 0';
  }

  // Check stringer materials
  if (!stringersConfig.leftStringerMaterial) {
    return 'Please select left stringer material';
  }
  if (!stringersConfig.rightStringerMaterial) {
    return 'Please select right stringer material';
  }
  if (stringersConfig.hasCenter && !stringersConfig.centerStringerMaterial) {
    return 'Please select center stringer material';
  }

  // Check stringer dimensions
  if (!stringersConfig.leftStringerWidth || stringersConfig.leftStringerWidth <= 0 || 
      !stringersConfig.leftStringerThickness || stringersConfig.leftStringerThickness <= 0) {
    return 'Left stringer dimensions must be greater than 0';
  }
  if (!stringersConfig.rightStringerWidth || stringersConfig.rightStringerWidth <= 0 || 
      !stringersConfig.rightStringerThickness || stringersConfig.rightStringerThickness <= 0) {
    return 'Right stringer dimensions must be greater than 0';
  }
  if (stringersConfig.hasCenter && 
      (!stringersConfig.centerStringerWidth || stringersConfig.centerStringerWidth <= 0 || 
       !stringersConfig.centerStringerThickness || stringersConfig.centerStringerThickness <= 0)) {
    return 'Center stringer dimensions must be greater than 0';
  }

  return null;
};

export const validateLinearProductForm = (
  type: 'handrail' | 'landing_tread',
  linearProductFormData: LinearProductFormData,
  products: Product[],
  materials: Material[]
): string | null => {
  if (!linearProductFormData.productId || linearProductFormData.productId === 0) {
    return `Please select a ${type === 'handrail' ? 'handrail' : 'landing tread'} product`;
  }
  if (!linearProductFormData.materialId || linearProductFormData.materialId === 0) {
    return 'Please select a material';
  }
  if (!linearProductFormData.length || linearProductFormData.length <= 0) {
    return 'Length must be greater than 0';
  }
  if (!linearProductFormData.quantity || linearProductFormData.quantity <= 0) {
    return 'Quantity must be greater than 0';
  }

  // Check if materials are loaded
  if (materials.length === 0) {
    return 'Materials are still loading. Please wait and try again.';
  }

  if (products.length === 0) {
    return 'Products are still loading. Please wait and try again.';
  }

  return null;
};

export const validateRailPartsForm = (
  railPartsFormData: RailPartsFormData,
  railPartsProducts: Product[],
  materials: Material[]
): string | null => {
  if (!railPartsFormData.productId || railPartsFormData.productId === 0) {
    return 'Please select a rail part product';
  }
  if (!railPartsFormData.materialId || railPartsFormData.materialId === 0) {
    return 'Please select a material';
  }
  if (!railPartsFormData.quantity || railPartsFormData.quantity <= 0) {
    return 'Quantity must be greater than 0';
  }

  // Check if materials are loaded
  if (materials.length === 0) {
    return 'Materials are still loading. Please wait and try again.';
  }
  if (railPartsProducts.length === 0) {
    return 'Products are still loading. Please wait and try again.';
  }

  return null;
};