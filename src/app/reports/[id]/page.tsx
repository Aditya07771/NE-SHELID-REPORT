'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { reportService } from '@/services/report.service';
import { getOfflineReportByLocalId } from '@/lib/db';

interface ReportDetail {
  id: string;
  referenceId: string;
  incidentType: string;
  description: string;
  userSeverity: string;
  status: string;
  createdAt: string;
  reporterPhone?: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  images?: Array<{ url: string; base64?: string }>;
  isOffline?: boolean;
  statusHistory?: Array<{ status: string; timestamp: string; note?: string }>;
}

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!id) return;
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    setLoading(true);
    setError('');

    try {
      if (id.startsWith('local_')) {
        const offlineReport = await getOfflineReportByLocalId(id);
        if (offlineReport) {
          setReport({
            id: offlineReport.localId,
            referenceId: `LOCAL-${offlineReport.localId.substring(6, 12).toUpperCase()}`,
            incidentType: offlineReport.incidentType,
            description: offlineReport.description,
            userSeverity: offlineReport.userSeverity || 'HIGH',
            status: offlineReport.syncStatus === 'SYNCED' ? 'RECEIVED' : 'PENDING SYNC',
            createdAt: offlineReport.createdAt,
            reporterPhone: offlineReport.reporterPhone,
            location: offlineReport.location,
            images: offlineReport.images?.map((img) => ({ url: img.base64 || img.url || '' })),
            isOffline: true,
          });
        } else {
          setError('Offline report not found');
        }
      } else {
        const res = await reportService.getReportById(id);
        if (res.success && res.data) {
          setReport({
            id: res.data.id || res.data._id,
            referenceId: res.data.referenceId,
            incidentType: res.data.incidentType,
            description: res.data.description,
            userSeverity: res.data.userSeverity || 'HIGH',
            status: res.data.status || 'RECEIVED',
            createdAt: res.data.createdAt,
            reporterPhone: res.data.reporterPhone,
            location: res.data.location,
            images: res.data.images || [],
            isOffline: false,
            statusHistory: res.data.statusHistory || [],
          });
        } else {
          setError('Report detail could not be retrieved from server.');
        }
      }
    } catch (e: any) {
      console.error('[Report Detail] Error:', e);
      setError('Failed to load report detail.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, isOffline?: boolean) => {
    if (isOffline) {
      return <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs px-3 py-1 rounded-full font-bold">Pending Sync</span>;
    }
    switch (status) {
      case 'RECEIVED':
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs px-3 py-1 rounded-full font-bold">Received</span>;
      case 'UNDER_REVIEW':
        return <span className="bg-purple-50 text-purple-700 border border-purple-200 text-xs px-3 py-1 rounded-full font-bold">Under Review</span>;
      case 'VALIDATED':
        return <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs px-3 py-1 rounded-full font-bold">Validated</span>;
      case 'IN_PROGRESS':
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs px-3 py-1 rounded-full font-bold">In Progress</span>;
      case 'RESOLVED':
        return <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs px-3 py-1 rounded-full font-bold">Resolved</span>;
      default:
        return <span className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full font-bold">{status}</span>;
    }
  };

  // Timeline steps: Received -> Under Review -> Validated -> In Progress -> Resolved
  const timelineSteps = [
    { key: 'RECEIVED', label: 'Report Received', desc: 'Dispatched to NE-SHIELD GIS API' },
    { key: 'UNDER_REVIEW', label: 'Under Review', desc: 'SDRF / District Authority reviewing incident' },
    { key: 'VALIDATED', label: 'Field Validated', desc: 'Verified by local ground teams' },
    { key: 'IN_PROGRESS', label: 'Action In Progress', desc: 'Response machinery deployed' },
    { key: 'RESOLVED', label: 'Hazard Resolved', desc: 'Site cleared & safe' },
  ];

  const getStepState = (stepKey: string, currentStatus: string) => {
    const order = ['RECEIVED', 'UNDER_REVIEW', 'VALIDATED', 'IN_PROGRESS', 'RESOLVED'];
    const currentIndex = order.indexOf(currentStatus);
    const stepIndex = order.indexOf(stepKey);

    if (currentIndex === -1) return 'pending';
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  if (loading) {
    return (
      <div className="space-y-4 py-4">
        <div className="h-6 skeleton-loading rounded w-1/4" />
        <div className="bg-white border border-[#E5EDE8] rounded-2xl p-6 space-y-4">
          <div className="h-5 skeleton-loading rounded w-1/2" />
          <div className="h-4 skeleton-loading rounded w-full" />
          <div className="h-20 skeleton-loading rounded w-full" />
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="bg-white border border-[#E5EDE8] rounded-3xl p-6 text-center space-y-4 shadow-xs my-6">
        <span className="text-4xl block">⚠️</span>
        <h2 className="text-base font-bold text-gray-900">{error || 'Report not found'}</h2>
        <Link
          href="/reports"
          className="inline-block bg-emerald-800 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs"
        >
          ← Back to Reports
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-6">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <Link href="/reports" className="text-xs font-bold text-emerald-800 hover:text-emerald-700 flex items-center gap-1">
          ← Back to Reports
        </Link>
        <span className="font-mono text-xs font-bold text-gray-500 bg-white border border-[#E5EDE8] px-3 py-1 rounded-full shadow-xs">
          REF: {report.referenceId}
        </span>
      </div>

      {/* Hero Summary Card */}
      <div className="bg-white border border-[#E5EDE8] rounded-3xl p-5 shadow-xs space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">INCIDENT TYPE</span>
            <h1 className="text-xl font-bold text-gray-900 mt-0.5">{report.incidentType.replace('_', ' ')}</h1>
          </div>
          {getStatusBadge(report.status, report.isOffline)}
        </div>

        <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs font-mono text-gray-500">
          <span>SUBMITTED: {new Date(report.createdAt).toLocaleString()}</span>
          <span className="font-bold text-gray-800">SEVERITY: {report.userSeverity}</span>
        </div>
      </div>

      {/* Vertical Status Timeline */}
      <div className="bg-white border border-[#E5EDE8] rounded-3xl p-5 shadow-xs space-y-3">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">RESPONSE TIMELINE</h2>
        <div className="space-y-4 pt-1">
          {timelineSteps.map((step, idx) => {
            const state = getStepState(step.key, report.status);
            return (
              <div key={step.key} className="flex items-start gap-3.5 relative">
                {idx < timelineSteps.length - 1 && (
                  <div
                    className={`absolute left-3.5 top-7 bottom-0 w-0.5 -ml-px ${
                      state === 'completed' ? 'bg-emerald-600' : 'bg-gray-200'
                    }`}
                  />
                )}
                <div className="relative z-10">
                  {state === 'completed' ? (
                    <div className="w-7 h-7 rounded-full bg-emerald-800 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                      ✓
                    </div>
                  ) : state === 'current' ? (
                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 border-2 border-emerald-600 flex items-center justify-center text-xs font-bold animate-pulse">
                      ●
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gray-100 border border-gray-300 text-gray-400 flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </div>
                  )}
                </div>
                <div className="space-y-0.5 pt-0.5">
                  <h3 className={`text-xs font-bold ${state === 'pending' ? 'text-gray-400' : 'text-gray-900'}`}>
                    {step.label}
                  </h3>
                  <p className="text-[11px] text-gray-500">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Description & Details */}
      <div className="bg-white border border-[#E5EDE8] rounded-3xl p-5 shadow-xs space-y-3 text-xs">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">FIELD OBSERVATION DETAILS</h2>
        <p className="text-gray-800 leading-relaxed bg-[#F7FAF8] p-3.5 rounded-2xl border border-[#E5EDE8]">
          {report.description}
        </p>

        {report.location && (
          <div className="pt-2 space-y-1.5 font-mono text-gray-600 border-t border-gray-100 text-[11px]">
            <div className="flex justify-between">
              <span>LATITUDE:</span>
              <span className="text-gray-900 font-bold">{report.location.latitude}° N</span>
            </div>
            <div className="flex justify-between">
              <span>LONGITUDE:</span>
              <span className="text-gray-900 font-bold">{report.location.longitude}° E</span>
            </div>
          </div>
        )}
      </div>

      {/* Attached Photo Evidence */}
      {report.images && report.images.length > 0 && (
        <div className="bg-white border border-[#E5EDE8] rounded-3xl p-5 shadow-xs space-y-3">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            PHOTO EVIDENCE ({report.images.length})
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {report.images.map((img, i) => (
              <div key={i} className="rounded-2xl overflow-hidden aspect-video border border-gray-200 bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url || img.base64} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
