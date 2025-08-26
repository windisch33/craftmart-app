// Stair Configuration Types
export interface StairConfiguration {
  id: number;
  job_id: number;
  config_name: string;
  floor_to_floor: number;
  num_risers: number;
  riser_height: number;
  tread_material_id: number;
  riser_material_id: number;
  tread_size: string;
  rough_cut_width: number;
  nose_size: number;
  stringer_type: string;
  stringer_material_id: number;
  num_stringers: number;
  center_horses: number;
  full_mitre: boolean;
  bracket_type?: string;
  special_notes?: string;
  subtotal: number;
  labor_total: number;
  tax_amount: number;
  total_amount: number;
  created_at: string;
  updated_at: string;
  
  // Individual stringer configurations
  left_stringer_width?: number;
  left_stringer_thickness?: number;
  left_stringer_material_id?: number;
  right_stringer_width?: number;
  right_stringer_thickness?: number;
  right_stringer_material_id?: number;
  center_stringer_width?: number;
  center_stringer_thickness?: number;
  center_stringer_material_id?: number;
  
  // Material names (joined data)
  tread_material_name?: string;
  riser_material_name?: string;
  stringer_material_name?: string;
  left_stringer_material_name?: string;
  right_stringer_material_name?: string;
  center_stringer_material_name?: string;
}

export interface StairConfigItem {
  id: number;
  config_id: number;
  item_type: 'tread' | 'riser' | 'stringer' | 'special_part';
  riser_number?: number;
  tread_type: 'box' | 'open_left' | 'open_right' | 'double_open';
  width: number;
  length?: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  material_id: number;
  material_name?: string;
  created_at: string;
  updated_at: string;
}

export interface StairConfigurationDetails extends StairConfiguration {
  items: StairConfigItem[];
}

// For formatting and display
export interface TreadGroup {
  type: 'box' | 'open_left' | 'open_right' | 'double_open';
  count: number;
  width: number;
}

export interface StairDimensions {
  riserHeight: string; // formatted as fraction
  roughCut: string; // formatted as fraction
  noseSize: string; // formatted as fraction
}

export interface StringerInfo {
  type: 'individual' | 'legacy';
  left?: {
    thickness: string;
    width: string;
    material: string;
  };
  right?: {
    thickness: string;
    width: string;
    material: string;
  };
  center?: {
    thickness: string;
    width: string;
    material: string;
  };
  legacy?: {
    type: string;
    material: string;
  };
}

export interface FormattedStairDetails {
  floorToFloor: number;
  numRisers: number;
  treadGroups: TreadGroup[];
  dimensions: StairDimensions;
  materials: {
    tread: string;
    riser: string;
    landing: string;
  };
  stringers: StringerInfo;
  specialOptions: string[];
  specialNotes?: string;
}