import { apiFetch, ApiResponse } from './api';

export interface CreateReportDTO {
  localId: string;
  reporterPhone: string;
  incidentType: 'LANDSLIDE' | 'VISIBLE_CRACK' | 'ROAD_BLOCKAGE' | 'ROCKFALL' | 'FLOODING' | 'OTHER_HAZARD';
  description: string;
  userSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  roadBlocked?: boolean;
  peopleNearby?: boolean;
  buildingsNearby?: boolean;
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    capturedAt?: string;
  };
  images?: Array<{
    fileId: string;
    url: string;
    thumbnailUrl?: string;
    fileName?: string;
  }>;
}

export class ReportService {
  /**
   * Submit a new crowd report to the FastAPI backend
   */
  async createReport(reportData: CreateReportDTO): Promise<ApiResponse> {
    return await apiFetch('/api/v1/reports', {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  }

  /**
   * Retrieve all reports associated with a specific reporter's phone number
   */
  async getReportsByPhone(reporterPhone: string): Promise<ApiResponse> {
    return await apiFetch(`/api/v1/reports?phone=${encodeURIComponent(reporterPhone)}`, {
      method: 'GET',
    });
  }

  /**
   * Get single report details by ID or referenceId
   */
  async getReportById(id: string): Promise<ApiResponse> {
    return await apiFetch(`/api/v1/reports/${encodeURIComponent(id)}`, {
      method: 'GET',
    });
  }
}

export const reportService = new ReportService();
