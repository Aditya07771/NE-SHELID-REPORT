import mongoose, { Schema, Document } from 'mongoose';

export type IncidentType = 'LANDSLIDE' | 'VISIBLE_CRACK' | 'ROAD_BLOCKAGE' | 'ROCKFALL' | 'FLOODING' | 'OTHER_HAZARD';
export type UserSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ReportStatus = 'RECEIVED' | 'UNDER_REVIEW' | 'VALIDATED' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';

export interface ICrowdReportImage {
  fileId: string;
  url: string;
  thumbnailUrl?: string;
  fileName?: string;
}

export interface ICrowdReportLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  capturedAt?: Date;
}

export interface ICrowdReport extends Document {
  referenceId: string;
  localId?: string;
  reporterPhone: string;
  incidentType: IncidentType;
  description: string;
  userSeverity: UserSeverity;
  roadBlocked: boolean;
  peopleNearby: boolean;
  buildingsNearby: boolean;
  location: ICrowdReportLocation;
  images: ICrowdReportImage[];
  status: ReportStatus;
  source: string;
  createdAt: Date;
  updatedAt: Date;
}

const CrowdReportSchema: Schema = new Schema(
  {
    referenceId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    localId: {
      type: String,
      index: true,
    },
    reporterPhone: {
      type: String,
      required: true,
      index: true,
    },
    incidentType: {
      type: String,
      required: true,
      enum: ['LANDSLIDE', 'VISIBLE_CRACK', 'ROAD_BLOCKAGE', 'ROCKFALL', 'FLOODING', 'OTHER_HAZARD'],
      default: 'LANDSLIDE',
    },
    description: {
      type: String,
      required: true,
    },
    userSeverity: {
      type: String,
      required: true,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'HIGH',
    },
    roadBlocked: {
      type: Boolean,
      default: false,
    },
    peopleNearby: {
      type: Boolean,
      default: false,
    },
    buildingsNearby: {
      type: Boolean,
      default: false,
    },
    location: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      accuracy: { type: Number, default: 0 },
      capturedAt: { type: Date, default: Date.now },
    },
    images: [
      {
        fileId: { type: String, required: true },
        url: { type: String, required: true },
        thumbnailUrl: { type: String },
        fileName: { type: String },
      },
    ],
    status: {
      type: String,
      required: true,
      enum: ['RECEIVED', 'UNDER_REVIEW', 'VALIDATED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'],
      default: 'RECEIVED',
    },
    source: {
      type: String,
      default: 'PWA',
    },
  },
  {
    timestamps: true,
  }
);

// Helper function to generate unique reference ID
export function generateReferenceId(): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `CR-${year}-${randomNum}`;
}

export default mongoose.models.CrowdReport ||
  mongoose.model<ICrowdReport>('CrowdReport', CrowdReportSchema);
