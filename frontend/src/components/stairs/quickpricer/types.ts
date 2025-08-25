export type ProductType = 'stair' | 'handrail' | 'landing_tread' | 'rail_parts';

// Stair form data interface
export interface StairFormData {
  floorToFloor: number;
  numRisers: number;
  treadMaterialId: number;
  riserMaterialId: number;
  roughCutWidth: number;
  noseSize: number;
  stringerType: string;
  stringerMaterialId: number;
  numStringers: number;
  centerHorses: number;
  fullMitre: boolean;
  bracketType: string;
  specialNotes: string;
}

// Handrail/Landing Tread form data interface
export interface LinearProductFormData {
  productId: number;
  length: number;
  materialId: number;
  quantity: number;
  includeLabor: boolean;
}

// Rail Parts form data interface
export interface RailPartsFormData {
  productId: number;
  materialId: number;
  quantity: number;
  includeLabor: boolean;
}

// Pricing result interface
export interface PricingResult {
  subtotal: number;
  laborCost: number;
  total: number;
  details?: any;
}

// Stair configuration interfaces
export interface StringerConfig {
  width: number;
  thickness: number;
  materialId: number;
}

export interface TreadBulkConfig {
  boxTreadCount: number;
  boxTreadWidth: number;
  openTreadCount: number;
  openTreadWidth: number;
  openTreadDirection: 'left' | 'right';
  openTreadFullMitre: boolean;
  openTreadBracket: string;
  doubleOpenCount: number;
  doubleOpenWidth: number;
  doubleOpenFullMitre: boolean;
  doubleOpenBracket: string;
  hasLandingTread: boolean;
}

export interface StairStringersConfig {
  leftStringerWidth: number;
  leftStringerThickness: number;
  leftStringerMaterial: number;
  rightStringerWidth: number;
  rightStringerThickness: number;
  rightStringerMaterial: number;
  hasCenter: boolean;
  centerStringerWidth: number;
  centerStringerThickness: number;
  centerStringerMaterial: number;
}