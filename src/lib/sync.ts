import { getPendingOfflineReports, markReportSynced, OfflineReport } from './db';
import { reportService } from '@/services/report.service';
import { uploadService } from '@/services/upload.service';

export class SyncManager {
  private isSyncing = false;

  async syncAllPending(): Promise<{ synced: number; failed: number }> {
    if (this.isSyncing) return { synced: 0, failed: 0 };
    if (typeof window !== 'undefined' && !navigator.onLine) {
      return { synced: 0, failed: 0 };
    }

    this.isSyncing = true;
    let synced = 0;
    let failed = 0;

    try {
      const pendingReports = await getPendingOfflineReports();
      console.log(`[SyncManager] Found ${pendingReports.length} pending reports to sync to FastAPI backend...`);

      for (const report of pendingReports) {
        try {
          const success = await this.syncSingleReport(report);
          if (success) {
            await markReportSynced(report.localId);
            synced++;
          } else {
            failed++;
          }
        } catch (err) {
          console.error(`[SyncManager] Sync failed for localId ${report.localId}:`, err);
          failed++;
        }
      }
    } finally {
      this.isSyncing = false;
    }

    return { synced, failed };
  }

  private async syncSingleReport(report: OfflineReport): Promise<boolean> {
    // 1. Upload pending images via uploadService
    const processedImages: Array<{ fileId: string; url: string; thumbnailUrl?: string; fileName?: string }> = [];

    if (report.images && report.images.length > 0) {
      for (const img of report.images) {
        if (img.url && img.fileId) {
          processedImages.push({
            fileId: img.fileId,
            url: img.url,
            thumbnailUrl: img.thumbnailUrl || img.url,
            fileName: img.fileName || 'report_image.jpg',
          });
        } else if (img.base64) {
          const uploaded = await uploadService.uploadImage(img.base64, img.fileName);
          if (uploaded) {
            processedImages.push(uploaded);
          }
        }
      }
    }

    // 2. Submit report payload to FastAPI backend via reportService
    const payload = {
      localId: report.localId,
      reporterPhone: report.reporterPhone,
      incidentType: report.incidentType,
      description: report.description,
      userSeverity: report.userSeverity,
      roadBlocked: report.roadBlocked,
      peopleNearby: report.peopleNearby,
      buildingsNearby: report.buildingsNearby,
      location: report.location,
      images: processedImages,
    };

    const res = await reportService.createReport(payload);
    return res.success === true;
  }
}

export const syncManager = new SyncManager();
