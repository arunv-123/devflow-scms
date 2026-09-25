'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Users, Search, Plus, Star, Briefcase, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { mockTeamMembers } from '@/lib/mockData';

export default function TeamPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  const filteredTeam = mockTeamMembers.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.skills.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter === 'All' || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Team Directory
            </h1>
            <p className="text-xs text-slate-400">
              Manage team roles, skills matrix, current workload percentages, and performance metrics.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/workload">
              <Button size="sm" variant="outline" className="border-sky-500/30 text-sky-300 text-xs">
                Workload Matrix
              </Button>
            </Link>
            <Button size="sm" className="bg-sky-600 hover:bg-sky-500 text-white text-xs gap-1.5 shadow-md shadow-sky-600/20">
              <Plus className="size-4" />
              <span>Add Member</span>
            </Button>
          </div>
        </div>

        {/* Search & Role Filter */}
        <div className="p-4 rounded-xl bg-[#0b0f19] border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or skill..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-9 pr-4 text-xs bg-[#060913] border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-9 px-3 text-xs bg-[#060913] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option value="All">All Roles</option>
            <option value="Project Manager">Project Manager</option>
            <option value="Team Lead">Team Lead</option>
            <option value="Developer">Developer</option>
            <option value="Designer">Designer</option>
            <option value="QA">QA</option>
          </select>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeam.map((member) => (
            <div
              key={member.id}
              className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-800 hover:border-slate-700 transition-colors space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="size-12 rounded-xl object-cover ring-2 ring-sky-500/30"
                    />
                    <div>
                      <h3 className="text-base font-bold text-white">{member.name}</h3>
                      <span className="text-xs font-semibold text-sky-400">{member.role}</span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      member.availability === 'Available'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {member.availability}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-xs text-amber-400">
                  <Star className="size-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-bold">{member.performanceRating} / 5.0 Rating</span>
                </div>

                {/* Skills Matrix */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">Skills Matrix</span>
                  <div className="flex flex-wrap gap-1">
                    {member.skills.map((skill, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded text-[10px] bg-[#060913] text-slate-300 border border-slate-800 font-mono">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Workload Progress Bar */}
              <div className="pt-4 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Current Workload</span>
                  <span className={`font-bold ${member.workloadPercent > 85 ? 'text-red-400' : 'text-sky-400'}`}>
                    {member.workloadPercent}%
                  </span>
                </div>
                <div className="w-full bg-[#060913] rounded-full h-1.5 overflow-hidden border border-slate-800">
                  <div
                    className={`h-full rounded-full ${
                      member.workloadPercent > 85 ? 'bg-red-500' : 'bg-sky-400'
                    }`}
                    style={{ width: `${member.workloadPercent}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
