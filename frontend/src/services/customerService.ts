import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export interface Customer {
  id: number;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  mobile?: string;
  fax?: string;
  email?: string;
  accounting_email?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  last_visited_at?: string;
}

export interface CreateCustomerRequest {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  mobile?: string;
  fax?: string;
  email?: string;
  accounting_email?: string;
  notes?: string;
}

export interface UpdateCustomerRequest extends CreateCustomerRequest {
  id: number;
}

class CustomerService {
  private getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async getAllCustomers(): Promise<Customer[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/customers`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch customers');
    }
  }

  async getCustomersPaged(params: { page?: number; pageSize?: number; state?: string; hasEmail?: boolean; sortBy?: 'name' | 'created_at'; sortDir?: 'asc' | 'desc'; }): Promise<{ data: Customer[]; page: number; pageSize: number; total: number; totalPages: number; }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/customers`, {
        headers: this.getAuthHeaders(),
        params: {
          page: params.page ?? 1,
          pageSize: params.pageSize ?? 25,
          state: params.state,
          hasEmail: params.hasEmail,
          sortBy: params.sortBy ?? 'name',
          sortDir: params.sortDir ?? 'asc',
        }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch customers');
    }
  }

  async getCustomerById(id: number): Promise<Customer> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/customers/${id}`, {
        headers: this.getAuthHeaders(),
      });
      // The backend automatically updates last_visited_at when fetching by ID
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Customer not found');
      }
      throw new Error(error.response?.data?.error || 'Failed to fetch customer');
    }
  }

  async createCustomer(customerData: CreateCustomerRequest): Promise<Customer> {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/customers`, customerData, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to create customer');
    }
  }

  async updateCustomer(id: number, customerData: CreateCustomerRequest): Promise<Customer> {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/customers/${id}`, customerData, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Customer not found');
      }
      throw new Error(error.response?.data?.error || 'Failed to update customer');
    }
  }

  async deleteCustomer(id: number): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/api/customers/${id}`, {
        headers: this.getAuthHeaders(),
      });
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Customer not found');
      }
      throw new Error(error.response?.data?.error || 'Failed to delete customer');
    }
  }

  async searchCustomers(query: string): Promise<Customer[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/customers/search`, {
        headers: this.getAuthHeaders(),
        params: { q: query, limit: 20, page: 1 }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to search customers');
    }
  }

  async getRecentCustomers(): Promise<Customer[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/customers`, {
        headers: this.getAuthHeaders(),
        params: { recent: true }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch recent customers');
    }
  }
}

const customerService = new CustomerService();
export default customerService;
