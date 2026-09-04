import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface OfflineReport {
  localId: string;
  reporterPhone: string;
  incidentType: 'LANDSLIDE' | 'VISIBLE_CRACK' | 'ROAD_BLOCKAGE' | 'ROCKFALL' | 'FLOODING' | 'OTHER_HAZARD';
  description: string;
  userSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  roadBlocked: boolean;
  peopleNearby: boolean;
  buildingsNearby: boolean;
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    capturedAt?: string;
  };
  images: Array<{
    localImageId?: string;
    fileId?: string;
    url?: string;
    thumbnailUrl?: string;
    fileName?: string;
    base64?: string;
  }>;
  createdAt: string;
  syncStatus: 'PENDING_SYNC' | 'SYNCED' | 'FAILED';
  errorMessage?: string;
}

export interface OfflineImage {
  id: string;
  localReportId: string;
  fileName: string;
  mimeType: string;
  base64: string;
}

export interface SyncQueueItem {
  id: string;
  localReportId: string;
  addedAt: string;
  retryCount: number;
}

interface NEShieldDB extends DBSchema {
  offlineReports: {
    key: string;
    value: OfflineReport;
    indexes: { 'by-syncStatus': string; 'by-phone': string };
  };
  offlineImages: {
    key: string;
    value: OfflineImage;
    indexes: { 'by-reportId': string };
  };
  syncQueue: {
    key: string;
    value: SyncQueueItem;
  };
}

const DB_NAME = 'ne_shield_crowd_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<NEShieldDB>> | null = null;

export function getDB() {
  if (typeof window === 'undefined') return null;

  if (!dbPromise) {
    dbPromise = openDB<NEShieldDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // offlineReports store
        if (!db.objectStoreNames.contains('offlineReports')) {
          const reportStore = db.createObjectStore('offlineReports', { keyPath: 'localId' });
          reportStore.createIndex('by-syncStatus', 'syncStatus');
          reportStore.createIndex('by-phone', 'reporterPhone');
        }
        // offlineImages store
        if (!db.objectStoreNames.contains('offlineImages')) {
          const imageStore = db.createObjectStore('offlineImages', { keyPath: 'id' });
          imageStore.createIndex('by-reportId', 'localReportId');
        }
        // syncQueue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          db.createObjectStore('syncQueue', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export async function saveOfflineReport(report: OfflineReport): Promise<void> {
  const db = await getDB();
  if (!db) return;

  await db.put('offlineReports', report);
  await db.put('syncQueue', {
    id: report.localId,
    localReportId: report.localId,
    addedAt: new Date().toISOString(),
    retryCount: 0,
  });
}

export async function getPendingOfflineReports(): Promise<OfflineReport[]> {
  const db = await getDB();
  if (!db) return [];
  return await db.getAllFromIndex('offlineReports', 'by-syncStatus', 'PENDING_SYNC');
}

export async function markReportSynced(localId: string): Promise<void> {
  const db = await getDB();
  if (!db) return;

  const report = await db.get('offlineReports', localId);
  if (report) {
    report.syncStatus = 'SYNCED';
    await db.put('offlineReports', report);
  }
  await db.delete('syncQueue', localId);
}

export async function getOfflineReportsForPhone(phone: string): Promise<OfflineReport[]> {
  const db = await getDB();
  if (!db) return [];
  return await db.getAllFromIndex('offlineReports', 'by-phone', phone);
}

export async function getOfflineReportByLocalId(localId: string): Promise<OfflineReport | undefined> {
  const db = await getDB();
  if (!db) return undefined;
  return await db.get('offlineReports', localId);
}
