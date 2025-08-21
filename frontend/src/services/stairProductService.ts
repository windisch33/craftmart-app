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

// Types for Stair Components
export interface StairMaterial {
  id: number;
  mat_seq_n: number;
  matrl_abv: string;
  matrl_nam: string;
  description?: string;
  multiplier: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface StairBoardType {
  id: number;
  brd_typ_id: number;
  brdtyp_des: string;
  purpose?: string;
  // Simplified pricing fields
  base_price?: number;
  length_increment_price?: number;
  width_increment_price?: number;
  mitre_price?: number;
  base_length?: number;
  base_width?: number;
  length_increment_size?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  // Legacy fields (deprecated)
  pric_riser?: boolean;
  pric_bxris?: boolean;
  pric_opris?: boolean;
  pric_doris?: boolean;
}

export interface StairBoardPrice {
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
  created_at?: string;
  updated_at?: string;
  // Joined fields
  brdtyp_des?: string;
  matrl_nam?: string;
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
  created_at?: string;
  updated_at?: string;
  // Joined fields
  matrl_nam?: string;
  multiplier?: number;
}

// Request types for creating/updating
export interface CreateStairMaterialRequest {
  material_name: string;
  multiplier: number;
  display_order?: number;
  is_active?: boolean;
}

export interface UpdateStairMaterialRequest extends Partial<CreateStairMaterialRequest> {
  id: number;
}

export interface CreateBoardTypeRequest {
  brd_typ_id: number;
  brdtyp_des: string;
  purpose?: string;
  // Simplified pricing fields
  base_price?: number;
  length_increment_price?: number;
  width_increment_price?: number;
  mitre_price?: number;
  base_length?: number;
  base_width?: number;
  length_increment_size?: number;
  width_increment_size?: number;
  is_active?: boolean;
}

export interface UpdateBoardTypeRequest extends Partial<CreateBoardTypeRequest> {
  id: number;
}

export interface CreateBoardPriceRequest {
  brd_typ_id: number;
  mat_seq_n: number;
  brdlen_min?: number;
  brdlen_max: number;
  brdwid_min?: number;
  brdwid_max: number;
  brdthk_min?: number;
  brdthk_max?: number;
  unit_cost: number;
  fulmit_cst?: number;
  len_incr?: number;
  len_cost?: number;
  wid_incr?: number;
  wid_cost?: number;
  begin_date?: string;
  end_date?: string;
  is_active?: boolean;
}

export interface UpdateBoardPriceRequest extends Partial<CreateBoardPriceRequest> {
  id: number;
}

export interface CreateSpecialPartRequest {
  stpart_id: number;
  stpar_desc: string;
  mat_seq_n: number;
  position?: string;
  unit_cost: number;
  labor_cost?: number;
  is_active?: boolean;
}

export interface UpdateSpecialPartRequest extends Partial<CreateSpecialPartRequest> {
  id: number;
}

// API service functions
export const stairProductService = {
  // Stair Materials
  getStairMaterials: async (): Promise<StairMaterial[]> => {
    const response = await api.get('/materials');
    return response.data;
  },

  createStairMaterial: async (data: CreateStairMaterialRequest): Promise<StairMaterial> => {
    const response = await api.post('/materials', data);
    return response.data;
  },

  updateStairMaterial: async (id: number, data: Partial<CreateStairMaterialRequest>): Promise<StairMaterial> => {
    const response = await api.put(`/materials/${id}`, data);
    return response.data;
  },

  deleteStairMaterial: async (id: number): Promise<void> => {
    await api.delete(`/materials/${id}`);
  },

  // Board Types
  getBoardTypes: async (): Promise<StairBoardType[]> => {
    const response = await api.get('/board-types');
    return response.data;
  },

  createBoardType: async (data: CreateBoardTypeRequest): Promise<StairBoardType> => {
    const response = await api.post('/board-types', data);
    return response.data;
  },

  updateBoardType: async (id: number, data: Partial<CreateBoardTypeRequest>): Promise<StairBoardType> => {
    const response = await api.put(`/board-types/${id}`, data);
    return response.data;
  },

  deleteBoardType: async (id: number): Promise<void> => {
    await api.delete(`/board-types/${id}`);
  },

  // Board Pricing
  getBoardPrices: async (boardTypeId?: number, materialId?: number): Promise<StairBoardPrice[]> => {
    const params = new URLSearchParams();
    if (boardTypeId) params.append('boardTypeId', boardTypeId.toString());
    if (materialId) params.append('materialId', materialId.toString());
    
    const response = await api.get(`/price-rules?${params.toString()}`);
    return response.data;
  },

  createBoardPrice: async (data: CreateBoardPriceRequest): Promise<StairBoardPrice> => {
    const response = await api.post('/price-rules', data);
    return response.data;
  },

  updateBoardPrice: async (id: number, data: Partial<CreateBoardPriceRequest>): Promise<StairBoardPrice> => {
    const response = await api.put(`/price-rules/${id}`, data);
    return response.data;
  },

  deleteBoardPrice: async (id: number): Promise<void> => {
    await api.delete(`/price-rules/${id}`);
  },

  // Special Parts
  getSpecialParts: async (materialId?: number): Promise<StairSpecialPart[]> => {
    const params = materialId ? { materialId } : {};
    const response = await api.get('/special-parts', { params });
    return response.data;
  },

  createSpecialPart: async (data: CreateSpecialPartRequest): Promise<StairSpecialPart> => {
    const response = await api.post('/special-parts', data);
    return response.data;
  },

  updateSpecialPart: async (id: number, data: Partial<CreateSpecialPartRequest>): Promise<StairSpecialPart> => {
    const response = await api.put(`/special-parts/${id}`, data);
    return response.data;
  },

  deleteSpecialPart: async (id: number): Promise<void> => {
    await api.delete(`/special-parts/${id}`);
  },
};

export default stairProductService;