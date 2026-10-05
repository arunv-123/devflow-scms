'use client';

import React, { useState, useEffect } from 'react';
import { BarChart2, Download, TrendingUp, DollarSign, CheckCircle2, Users, Activity, ShieldCheck, Loader2, X } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { reportsApi, ReportsData } from '@/services/reportsApi';
import { formatCurrency } from '@/lib/formatters';
import { CountUpNumber, AnimatedProgressBar } from '@/components/common/DataAnimation';
import { getAvatarUrl } from '@/lib/avatar';

export default function ReportsPage() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartMounted, setChartMounted] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    reportsApi
      .getReportsData()
      .then((res) => setData(res))
      .catch((err) => console.error('Failed to load reports data', err))
      .finally(() => setLoading(false));

    const timer = setTimeout(() => {
      setChartMounted(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const handleExport = async () => {
    if (exporting) return;
    try {
      setExporting(true);
      setExportError(null);
      setExportSuccess(false);

      await reportsApi.exportReportPDF(data || undefined);

      setExportSuccess(true);
      setTimeout(() => {
        setExportSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error('Failed to export report:', err);
      setExportError('Failed to generate report PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const metrics = data?.executiveMetrics || {
    totalRevenue: 605000,
    sprintVelocity: '42 Story Pts/Wk',
    taskCompletionRate: '92.4%',
    clientRetentionRate: '100%',
  };

  const velocityData = data?.velocityData || [
    { sprint: 'Sprint 21', planned: 35, completed: 34 },
    { sprint: 'Sprint 22', planned: 40, completed: 38 },
    { sprint: 'Sprint 23', planned: 42, completed: 44 },
    { sprint: 'Sprint 24', planned: 45, completed: 42 },
    { sprint: 'Sprint 25', planned: 40, completed: 41 },
    { sprint: 'Sprint 26', planned: 48, completed: 46 },
  ];

  const resourceMatrix = data?.resourceMatrix || [];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Reports & Analytics</h1>
            <p className="text-xs text-slate-400">Executive metrics, velocity trends, capacity analytics, and revenue summaries.</p>
          </div>
          <Button
            onClick={handleExport}
            disabled={exporting || loading}
            size="sm"
            className="bg-sky-600 hover:bg-sky-500 text-white text-xs gap-1.5 shadow-md shadow-sky-600/20 disabled:opacity-50 transition-all duration-200"
          >
            {exporting ? (
              <>
                <Loader2 className="size-4 animate-spin text-sky-200" />
                <span>Exporting...</span>
              </>
            ) : exportSuccess ? (
              <>
                <CheckCircle2 className="size-4 text-emerald-300" />
                <span>Exported PDF!</span>
              </>
            ) : (
              <>
                <Download className="size-4" />
                <span>Export Report (PDF)</span>
              </>
            )}
          </Button>
        </div>

        {exportError && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300 flex items-center justify-between animate-in fade-in duration-200">
            <span>{exportError}</span>
            <button type="button" onClick={() => setExportError(null)} className="text-red-400 hover:text-white">
              <X className="size-4" />
            </button>
          </div>
        )}

        {/* Executive Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-1 animate-in fade-in zoom-in-95 duration-300">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Revenue</span>
            <div className="text-2xl font-bold text-white">
              <CountUpNumber value={metrics.totalRevenue || 605000} prefix="$" />
            </div>
            <div className="text-[11px] text-emerald-400">+18% YoY Growth</div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-1 animate-in fade-in zoom-in-95 duration-300">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Sprint Velocity</span>
            <div className="text-2xl font-bold text-sky-400">
              <CountUpNumber value={42} suffix=" Story Pts/Wk" />
            </div>
            <div className="text-[11px] text-slate-400">Stable Delivery Pace</div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-1 animate-in fade-in zoom-in-95 duration-300">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Task Completion Rate</span>
            <div className="text-2xl font-bold text-purple-400">
              <CountUpNumber value={92.4} decimals={1} suffix="%" />
            </div>
            <div className="text-[11px] text-emerald-400">On Time Delivery</div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-1 animate-in fade-in zoom-in-95 duration-300">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Client Retention</span>
            <div className="text-2xl font-bold text-emerald-400">
              <CountUpNumber value={100} suffix="%" />
            </div>
            <div className="text-[11px] text-slate-400">0 Churn Rate</div>
          </div>
        </div>

        {/* Visual Analytics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Velocity Chart Component */}
          <div className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-5 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="size-4 text-sky-400" />
                  <span>Sprint Velocity & Story Points</span>
                </h3>
                <p className="text-[11px] text-slate-400">Planned vs Completed story points over recent sprints</p>
              </div>

              <div className="flex items-center gap-3 text-[10px] font-semibold">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="size-2 rounded-full bg-sky-500/30 border border-sky-400" />
                  Planned
                </span>
                <span className="flex items-center gap-1.5 text-sky-400">
                  <span className="size-2 rounded-full bg-sky-400" />
                  Completed
                </span>
              </div>
            </div>

            {/* Custom SVG Responsive Bar Chart */}
            <div className="flex gap-3 items-stretch">
              {/* Y-Axis Labels (Positioned outside plot area with left-side spacing) */}
              <div className="flex flex-col justify-between pt-3 pb-8 text-[10px] font-mono text-slate-400 text-right w-11 shrink-0 select-none">
                <span>50 pts</span>
                <span>35 pts</span>
                <span>20 pts</span>
                <span>0 pts</span>
              </div>

              {/* Main Chart Column */}
              <div className="flex-1 space-y-2 min-w-0">
                <div className="h-44 bg-[#060913] border border-slate-800/80 rounded-xl p-4 flex items-end justify-between gap-3 relative overflow-hidden">
                  {/* Horizontal Y-Gridlines (Clean lines without overlapping label text) */}
                  <div className="absolute inset-x-0 top-4 border-b border-slate-800/40 pointer-events-none" />
                  <div className="absolute inset-x-0 top-16 border-b border-slate-800/40 pointer-events-none" />
                  <div className="absolute inset-x-0 top-28 border-b border-slate-800/40 pointer-events-none" />

                  {velocityData.map((d, idx) => (
                    <div key={idx} className="flex-1 flex items-end justify-center gap-1.5 h-full relative z-10 group">
                      {/* Planned Bar (Smoothly grows from 0 to height on mount) */}
                      <div
                        className="w-1/2 bg-sky-500/10 border border-sky-400/40 rounded-t transition-all duration-700 ease-out group-hover:bg-sky-500/20"
                        style={{ height: chartMounted ? `${(d.planned / 50) * 100}%` : '0%' }}
                        title={`Planned: ${d.planned} pts`}
                      />
                      {/* Completed Bar (Smoothly grows from 0 to height on mount) */}
                      <div
                        className="w-1/2 bg-gradient-to-t from-blue-600 to-sky-400 rounded-t shadow-sm shadow-sky-500/30 transition-all duration-700 ease-out group-hover:brightness-110"
                        style={{ height: chartMounted ? `${(d.completed / 50) * 100}%` : '0%' }}
                        title={`Completed: ${d.completed} pts`}
                      />
                    </div>
                  ))}
                </div>

                {/* X-Axis Labels */}
                <div className="flex justify-between px-2 text-[10px] text-slate-400 font-mono">
                  {velocityData.map((d, idx) => (
                    <span key={idx} className="flex-1 text-center">{d.sprint}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Resource Allocation Breakdown */}
          <div className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-5 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="size-4 text-purple-400" />
                  <span>Resource Utilization Matrix</span>
                </h3>
                <p className="text-[11px] text-slate-400">Team bandwidth and capacity distribution</p>
              </div>

              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                Live Capacity
              </span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading resource matrix...</div>
            ) : resourceMatrix.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">No resource utilization data.</div>
            ) : (
              <div className="space-y-3.5 max-h-56 overflow-y-auto">
                {resourceMatrix.map((member) => {
                  const load = member.workloadPercent || 0;
                  const isOverloaded = load > 85;
                  const isOptimal = load >= 50 && load <= 85;

                  return (
                    <div key={member.id} className="p-3 rounded-xl bg-[#060913] border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={getAvatarUrl(member.avatar, member)}
                            alt={member.name}
                            className="size-6 rounded-full object-cover"
                          />
                          <div>
                            <span className="font-bold text-white">{member.name}</span>
                            <span className="text-[10px] text-slate-400 block">{member.role}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              isOverloaded
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                : isOptimal
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                            }`}
                          >
                            {isOverloaded ? 'Overloaded' : isOptimal ? 'Optimal' : 'Available'}
                          </span>
                          <span className="font-mono text-xs font-bold text-white">
                            <CountUpNumber value={load} suffix="%" />
                          </span>
                        </div>
                      </div>

                      <AnimatedProgressBar
                        percentage={load}
                        className={`h-full rounded-full ${
                          isOverloaded
                            ? 'bg-gradient-to-r from-amber-500 to-red-500'
                            : 'bg-gradient-to-r from-sky-400 to-emerald-400'
                        }`}
                        trackClassName="w-full bg-[#0b0f19] rounded-full h-1.5 overflow-hidden border border-slate-800"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
