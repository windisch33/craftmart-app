import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Job interfaces
export interface Job {
  id: number;
  customer_id: number;
  project_id?: number; // Legacy/compatibility
  job_id?: number; // Actual database field name
  salesman_id?: number;
  title: string;
  description?: string;
  status: 'quote' | 'order' | 'invoice';
  delivery_date?: string;
  job_location?: string;
  order_designation?: string;
  model_name?: string;
  installer?: string;
  terms?: string;
  po_number?: string | null;
  show_line_pricing: boolean;
  subtotal: number;
  labor_total: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  deposit_total?: number;
  balance_due?: number;
  created_at: string;
  updated_at: string;
  
  // Joined data
  customer_name: string;
  customer_state?: string;
  salesman_name?: string;
  salesman_first_name?: string;
  salesman_last_name?: string;
}

export interface JobSection {
  id: number;
  job_id: number;
  name: string;
  display_order: number;
  created_at: string;
  updated_at: string;
  items?: QuoteItem[];
}

export interface QuoteItem {
  id: number;
  job_id: number;
  section_id: number;
  part_number?: string;
  product_id?: number;
  product_type?: string;
  product_name?: string;
  material_id?: number;
  material_name?: string;
  material_multiplier?: number;
  length_inches?: number | null;
  include_labor?: boolean;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  is_taxable: boolean;
  stair_config_id?: number;
  stair_configuration?: any;
  created_at: string;
}

export interface JobWithDetails extends Job {
  sections: JobSection[];
}

export interface CreateJobData {
  customer_id: number;
  project_id?: number;
  salesman_id?: number;
  title: string;
  description?: string;
  status?: 'quote' | 'order' | 'invoice';
  delivery_date?: string;
  job_location?: string;
  order_designation?: string;
  model_name?: string;
  installer?: string;
  terms?: string;
  po_number?: string | null;
}

export type UpdateJobData = Partial<CreateJobData>;

export interface CreateJobSectionData {
  name: string;
  display_order?: number;
}

export interface CreateQuoteItemData {
  part_number?: string;
  description: string;
  quantity: number;
  unit_price: number;
  is_taxable?: boolean;
  stair_configuration?: any;
  product_id?: number;
  material_id?: number;
  length_inches?: number;
}

export interface UpdateQuoteItemData extends Partial<CreateQuoteItemData> {
  part_number?: string;
  stair_configuration?: any;
  stair_config_id?: number;
}

class JobService {
  private getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  private mapJobRecord<T extends Partial<JobWithDetails>>(job: T): T {
    if (!job) {
      return job;
    }

    const coerceNumber = (value: any) => (value === null || value === undefined ? 0 : Number(value));

    if ('subtotal' in job) job.subtotal = coerceNumber(job.subtotal ?? job.subtotal);
    if ('labor_total' in job) job.labor_total = coerceNumber(job.labor_total ?? job.labor_total);
    if ('tax_amount' in job) job.tax_amount = coerceNumber(job.tax_amount ?? job.tax_amount);
    if ('total_amount' in job) job.total_amount = coerceNumber(job.total_amount ?? job.total_amount);
    if ('tax_rate' in job) job.tax_rate = job.tax_rate === undefined || job.tax_rate === null ? 0 : Number(job.tax_rate);

    if ('deposit_total' in job) {
      job.deposit_total = coerceNumber(job.deposit_total);
    }

    if ('balance_due' in job) {
      job.balance_due = coerceNumber(job.balance_due);
    } else if ('total_amount' in job) {
      const deposit = typeof job.deposit_total === 'number' ? job.deposit_total : 0;
      job.balance_due = coerceNumber(job.total_amount) - deposit;
    }

    return job;
  }

