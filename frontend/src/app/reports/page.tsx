'use client';

import React from 'react';
import { BarChart2, Download, TrendingUp, DollarSign, CheckCircle2, Users, Activity, ShieldCheck } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { mockTeamMembers } from '@/lib/mockData';

export default function ReportsPage() {
  const velocityData = [
    { sprint: 'Sprint 21', planned: 35, completed: 34 },
    { sprint: 'Sprint 22', planned: 40, completed: 38 },
    { sprint: 'Sprint 23', planned: 42, completed: 44 },
    { sprint: 'Sprint 24', planned: 45, completed: 42 },
    { sprint: 'Sprint 25', planned: 40, completed: 41 },
    { sprint: 'Sprint 26', planned: 48, completed: 46 },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Reports & Analytics</h1>
            <p className="text-xs text-slate-400">Executive metrics, velocity trends, capacity analytics, and revenue summaries.</p>
          </div>
          <Button size="sm" className="bg-sky-600 hover:bg-sky-500 text-white text-xs gap-1.5 shadow-md shadow-sky-600/20">
            <Download className="size-4" />
            <span>Export Report (PDF)</span>
          </Button>
        </div>

        {/* Executive Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Q3 Total Revenue</span>
            <div className="text-2xl font-bold text-white">$605,000</div>
            <div className="text-[11px] text-emerald-400">+18% YoY Growth</div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Sprint Velocity</span>
            <div className="text-2xl font-bold text-sky-400">42 Story Pts/Wk</div>
            <div className="text-[11px] text-slate-400">Stable Delivery Pace</div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Task Completion</span>
            <div className="text-2xl font-bold text-purple-400">92.4%</div>
            <div className="text-[11px] text-emerald-400">On Time Delivery</div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Client Retention</span>
            <div className="text-2xl font-bold text-emerald-400">100%</div>
            <div className="text-[11px] text-slate-400">0 Churn Rate</div>
          </div>
        </div>

        {/* Visual Analytics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Velocity Chart Component */}
          <div className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="size-4 text-sky-400" />
                  <span>Sprint Velocity & Story Points</span>
                </h3>
                <p className="text-[11px] text-slate-400">Planned vs Completed story points over the last 6 sprints</p>
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
            <div className="space-y-2">
              <div className="h-44 bg-[#060913] border border-slate-800/80 rounded-xl p-4 flex items-end justify-between gap-3 relative">
                {/* Horizontal Y-Gridlines */}
                <div className="absolute inset-x-4 top-4 border-b border-slate-800/40 text-[9px] text-slate-600">50 pts</div>
                <div className="absolute inset-x-4 top-16 border-b border-slate-800/40 text-[9px] text-slate-600">35 pts</div>
                <div className="absolute inset-x-4 top-28 border-b border-slate-800/40 text-[9px] text-slate-600">20 pts</div>

                {velocityData.map((d, idx) => (
                  <div key={idx} className="flex-1 flex items-end justify-center gap-1.5 h-full relative z-10 group">
                    {/* Planned Bar */}
                    <div
                      className="w-1/2 bg-sky-500/10 border border-sky-400/40 rounded-t transition-all group-hover:bg-sky-500/20"
                      style={{ height: `${(d.planned / 50) * 100}%` }}
                      title={`Planned: ${d.planned} pts`}
                    />
                    {/* Completed Bar */}
                    <div
                      className="w-1/2 bg-gradient-to-t from-blue-600 to-sky-400 rounded-t shadow-sm shadow-sky-500/30 transition-all group-hover:brightness-110"
                      style={{ height: `${(d.completed / 50) * 100}%` }}
                      title={`Completed: ${d.completed} pts`}
                    />
                  </div>
                ))}
              </div>

              {/* X-Axis Labels */}
              <div className="flex justify-between px-4 text-[10px] text-slate-400 font-mono">
                {velocityData.map((d, idx) => (
                  <span key={idx} className="flex-1 text-center">{d.sprint}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Resource Allocation Breakdown */}
          <div className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="size-4 text-purple-400" />
                  <span>Resource Utilization Matrix</span>
                </h3>
                <p className="text-[11px] text-slate-400">Team bandwidth, capacity distribution, and burnout alerts</p>
              </div>

              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                78% Avg Load
              </span>
            </div>

            <div className="space-y-3.5">
              {mockTeamMembers.map((member) => {
                const isOverloaded = member.workloadPercent > 85;
                const isOptimal = member.workloadPercent >= 50 && member.workloadPercent <= 85;

                return (
                  <div key={member.id} className="p-3 rounded-xl bg-[#060913] border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <img src={member.avatar} alt={member.name} className="size-6 rounded-full object-cover" />
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
                        <span className="font-mono text-xs font-bold text-white">{member.workloadPercent}%</span>
                      </div>
                    </div>

                    <div className="w-full bg-[#0b0f19] rounded-full h-1.5 overflow-hidden border border-slate-800">
                      <div
                        className={`h-full rounded-full ${
                          isOverloaded
                            ? 'bg-gradient-to-r from-amber-500 to-red-500'
                            : 'bg-gradient-to-r from-sky-400 to-emerald-400'
                        }`}
                        style={{ width: `${member.workloadPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
