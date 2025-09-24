import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Types for shop data
export interface Shop {
  id: number;
  shop_number: string;
  cut_sheets: CutSheetItem[];
  status: 'generated' | 'in_progress' | 'completed';
  generated_date: string;
  cut_sheet_count: number;
  notes?: string;
  jobs: ShopJobSummary[];
}

export interface CutSheetItem {
  item_type: string;
  tread_type?: string;
  material: string;
  quantity: number;
  width: number;
  length: number;
  thickness?: string;
  stair_id: string;
  location: string;
  job_id?: number;
  job_title?: string;
  notes?: string;
}

export interface ShopJobSummary {
  job_id: number;
  order_number?: string;
  job_title?: string | null;
  lot_name?: string | null;
  directions?: string | null;
  customer_name: string;
  customer_address?: string | null;
  customer_city?: string | null;
  customer_state?: string | null;
  customer_zip?: string | null;
  customer_phone?: string | null;
  customer_fax?: string | null;
  customer_cell?: string | null;
  customer_email?: string | null;
  contact_person?: string | null;
  job_location?: string | null;
  shop_date?: string | null;
  delivery_date?: string | null;
  oak_delivery_date?: string | null;
  sales_rep_name?: string | null;
  sales_rep_phone?: string | null;
  sales_rep_email?: string | null;
  order_designation?: string | null;
  model_name?: string | null;
  terms?: string | null;
}

export interface AvailableOrder {
  id: number;
  title: string;
  customer_id: number;
  customer_name: string;
  delivery_date: string;
  shops_run: boolean;
  shops_run_date: string | null;
  created_at: string;
  stair_config_count: number;
}

export interface ShopGenerationRequest {
  orderIds: number[];
}

export interface ShopGenerationResponse {
  id: number;
  shop_number: string;
  job_ids: number[];
  cut_sheets: CutSheetItem[];
  status: string;
  generated_date: string;
  jobs: ShopJobSummary[];
}

class ShopService {
  private getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private normalizeShop(raw: any): Shop {
    const cutSheets = Array.isArray(raw.cut_sheets) ? raw.cut_sheets : [];
    const jobs: ShopJobSummary[] = Array.isArray(raw.jobs)
      ? raw.jobs.map((job: any) => ({
          job_id: job.job_id,
          ...job,
          customer_name: job.customer_name ?? 'Unknown Customer'
        }))
      : [];

    return {
      id: raw.id,
      shop_number: raw.shop_number,
      cut_sheets: cutSheets,
      status: raw.status,
      generated_date: raw.generated_date,
      cut_sheet_count: typeof raw.cut_sheet_count === 'number' ? raw.cut_sheet_count : cutSheets.length,
      notes: raw.notes ?? undefined,
      jobs
    };
  }

  /**
   * Get all shops
   */
  async getShops(): Promise<Shop[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/shops`, {
        headers: this.getAuthHeaders()
      });
      return Array.isArray(response.data)
        ? response.data.map((shop: any) => this.normalizeShop(shop))
        : [];
    } catch (error: any) {
      console.error('Error fetching shops:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch shops');
    }
  }

  /**
   * Get shop by ID
   */
  async getShop(shopId: number): Promise<Shop> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/shops/${shopId}`, {
        headers: this.getAuthHeaders()
      });
      return this.normalizeShop(response.data);
    } catch (error: any) {
      console.error('Error fetching shop:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch shop');
    }
  }

  /**
   * Get available orders for shop generation
   */
  async getAvailableOrders(filter: 'all' | 'unrun' = 'all'): Promise<AvailableOrder[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/shops/available-orders`, {
        params: { filter },
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching available orders:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch available orders');
    }
  }

  /**
   * Generate shops from selected orders
   */
  async generateShops(orderIds: number[]): Promise<ShopGenerationResponse> {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/shops/generate`, 
        { orderIds }, 
        { headers: this.getAuthHeaders() }
      );
      const raw = response.data;
      return {
        ...raw,
        jobs: Array.isArray(raw.jobs)
          ? raw.jobs.map((job: any) => ({
              job_id: job.job_id,
              ...job,
              customer_name: job.customer_name ?? 'Unknown Customer'
            }))
          : [],
        cut_sheets: Array.isArray(raw.cut_sheets) ? raw.cut_sheets : []
      };
    } catch (error: any) {
      console.error('Error generating shops:', error);
      throw new Error(error.response?.data?.error || 'Failed to generate shops');
    }
  }

  /**
   * Update shop status
   */
  async updateShopStatus(shopId: number, status: 'generated' | 'in_progress' | 'completed'): Promise<void> {
    try {
      await axios.put(`${API_BASE_URL}/api/shops/${shopId}/status`, 
        { status }, 
        { headers: this.getAuthHeaders() }
      );
    } catch (error: any) {
      console.error('Error updating shop status:', error);
      throw new Error(error.response?.data?.error || 'Failed to update shop status');
    }
  }

  /**
   * Download shop paper PDF
   */
  async downloadShopPaper(shopId: number): Promise<void> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/shops/${shopId}/shop-paper`, {
        responseType: 'blob',
        headers: this.getAuthHeaders()
      });

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ShopPaper_${shopId}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error downloading shop paper:', error);
      throw new Error(error.response?.data?.error || 'Failed to download shop paper');
    }
  }

  /**
   * Download cut list PDF
   */
  async downloadCutList(shopId: number): Promise<void> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/shops/${shopId}/cut-list`, {
        responseType: 'blob',
        headers: this.getAuthHeaders()
      });

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `CutList_${shopId}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error downloading cut list:', error);
      throw new Error(error.response?.data?.error || 'Failed to download cut list');
    }
  }

  /**
   * Delete shop
   */
  async deleteShop(shopId: number): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/api/shops/${shopId}`, {
        headers: this.getAuthHeaders()
      });
    } catch (error: any) {
      console.error('Error deleting shop:', error);
      throw new Error(error.response?.data?.error || 'Failed to delete shop');
    }
  }
}

export const shopService = new ShopService();
