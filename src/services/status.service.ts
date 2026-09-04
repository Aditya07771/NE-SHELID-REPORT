import { apiFetch, ApiResponse } from './api';

export class StatusService {
  /**
   * Fetch current report status from FastAPI backend
   */
  async getReportStatus(reportId: string): Promise<ApiResponse> {
    return await apiFetch(`/api/v1/reports/${encodeURIComponent(reportId)}/status`, {
      method: 'GET',
    });
  }
}

export const statusService = new StatusService();