  // Job CRUD operations
  async getAllJobs(filters?: { 
    status?: string; 
    salesman_id?: number;
    // Advanced search parameters
    searchTerm?: string;
    searchField?: string;
    searchOperator?: string;
    // Filter parameters
    statusFilter?: string[];
    salesmanFilter?: string[];
    dateRangeType?: string;
    dateRangeStart?: string;
    dateRangeEnd?: string;
    amountRangeType?: string;
    amountRangeMin?: number;
    amountRangeMax?: number;
    // Sort parameters
    sortBy?: string;
    sortOrder?: string;
  }): Promise<Job[]> {
    try {
      const params = new URLSearchParams();
      
      // Legacy filters (for backward compatibility)
      if (filters?.status) params.append('status', filters.status);
      if (filters?.salesman_id) params.append('salesman_id', filters.salesman_id.toString());

      // Advanced search parameters
      if (filters?.searchTerm) params.append('searchTerm', filters.searchTerm);
      if (filters?.searchField) params.append('searchField', filters.searchField);
      if (filters?.searchOperator) params.append('searchOperator', filters.searchOperator);

      // Filter parameters
      if (filters?.statusFilter && filters.statusFilter.length > 0) {
        filters.statusFilter.forEach(status => params.append('statusFilter', status));
      }
      if (filters?.salesmanFilter && filters.salesmanFilter.length > 0) {
        filters.salesmanFilter.forEach(salesmanId => params.append('salesmanFilter', salesmanId));
      }
      if (filters?.dateRangeType) params.append('dateRangeType', filters.dateRangeType);
      if (filters?.dateRangeStart) params.append('dateRangeStart', filters.dateRangeStart);
      if (filters?.dateRangeEnd) params.append('dateRangeEnd', filters.dateRangeEnd);
      if (filters?.amountRangeType) params.append('amountRangeType', filters.amountRangeType);
      if (filters?.amountRangeMin !== undefined) params.append('amountRangeMin', filters.amountRangeMin.toString());
      if (filters?.amountRangeMax !== undefined) params.append('amountRangeMax', filters.amountRangeMax.toString());

      // Sort parameters
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);
      if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

      const response = await axios.get(`${API_BASE_URL}/api/job-items?${params.toString()}`, {
        headers: this.getAuthHeaders()
      });
      return Array.isArray(response.data)
        ? response.data.map((job: Job) => this.mapJobRecord(job))
        : [];
    } catch (error) {
      console.error('Error fetching jobs:', error);
      throw error;
    }
  }

  async getRecentJobs(): Promise<Job[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/job-items?recent=true`, {
        headers: this.getAuthHeaders()
      });
      return Array.isArray(response.data)
        ? response.data.map((job: Job) => this.mapJobRecord(job))
        : [];
    } catch (error) {
      console.error('Error fetching recent jobs:', error);
      throw error;
    }
  }

  async getJobsByCustomerId(customerId: number): Promise<Job[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/job-items?customer_id=${customerId}`, {
        headers: this.getAuthHeaders()
      });
      return Array.isArray(response.data)
        ? response.data.map((job: Job) => this.mapJobRecord(job))
        : [];
    } catch (error) {
      console.error('Error fetching jobs by customer:', error);
      throw error;
    }
  }

  async getJobById(id: number): Promise<Job> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/job-items/${id}`, {
        headers: this.getAuthHeaders()
      });
      return this.mapJobRecord(response.data);
    } catch (error) {
      console.error('Error fetching job:', error);
      throw error;
    }
  }

  async getJobWithDetails(id: number): Promise<JobWithDetails> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/job-items/${id}/details`, {
        headers: this.getAuthHeaders()
      });
      const job = this.mapJobRecord(response.data);
      if (job.sections) {
        job.sections = job.sections.map((section: JobSection) => ({
          ...section,
          items: section.items?.map((item: QuoteItem) => ({
            ...item,
            quantity: Number(item.quantity ?? 0),
            unit_price: Number(item.unit_price ?? 0),
            line_total: Number(item.line_total ?? (Number(item.quantity ?? 0) * Number(item.unit_price ?? 0)))
          })) || []
        }));
      }
      return job;
    } catch (error) {
      console.error('Error fetching job details:', error);
      throw error;
    }
  }

  async createJob(data: CreateJobData): Promise<Job> {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/job-items`, data, {
        headers: this.getAuthHeaders()
      });
      return this.mapJobRecord(response.data);
    } catch (error: any) {
      const errData = error?.response?.data;
      const baseMsg = errData?.message || errData?.error || 'Failed to create job';
      const detailsArr = Array.isArray(errData?.details) ? errData.details : [];
      const detailsText = detailsArr.length
        ? detailsArr.map((d: any) => (d?.field ? `${d.field}: ${d.message}` : (d?.message ?? JSON.stringify(d)))).join('; ')
        : '';
      const message = detailsText ? `${baseMsg}: ${detailsText}` : baseMsg;
      console.error('Error creating job:', message, errData || error);
      throw new Error(message);
    }
  }

  async updateJob(id: number, data: UpdateJobData): Promise<Job> {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/job-items/${id}`, data, {
        headers: this.getAuthHeaders()
      });
      return this.mapJobRecord(response.data);
    } catch (error) {
      console.error('Error updating job:', error);
      throw error;
    }
  }

  async deleteJob(id: number): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/api/job-items/${id}`, {
        headers: this.getAuthHeaders()
      });
    } catch (error) {
      console.error('Error deleting job:', error);
      throw error;
    }
  }

  // Job Sections operations
  async getJobSections(jobId: number): Promise<JobSection[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/job-items/${jobId}/sections`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching job sections:', error);
      throw error;
    }
  }

  async createJobSection(jobId: number, data: CreateJobSectionData): Promise<JobSection> {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/job-items/${jobId}/sections`, data, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error creating job section:', error);
      throw error;
    }
  }

  async updateJobSection(sectionId: number, data: Partial<CreateJobSectionData>): Promise<JobSection> {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/job-sections/${sectionId}`, data, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error updating job section:', error);
      throw error;
    }
  }

  async deleteJobSection(sectionId: number): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/api/job-sections/${sectionId}`, {
        headers: this.getAuthHeaders()
      });
    } catch (error) {
      console.error('Error deleting job section:', error);
      throw error;
    }
  }

  // Quote Items operations
  async addQuoteItem(jobId: number, sectionId: number, data: CreateQuoteItemData): Promise<QuoteItem> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/job-items/${jobId}/sections/${sectionId}/items`, 
        data,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      const baseMsg = error?.response?.data?.error || error?.response?.data?.message || 'Failed to add quote item';
      const details = Array.isArray(error?.response?.data?.details) ? error.response.data.details : [];
      const message = details.length ? `${baseMsg}: ${details[0]}` : baseMsg;
      console.error('Error adding quote item:', message, error);
      throw new Error(message);
    }
  }

  async updateQuoteItem(itemId: number, data: UpdateQuoteItemData): Promise<QuoteItem> {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/quote-items/${itemId}`, data, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error updating quote item:', error);
      throw error;
    }
  }

  async deleteQuoteItem(itemId: number): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/api/quote-items/${itemId}`, {
        headers: this.getAuthHeaders()
      });
    } catch (error) {
      console.error('Error deleting quote item:', error);
      throw error;
    }
  }

  // PDF Generation
  async downloadJobPDF(jobId: number, filename?: string): Promise<void> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/job-items/${jobId}/pdf`, {
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/pdf'
        },
        responseType: 'blob'
      });

      // Create download link
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `Job_${jobId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading job PDF:', error);
      throw error;
    }
  }

  // Utility functions
  formatJobStatus(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

 getStatusColor(status: string): { bg: string; color: string; border: string } {
    switch (status) {
      case 'quote':
        return { bg: '#fef3c7', color: '#92400e', border: '#fbbf24' }; // Yellow
      case 'order':
        return { bg: 'var(--color-primary-200)', color: 'var(--color-primary-800)', border: 'var(--color-primary)' }; // Primary
      case 'invoice':
        return { bg: '#d1fae5', color: '#065f46', border: '#10b981' }; // Green
      default:
        return { bg: '#f3f4f6', color: '#374151', border: '#d1d5db' }; // Gray
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  calculateJobProgress(job: Job): number {
    if (job.status === 'quote') return 25;
    if (job.status === 'order') return 60;
    if (job.status === 'invoice') return 100;
    return 0;
  }
}

export const jobService = new JobService();
export default jobService;
