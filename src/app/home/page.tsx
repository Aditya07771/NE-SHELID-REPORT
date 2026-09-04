'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getDemoSession, DemoSession } from '@/lib/auth';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { getOfflineReportsForPhone, getPendingOfflineReports } from '@/lib/db';
import { reportService } from '@/services/report.service';

interface ReportItem {
  id: string;
  referenceId: string;
  incidentType: string;
  description: string;
  status: string;
  createdAt: string;
  isOffline?: boolean;
}

export default function HomePage() {
  const [session, setSession] = useState<DemoSession | null>(null);
  const [recentReports, setRecentReports] = useState<ReportItem[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const isOnline = useOnlineStatus();

  useEffect(() => {
    const s = getDemoSession();
    if (!s) {
      window.location.href = '/login';
      return;
    }
    setSession(s);
    fetchRecentReports(s.phone);
    checkPendingReports();
  }, []);

  const checkPendingReports = async () => {
    try {
      const pending = await getPendingOfflineReports();
      setPendingCount(pending.length);
    } catch (e) {
      console.warn('[Home] Pending check error:', e);
    }
  };

  const fetchRecentReports = async (phone: string) => {
    setLoading(true);
    try {
      if (navigator.onLine) {
        const res = await reportService.getReportsByPhone(phone);
        if (res.success && Array.isArray(res.data)) {
          setRecentReports(
            res.data.slice(0, 3).map((r: any) => ({
              id: r.id || r._id || r.referenceId,
              referenceId: r.referenceId,
              incidentType: r.incidentType,
              description: r.description,
              status: r.status,
              createdAt: r.createdAt,
              isOffline: false,
            }))
          );
        }
      } else {
        const offline = await getOfflineReportsForPhone(phone);
        setRecentReports(
          offline.slice(0, 3).map((r) => ({
            id: r.localId,
            referenceId: r.syncStatus === 'SYNCED' ? 'SYNCED' : `LOCAL-${r.localId.substring(6, 12).toUpperCase()}`,
            incidentType: r.incidentType,
            description: r.description,
            status: r.syncStatus === 'SYNCED' ? 'RECEIVED' : 'PENDING SYNC',
            createdAt: r.createdAt,
            isOffline: r.syncStatus !== 'SYNCED',
          }))
        );
      }
    } catch (e) {
      console.warn('[Home] Fetch recent reports error:', e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, isOffline?: boolean) => {
    if (isOffline) {
      return (
        <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[11px] px-2.5 py-0.5 rounded-full font-semibold">
          Pending Sync
        </span>
      );
    }
    switch (status) {
      case 'RECEIVED':
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[11px] px-2.5 py-0.5 rounded-full font-semibold">Received</span>;
      case 'UNDER_REVIEW':
        return <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[11px] px-2.5 py-0.5 rounded-full font-semibold">Under Review</span>;
      case 'VALIDATED':
        return <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] px-2.5 py-0.5 rounded-full font-semibold">Validated</span>;
      case 'IN_PROGRESS':
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[11px] px-2.5 py-0.5 rounded-full font-semibold">In Progress</span>;
      case 'RESOLVED':
        return <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] px-2.5 py-0.5 rounded-full font-semibold">Resolved</span>;
      case 'REJECTED':
        return <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[11px] px-2.5 py-0.5 rounded-full font-semibold">Rejected</span>;
      default:
        return <span className="bg-gray-100 text-gray-700 text-[11px] px-2 py-0.5 rounded-full font-semibold">{status}</span>;
    }
  };

  const quickHazards = [
    { type: 'LANDSLIDE', label: 'Landslide', icon: '🌄' },
    { type: 'ROAD_BLOCKAGE', label: 'Road Block', icon: '🚧' },
    { type: 'VISIBLE_CRACK', label: 'Visible Crack', icon: '⚡' },
    { type: 'FLOODING', label: 'Flooding', icon: '🌊' },
    { type: 'ROCKFALL', label: 'Rockfall', icon: '🪨' },
    { type: 'OTHER_HAZARD', label: 'Other Hazard', icon: '⚠️' },
  ];

  return (
    <div className="space-y-5">
      {/* 1. Welcome Card */}
      <div className="bg-white border border-[#E5EDE8] rounded-2xl p-4 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Welcome Field Reporter</p>
          <h2 className="text-base font-bold text-gray-900 font-mono mt-0.5">{session?.phone || '+91 Demo User'}</h2>
        </div>
        <div className="bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl px-3 py-1.5 text-right">
          <span className="text-[10px] text-gray-400 block uppercase font-bold tracking-wider">System Status</span>
          <span className={`text-xs font-bold ${isOnline ? 'text-emerald-800' : 'text-amber-700'}`}>
            {isOnline ? '● Ready (Online)' : '● Offline Mode'}
          </span>
        </div>
      </div>

      {/* 2. Compact Device / GPS Status */}
      <div className="bg-[#F0FDF4] border border-[#E5EDE8] rounded-2xl p-3.5 flex items-center justify-between text-xs text-emerald-900">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-gray-800">GPS Position Active</span>
        </div>
        <div className="text-gray-500 font-mono text-[11px]">
          {pendingCount > 0 ? (
            <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              {pendingCount} Pending Sync
            </span>
          ) : (
            <span className="text-emerald-700 font-medium">IndexedDB Synced</span>
          )}
        </div>
      </div>

      {/* 3. PRIMARY EMERGENCY REPORT CARD */}
      <Link href="/report" className="block group">
        <div className="bg-white border-2 border-red-600/30 group-hover:border-red-600 rounded-2xl p-5 shadow-xs transition-all duration-200 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5 max-w-[80%]">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-[11px] font-bold text-red-700 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                Emergency Action
              </div>
              <h3 className="text-lg font-bold text-gray-900 leading-tight">
                Report a Hazard / Incident
              </h3>
              <p className="text-xs text-gray-500">
                Report landslide, road blockage, visible cracks, flooding, or other field emergencies.
              </p>
            </div>
            <div className="bg-red-600 text-white rounded-2xl p-3 shadow-md shadow-red-600/20 group-hover:scale-105 transition-transform shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-red-700 group-hover:text-red-800">
            <span>Start Field Report</span>
            <span>→</span>
          </div>
        </div>
      </Link>

      {/* 4. QUICK REPORT TYPES */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Quick Report Category</h3>
        <div className="grid grid-cols-3 gap-2">
          {quickHazards.map((item) => (
            <Link
              key={item.type}
              href={`/report?type=${item.type}`}
              className="bg-white border border-[#E5EDE8] hover:border-emerald-700/50 hover:bg-[#F0FDF4] rounded-2xl p-3 text-center transition-all group flex flex-col items-center justify-center space-y-1 shadow-xs"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">{item.icon}</span>
              <span className="text-xs font-semibold text-gray-800 group-hover:text-emerald-900 leading-tight">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* 5. RECENT REPORTS */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Your Recent Reports</h3>
          <Link href="/reports" className="text-xs text-emerald-800 hover:text-emerald-700 font-bold">
            View All ({recentReports.length}) →
          </Link>
        </div>

        {loading ? (
          <div className="space-y-2.5">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white border border-[#E5EDE8] rounded-2xl p-4 space-y-2">
                <div className="h-4 skeleton-loading rounded w-1/3" />
                <div className="h-3 skeleton-loading rounded w-3/4" />
                <div className="h-3 skeleton-loading rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : recentReports.length === 0 ? (
          <div className="bg-white border border-[#E5EDE8] rounded-2xl p-6 text-center text-gray-500 space-y-2 shadow-xs">
            <span className="text-3xl block">📋</span>
            <p className="text-sm font-semibold text-gray-800">No reports submitted yet</p>
            <p className="text-xs text-gray-400">Tap the button above to submit your first report.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentReports.map((report) => (
              <Link
                key={report.id}
                href={`/reports/${report.id}`}
                className="block bg-white border border-[#E5EDE8] hover:border-emerald-600/40 rounded-2xl p-4 transition-all shadow-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 font-mono">
                    {report.incidentType.replace('_', ' ')}
                  </span>
                  {getStatusBadge(report.status, report.isOffline)}
                </div>
                <p className="text-xs text-gray-700 line-clamp-2 leading-relaxed">{report.description}</p>
                <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono pt-1 border-t border-gray-100">
                  <span>Ref: {report.referenceId}</span>
                  <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
