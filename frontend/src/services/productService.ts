import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Product interfaces
export interface Product {
  id: number;
  name: string;
  product_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  cost_per_6_inches?: number;
  labor_install_cost?: number;
  base_price?: number;
}

export interface CreateHandrailProductRequest {
  name: string;
  cost_per_6_inches: number;
  labor_install_cost: number;
}

export interface UpdateHandrailProductRequest {
  name: string;
  cost_per_6_inches: number;
  labor_install_cost: number;
}

export interface CreateLandingTreadProductRequest {
  name: string;
  cost_per_6_inches: number;
  labor_install_cost: number;
}

export interface UpdateLandingTreadProductRequest {
  name: string;
  cost_per_6_inches: number;
  labor_install_cost: number;
}

export interface CreateRailPartsProductRequest {
  name: string;
  base_price: number;
  labor_install_cost: number;
}

export interface UpdateRailPartsProductRequest {
  name: string;
  base_price: number;
  labor_install_cost: number;
}

class ProductService {
  private getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  // Get all products with optional type filtering
  async getAllProducts(type?: string): Promise<Product[]> {
    try {
      const params = type ? { type } : {};
      const response = await axios.get(`${API_BASE_URL}/api/products`, {
        headers: this.getAuthHeaders(),
        params,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw new Error('Failed to fetch products');
    }
  }

  // Get handrail products specifically
  async getHandrailProducts(): Promise<Product[]> {
    return this.getAllProducts('handrail');
  }

  // Get product by ID
  async getProductById(id: number): Promise<Product> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/products/${id}`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching product:', error);
      throw new Error('Failed to fetch product');
    }
  }

  // Create handrail product
  async createHandrailProduct(productData: CreateHandrailProductRequest): Promise<Product> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/products/handrails`,
        productData,
        {
          headers: this.getAuthHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating handrail product:', error);
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to create handrail product');
    }
  }

  // Update handrail product
  async updateHandrailProduct(id: number, productData: UpdateHandrailProductRequest): Promise<Product> {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/products/handrails/${id}`,
        productData,
        {
          headers: this.getAuthHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating handrail product:', error);
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to update handrail product');
    }
  }

// Get landing tread products specifically
  async getLandingTreadProducts(): Promise<Product[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/products/landing-treads`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching landing tread products:', error);
      throw new Error('Failed to fetch landing tread products');
    }
  }

  // Create landing tread product
  async createLandingTreadProduct(productData: CreateLandingTreadProductRequest): Promise<Product> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/products/landing-treads`,
        productData,
        {
          headers: this.getAuthHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating landing tread product:', error);
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to create landing tread product');
    }
  }

  // Update landing tread product
  async updateLandingTreadProduct(id: number, productData: UpdateLandingTreadProductRequest): Promise<Product> {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/products/landing-treads/${id}`,
        productData,
        {
          headers: this.getAuthHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating landing tread product:', error);
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to update landing tread product');
    }
  }

// Get rail parts products specifically
  async getRailPartsProducts(): Promise<Product[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/products/rail-parts`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching rail parts products:', error);
      throw new Error('Failed to fetch rail parts products');
    }
  }

  // Create rail parts product
  async createRailPartsProduct(productData: CreateRailPartsProductRequest): Promise<Product> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/products/rail-parts`,
        productData,
        {
          headers: this.getAuthHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating rail parts product:', error);
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to create rail parts product');
    }
  }

  // Update rail parts product
  async updateRailPartsProduct(id: number, productData: UpdateRailPartsProductRequest): Promise<Product> {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/products/rail-parts/${id}`,
        productData,
        {
          headers: this.getAuthHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating rail parts product:', error);
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to update rail parts product');
    }
  }

  // Delete product
  async deleteProduct(id: number): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/api/products/${id}`, {
        headers: this.getAuthHeaders(),
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to delete product');
    }
  }

  // Calculate price for handrail item
  calculateHandrailPrice(
    lengthInches: number,
    costPer6Inches: number,
    materialMultiplier: number,
    laborCost: number,
    includeLabor: boolean
  ): number {
    const segments = lengthInches / 6;
    const materialCost = segments * costPer6Inches * materialMultiplier;
    const totalLaborCost = includeLabor ? laborCost : 0;
    return Number((materialCost + totalLaborCost).toFixed(2));
  }

  // Calculate price for rail parts item (base price * material multiplier + optional labor)
  calculateRailPartsPrice(
    basePrice: number,
    materialMultiplier: number,
    laborCost: number,
    includeLabor: boolean,
    quantity: number = 1
  ): number {
    const materialCost = basePrice * materialMultiplier * quantity;
    const totalLaborCost = includeLabor ? laborCost * quantity : 0;
    return Number((materialCost + totalLaborCost).toFixed(2));
  }
}

export default new ProductService();