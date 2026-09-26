'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BarChart2, Users, AlertTriangle, CheckCircle2, BrainCircuit, ArrowRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { TeamMember } from '@/types';
import { usersApi } from '@/services/usersApi';

export default function WorkloadPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    usersApi
      .getUsers()
      .then((data) => setTeam(data))
      .catch((err) => console.error('Failed to load workload data', err))
      .finally(() => setLoading(false));
  }, []);

  const overloadedMembers = team.filter((m) => (m.workloadPercent || 0) > 85);
  const optimalMembers = team.filter((m) => (m.workloadPercent || 0) >= 50 && (m.workloadPercent || 0) <= 85);
  const totalUtilization = team.reduce((acc, m) => acc + (m.workloadPercent || 0), 0);
  const avgUtilization = team.length > 0 ? (totalUtilization / team.length).toFixed(1) : '0';

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Workload & Capacity Engine
            </h1>
            <p className="text-xs text-slate-400">
              Analyze team bandwidth, prevent burnout risks, and trigger AI-assisted task re-allocations.
            </p>
          </div>
          <Link href="/ai/team-recommendations">
            <Button size="sm" className="bg-sky-600 hover:bg-sky-500 text-white text-xs gap-1.5 shadow-md shadow-sky-600/20">
              <BrainCircuit className="size-4 text-purple-300" />
              <span>Smart Rebalance</span>
            </Button>
          </Link>
        </div>

        {/* Capacity Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Optimal Capacity</span>
            <div className="text-3xl font-extrabold text-emerald-400">{optimalMembers.length} Members</div>
            <div className="text-[11px] text-slate-400">Operating between 50% - 85%</div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Overloaded Warning</span>
            <div className="text-3xl font-extrabold text-red-400">{overloadedMembers.length} Members</div>
            <div className="text-[11px] text-red-400/80 font-medium">Above 85% bandwidth</div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Average Utilization</span>
            <div className="text-3xl font-extrabold text-sky-400">{avgUtilization}%</div>
            <div className="text-[11px] text-slate-400">Across all engineering roles</div>
          </div>
        </div>

        {/* Member Capacity Breakdown Table */}
        <div className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="size-4 text-sky-400" />
            <span>Resource Utilization Matrix</span>
          </h3>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading workload matrix...</div>
          ) : team.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No team workload data available.</div>
          ) : (
            <div className="space-y-4">
              {team.map((member) => (
                <div key={member.id} className="p-4 rounded-xl bg-[#060913] border border-slate-800 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-3">
                      <img
                        src={member.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                        alt={member.name}
                        className="size-8 rounded-full object-cover"
                      />
                      <div>
                        <span className="font-bold text-white block">{member.name}</span>
                        <span className="text-slate-400">{member.role}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-slate-400">Assigned Projects: {(member.assignedProjects || []).length}</span>
                      <span className={`font-mono font-bold ${(member.workloadPercent || 0) > 85 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {member.workloadPercent || 0}% Allocated
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-[#0b0f19] rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full ${
                        (member.workloadPercent || 0) > 85
                          ? 'bg-gradient-to-r from-amber-500 to-red-500'
                          : 'bg-gradient-to-r from-sky-400 to-emerald-500'
                      }`}
                      style={{ width: `${member.workloadPercent || 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
