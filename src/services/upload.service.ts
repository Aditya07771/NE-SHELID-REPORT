import { apiFetch, ApiResponse } from './api';
import { env } from '@/lib/env';

export interface ImageKitAuthParams {
  token: string;
  expire: number;
  signature: string;
  publicKey?: string;
  urlEndpoint?: string;
}

export class UploadService {
  /**
   * Fetch secure ImageKit authentication parameters from FastAPI backend
   */
  async getUploadAuth(): Promise<ApiResponse<ImageKitAuthParams>> {
    return await apiFetch<ImageKitAuthParams>('/api/v1/uploads/auth', {
      method: 'POST',
    });
  }

  /**
   * Upload image base64 payload to ImageKit
   */
  async uploadImage(base64Data: string, fileName?: string): Promise<{ fileId: string; url: string; thumbnailUrl?: string; fileName?: string } | null> {
    try {
      const authRes = await this.getUploadAuth();

      if (authRes.success && authRes.data) {
        const { token, expire, signature } = authRes.data;
        const publicKey = authRes.data.publicKey || env.IMAGEKIT_PUBLIC_KEY;

        const formData = new FormData();
        formData.append('file', base64Data);
        formData.append('fileName', fileName || `report_${Date.now()}.jpg`);
        formData.append('publicKey', publicKey);
        formData.append('signature', signature);
        formData.append('expire', String(expire));
        formData.append('token', token);
        formData.append('useUniqueFileName', 'true');

        const res = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const ikData = await res.json();
          return {
            fileId: ikData.fileId,
            url: ikData.url,
            thumbnailUrl: ikData.thumbnailUrl || ikData.url,
            fileName: ikData.name,
          };
        }
      }
    } catch (err) {
      console.warn('[UploadService] Upload error, fallback to data URI:', err);
    }

    // Fallback if network or auth unavailable during offline mode
    return {
      fileId: `ik_fallback_${Date.now()}`,
      url: base64Data,
      thumbnailUrl: base64Data,
      fileName: fileName || 'photo.jpg',
    };
  }
}

export const uploadService = new UploadService();
