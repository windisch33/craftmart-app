import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export type PaymentMethod = 'check' | 'cash' | 'credit_card' | 'ach' | 'wire' | 'other';
export type DepositStatus = 'allocated' | 'partial' | 'unallocated';

export interface DepositListItem {
  id: number;
  customerId: number;
  paymentMethod: PaymentMethod;
  referenceNumber: string | null;
  paymentDate: string | null;
  totalAmount: number;
  depositDate: string;
  notes: string | null;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
  unallocatedAmount: number;
  allocatedAmount: number;
  status: DepositStatus;
}

export interface AllocationRecord {
  id: number;
  depositId: number;
  jobId: number;
  jobItemId: number;
  jobItemTitle: string | null;
  amount: number;
  allocationDate: string;
  notes: string | null;
  createdBy: number;
  createdAt: string;
}

export interface DepositDetail extends DepositListItem {
  allocations: AllocationRecord[];
}

export interface DepositCustomerJob {
  jobId: number;
  jobName: string;
  status: string | null;
  totalAmount: number;
  totalDeposits: number;
  balanceDue: number;
}

export interface DepositJobItem {
  id: number;
  jobId: number;
  title: string;
  status: string | null;
  description: string | null;
  totalAmount: number;
  allocatedAmount: number;
  balanceDue: number;
}

export interface CreateDepositRequest {
  customer_id: number;
  payment_method: PaymentMethod;
  reference_number?: string;
  payment_date?: string | null;
  deposit_date?: string | null;
  total_amount: number;
  notes?: string;
  initial_allocations?: Array<{
    job_id: number;
    job_item_id: number;
    amount: number;
    notes?: string;
  }>;
}

export interface AllocateDepositRequest {
  allocations: Array<{
    job_id: number;
    job_item_id: number;
    amount: number;
    notes?: string;
  }>;
}

export interface DepositFilters {
  customerId?: number;
  paymentMethod?: PaymentMethod;
  status?: DepositStatus;
  limit?: number;
  offset?: number;
}

class DepositService {
  private getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  async listDeposits(filters: DepositFilters = {}): Promise<DepositListItem[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/deposits`, {
        headers: this.getAuthHeaders(),
        params: {
          customer_id: filters.customerId,
          payment_method: filters.paymentMethod,
          status: filters.status,
          limit: filters.limit,
          offset: filters.offset
        }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to load deposits');
    }
  }

  async getDeposit(id: number): Promise<DepositDetail> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/deposits/${id}`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Deposit not found');
      }
      throw new Error(error.response?.data?.error || 'Failed to load deposit details');
    }
  }

  async createDeposit(payload: CreateDepositRequest): Promise<DepositDetail> {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/deposits`, payload, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to create deposit');
    }
  }

  async allocateDeposit(id: number, payload: AllocateDepositRequest): Promise<DepositDetail> {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/deposits/${id}/allocate`, payload, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to allocate deposit');
    }
  }

  async removeAllocation(allocationId: number): Promise<DepositDetail> {
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/deposits/allocations/${allocationId}`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to remove allocation');
    }
  }

  async getCustomerJobs(customerId: number): Promise<DepositCustomerJob[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/deposits/customers/${customerId}/jobs`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to load customer jobs');
    }
  }

  async getJobItems(jobId: number): Promise<DepositJobItem[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/deposits/jobs/${jobId}/items`, {
        headers: this.getAuthHeaders()
      });
      return (response.data ?? []).map((item: any) => {
        const totalAmount = Number(item.total_amount ?? 0);
        const allocatedAmount = Number(item.allocated_amount ?? 0);
        const balanceDue = Number(item.balance_due ?? (totalAmount - allocatedAmount));

        return {
          id: item.id,
          jobId: item.job_id,
          title: item.title,
          status: item.status ?? null,
          description: item.description ?? null,
          totalAmount,
          allocatedAmount,
          balanceDue
        } satisfies DepositJobItem;
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to load job items');
    }
  }
}

const depositService = new DepositService();
export default depositService;
