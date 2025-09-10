import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

import type { Job } from './jobService';

export interface Project {
  id: number;
  customer_id: number;
  name: string;
  created_at: string;
  updated_at: string;
  // Aggregated/joined fields
  customer_name?: string;
  customer_city?: string;
  customer_state?: string;
  job_count?: number;
  total_value?: number;
  // Expanded relation (used in ProjectDetail)
  jobs?: Job[];
}

export interface CreateProjectData {
  customer_id: number;
  name: string;
}

export interface UpdateProjectData {
  name: string;
}

class ProjectService {
  private getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async getAllProjects(): Promise<Project[]> {
    const response = await axios.get(`${API_BASE_URL}/api/jobs`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async getProjectById(id: number): Promise<Project> {
    const response = await axios.get(`${API_BASE_URL}/api/jobs/${id}` , {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async createProject(data: CreateProjectData): Promise<Project> {
    const response = await axios.post(`${API_BASE_URL}/api/jobs`, data, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async updateProject(id: number, data: UpdateProjectData): Promise<Project> {
    const response = await axios.put(`${API_BASE_URL}/api/jobs/${id}`, data, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async deleteProject(id: number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/api/jobs/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }
}

export const projectService = new ProjectService();
export default projectService;
