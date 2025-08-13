import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Create axios instance with default config
const api = axios.create({
  baseURL: `${API_BASE_URL}/api/stairs`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Types
export interface StairMaterial {
  id: number;
  mat_seq_n: number;
  matrl_abv: string;
  matrl_nam: string;
  description?: string;
  multiplier: number;
  is_active: boolean;
}

export interface StairBoardType {
  id: number;
  brd_typ_id: number;
  brdtyp_des: string;
  purpose?: string;
  pric_riser: boolean;
  pric_bxris: boolean;
  pric_opris: boolean;
  pric_doris: boolean;
  is_active: boolean;
}

export interface StairSpecialPart {
  id: number;
  stpart_id: number;
  stpar_desc: string;
  mat_seq_n: number;
  position?: string;
  unit_cost: number;
  labor_cost: number;
  is_active: boolean;
  matrl_nam?: string;
  multiplier?: number;
}

export interface StairPriceRule {
  id: number;
  brd_typ_id: number;
  mat_seq_n: number;
  brdlen_min: number;
  brdlen_max: number;
  brdwid_min: number;
  brdwid_max: number;
  brdthk_min: number;
  brdthk_max: number;
  unit_cost: number;
  fulmit_cst: number;
  len_incr: number;
  len_cost: number;
  wid_incr: number;
  wid_cost: number;
  begin_date: string;
  end_date: string;
  is_active: boolean;
  brdtyp_des?: string;
  matrl_nam?: string;
}

export interface TreadConfiguration {
  riserNumber: number;
  type: 'box' | 'open_left' | 'open_right' | 'double_open';
  stairWidth: number; // Renamed from length - left-to-right measurement of staircase
}

export interface SpecialPartConfiguration {
  partId: number;
  materialId?: number;
  quantity: number;
  position?: string;
}

export interface StairPriceRequest {
  floorToFloor: number;
  numRisers: number;
  treads: TreadConfiguration[];
  treadMaterialId: number;
  riserMaterialId: number;
  stringerType?: string;
  stringerMaterialId?: number;
  numStringers?: number;
  centerHorses?: number;
  fullMitre?: boolean;
  specialParts?: SpecialPartConfiguration[];
}

export interface StairPriceBreakdown {
  treads: {
    riserNumber: number;
    type: string;
    stairWidth: number; // Updated to match backend - left-to-right measurement
    basePrice: number;
    oversizedCharge: number;
    mitreCharge: number;
    totalPrice: number;
  }[];
  risers: {
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  stringers: {
    type: string;
    quantity: number;
    risers: number;
    unitPricePerRiser: number;
    totalPrice: number;
  }[];
  specialParts: {
    description: string;
    quantity: number;
    unitPrice: number;
    laborCost: number;
    totalPrice: number;
  }[];
  labor: {
    description: string;
    totalPrice: number;
  }[];
}

export interface StairPriceResponse {
  configuration: {
    floorToFloor: number;
    numRisers: number;
    riserHeight: string;
    fullMitre: boolean;
  };
  breakdown: StairPriceBreakdown;
  subtotal: string;
  laborTotal: string;
  taxAmount: string;
  total: string;
}

export interface StairConfiguration {
  id?: number;
  jobId?: number;
  configName: string;
  floorToFloor: number;
  numRisers: number;
  riserHeight?: number;
  treadMaterialId: number;
  riserMaterialId: number;
  treadSize: string; // Legacy field for backward compatibility
  roughCutWidth: number; // New field for flexible tread sizing
  noseSize: number;
  stringerType?: string;
  stringerMaterialId?: number;
  numStringers?: number;
  centerHorses?: number;
  fullMitre: boolean;
  bracketType?: string;
  subtotal: number;
  laborTotal: number;
  taxAmount: number;
  totalAmount: number;
  specialNotes?: string;
  items?: any[];
  createdAt?: string;
  updatedAt?: string;
}

// API functions
export const stairService = {
  // Get stair materials
  getMaterials: async (): Promise<StairMaterial[]> => {
    const response = await api.get('/materials');
    return response.data;
  },

  // Get board types
  getBoardTypes: async (): Promise<StairBoardType[]> => {
    const response = await api.get('/board-types');
    return response.data;
  },

  // Get special parts
  getSpecialParts: async (materialId?: number): Promise<StairSpecialPart[]> => {
    const params = materialId ? { materialId } : {};
    const response = await api.get('/special-parts', { params });
    return response.data;
  },

  // Get price rules
  getPriceRules: async (boardTypeId?: number, materialId?: number): Promise<StairPriceRule[]> => {
    const params: any = {};
    if (boardTypeId) params.boardTypeId = boardTypeId;
    if (materialId) params.materialId = materialId;
    
    const response = await api.get('/price-rules', { params });
    return response.data;
  },

  // Calculate stair price
  calculatePrice: async (request: StairPriceRequest): Promise<StairPriceResponse> => {
    const response = await api.post('/calculate-price', request);
    return response.data;
  },

  // Save stair configuration
  saveConfiguration: async (config: Omit<StairConfiguration, 'id'>): Promise<StairConfiguration> => {
    const response = await api.post('/configurations', config);
    return response.data;
  },

  // Get stair configuration by ID
  getConfiguration: async (id: number): Promise<StairConfiguration> => {
    const response = await api.get(`/configurations/${id}`);
    return response.data;
  },

  // Get all configurations for a job
  getJobConfigurations: async (jobId: number): Promise<StairConfiguration[]> => {
    const response = await api.get(`/jobs/${jobId}/configurations`);
    return response.data;
  },

  // Delete stair configuration
  deleteConfiguration: async (id: number): Promise<void> => {
    await api.delete(`/configurations/${id}`);
  },
};

export default stairService;