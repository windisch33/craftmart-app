import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Material interfaces
export interface Material {
  id: number;
  name: string;
  multiplier: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateMaterialRequest {
  name: string;
  multiplier: number;
  description?: string;
}

export interface UpdateMaterialRequest {
  name: string;
  multiplier: number;
  description?: string;
}

class MaterialService {
  private getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  // Get all active materials
  async getAllMaterials(): Promise<Material[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/materials`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching materials:', error);
      throw new Error('Failed to fetch materials');
    }
  }

  // Get material by ID
  async getMaterialById(id: number): Promise<Material> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/materials/${id}`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching material:', error);
      throw new Error('Failed to fetch material');
    }
  }

  // Create new material
  async createMaterial(materialData: CreateMaterialRequest): Promise<Material> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/materials`,
        materialData,
        {
          headers: this.getAuthHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating material:', error);
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to create material');
    }
  }

  // Update material
  async updateMaterial(id: number, materialData: UpdateMaterialRequest): Promise<Material> {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/materials/${id}`,
        materialData,
        {
          headers: this.getAuthHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating material:', error);
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to update material');
    }
  }

  // Delete material
  async deleteMaterial(id: number): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/api/materials/${id}`, {
        headers: this.getAuthHeaders(),
      });
    } catch (error) {
      console.error('Error deleting material:', error);
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to delete material');
    }
  }
}

export default new MaterialService();