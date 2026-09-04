'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getDemoSession } from '@/lib/auth';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { getOfflineReportsForPhone } from '@/lib/db';
import { reportService } from '@/services/report.service';

interface ReportItem {
  id: string;
  referenceId: string;
  incidentType: string;
  description: string;
  userSeverity: string;
  status: string;
  createdAt: string;
  isOffline?: boolean;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [filteredReports, setFilteredReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const isOnline = useOnlineStatus();

  useEffect(() => {
    const session = getDemoSession();
    if (!session) {
      window.location.href = '/login';
      return;
    }
    loadReports(session.phone);
  }, [isOnline]);

  const loadReports = async (phone: string) => {
    setLoading(true);
    try {
      let combined: ReportItem[] = [];

      // Load server reports if online
      if (isOnline) {
        const res = await reportService.getReportsByPhone(phone);
        if (res.success && Array.isArray(res.data)) {
          combined = res.data.map((r: any) => ({
            id: r.id || r._id || r.referenceId,
            referenceId: r.referenceId,
            incidentType: r.incidentType,
            description: r.description,
            userSeverity: r.userSeverity || 'HIGH',
            status: r.status || 'RECEIVED',
            createdAt: r.createdAt,
            isOffline: false,
          }));
        }
      }

      // Also merge any local IndexedDB reports
      const offline = await getOfflineReportsForPhone(phone);
      const offlineMapped: ReportItem[] = offline.map((r) => ({
        id: r.localId,
        referenceId: r.syncStatus === 'SYNCED' ? 'SYNCED' : `LOCAL-${r.localId.substring(6, 12).toUpperCase()}`,
        incidentType: r.incidentType,
        description: r.description,
        userSeverity: r.userSeverity || 'HIGH',
        status: r.syncStatus === 'SYNCED' ? 'RECEIVED' : 'PENDING SYNC',
        createdAt: r.createdAt,
        isOffline: r.syncStatus !== 'SYNCED',
      }));

      // Combine & sort descending by date
      const all = [...offlineMapped, ...combined];
      const unique = Array.from(new Map(all.map((item) => [item.id, item])).values());
      unique.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setReports(unique);
      setFilteredReports(unique);
    } catch (e) {
      console.warn('[Reports Page] Load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (filter: string) => {
    setActiveFilter(filter);
    if (filter === 'ALL') {
      setFilteredReports(reports);
    } else if (filter === 'PENDING_SYNC') {
      setFilteredReports(reports.filter((r) => r.isOffline));
    } else {
      setFilteredReports(reports.filter((r) => r.status === filter));
    }
  };

  const getStatusBadge = (status: string, isOffline?: boolean) => {
    if (isOffline) {
      return <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[11px] px-2.5 py-0.5 rounded-full font-semibold">Pending Sync</span>;
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
      default:
        return <span className="bg-gray-100 text-gray-700 text-[11px] px-2.5 py-0.5 rounded-full font-semibold">{status}</span>;
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return <span className="text-[10px] bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded-md border border-red-200">CRITICAL</span>;
      case 'HIGH':
        return <span className="text-[10px] bg-orange-50 text-orange-700 font-bold px-2 py-0.5 rounded-md border border-orange-200">HIGH</span>;
      case 'MEDIUM':
        return <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-md border border-amber-200">MEDIUM</span>;
      default:
        return <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-md border border-emerald-200">LOW</span>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">My Hazard Reports</h2>
          <p className="text-xs text-gray-500">Track status and official responses to your submissions</p>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-semibold">
        {['ALL', 'RECEIVED', 'UNDER_REVIEW', 'VALIDATED', 'PENDING_SYNC'].map((f) => (
          <button
            key={f}
            onClick={() => handleFilter(f)}
            className={`px-3 py-1.5 rounded-xl border whitespace-nowrap transition-all ${
              activeFilter === f
                ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                : 'bg-white text-gray-600 border-[#E5EDE8] hover:bg-gray-50'
            }`}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-[#E5EDE8] rounded-2xl p-4 space-y-2">
              <div className="h-4 skeleton-loading rounded w-1/3" />
              <div className="h-3 skeleton-loading rounded w-3/4" />
              <div className="h-3 skeleton-loading rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="bg-white border border-[#E5EDE8] rounded-2xl p-8 text-center text-gray-500 space-y-2 shadow-xs my-4">
          <span className="text-4xl block">📁</span>
          <h3 className="text-base font-bold text-gray-800">No reports found</h3>
          <p className="text-xs text-gray-400 max-w-xs mx-auto">
            You don't have any reports matching this filter tag.
          </p>
          <Link
            href="/report"
            className="inline-block mt-3 bg-emerald-800 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs"
          >
            + Create New Report
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((report) => (
            <Link
              key={report.id}
              href={`/reports/${report.id}`}
              className="block bg-white border border-[#E5EDE8] hover:border-emerald-600/40 rounded-2xl p-4 transition-all shadow-xs space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900">
                    {report.incidentType.replace('_', ' ')}
                  </span>
                  {getSeverityBadge(report.userSeverity)}
                </div>
                {getStatusBadge(report.status, report.isOffline)}
              </div>

              <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                {report.description}
              </p>

              <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono pt-2 border-t border-gray-100">
                <span>REF: {report.referenceId}</span>
                <span>{new Date(report.createdAt).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
