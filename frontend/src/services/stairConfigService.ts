import axios from 'axios';
import type { StairConfigurationDetails } from '../types/stairTypes';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

class StairConfigService {
  private getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Get stair configuration by ID with all details including items
   */
  async getStairConfiguration(configId: number): Promise<StairConfigurationDetails> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/stairs/configurations/${configId}`, 
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching stair configuration:', error);
      throw error;
    }
  }

  /**
   * Get all stair configurations for a job
   */
  async getJobStairConfigurations(jobId: number): Promise<StairConfigurationDetails[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/stairs/jobs/${jobId}/configurations`, 
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching job stair configurations:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const stairConfigService = new StairConfigService();
export default stairConfigService;