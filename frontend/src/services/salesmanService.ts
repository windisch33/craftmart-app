import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export interface Salesman {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  commission_rate: number;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SalesmanStats {
  total_jobs: number;
  quotes: number;
  orders: number;
  invoices: number;
  total_sales: number;
}

export interface CreateSalesmanData {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  commission_rate?: number;
  notes?: string;
}

export interface UpdateSalesmanData extends CreateSalesmanData {
  is_active?: boolean;
}

class SalesmanService {
  private getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  async getAllSalesmen(activeOnly: boolean = true): Promise<Salesman[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/salesmen`, {
        headers: this.getAuthHeaders(),
        params: { active: activeOnly }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch salesmen');
    }
  }

  async getSalesmanById(id: number): Promise<Salesman> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/salesmen/${id}`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Salesman not found');
      }
      throw new Error(error.response?.data?.error || 'Failed to fetch salesman');
    }
  }

  async createSalesman(data: CreateSalesmanData): Promise<Salesman> {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/salesmen`, data, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to create salesman');
    }
  }

  async updateSalesman(id: number, data: UpdateSalesmanData): Promise<Salesman> {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/salesmen/${id}`, data, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Salesman not found');
      }
      throw new Error(error.response?.data?.error || 'Failed to update salesman');
    }
  }

  async deleteSalesman(id: number): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/api/salesmen/${id}`, {
        headers: this.getAuthHeaders()
      });
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Salesman not found');
      }
      throw new Error(error.response?.data?.error || 'Failed to delete salesman');
    }
  }

  async searchSalesmen(query: string): Promise<Salesman[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/salesmen/search`, {
        headers: this.getAuthHeaders(),
        params: { q: query }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to search salesmen');
    }
  }

  async getSalesmanStats(id: number): Promise<SalesmanStats> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/salesmen/${id}/stats`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Salesman not found');
      }
      throw new Error(error.response?.data?.error || 'Failed to fetch salesman stats');
    }
  }

  formatSalesmanName(salesman: Salesman): string {
    return `${salesman.first_name} ${salesman.last_name}`;
  }

  formatCommissionRate(rate: number | string | null | undefined): string {
    const n = Number(rate);
    if (!Number.isFinite(n)) return '--';
    return `${n.toFixed(2)}%`;
  }
}

export const salesmanService = new SalesmanService();
export default salesmanService;
