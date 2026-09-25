'use client';

import React from 'react';
import Link from 'next/link';
import { Layers, PhoneCall, UserCheck, Calendar, TrendingUp, Plus, ArrowRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { mockLeads, mockClients, mockMeetings } from '@/lib/mockData';

export default function CRMOverviewPage() {
  const totalLeadsValue = mockLeads.reduce((acc, l) => acc + l.value, 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              CRM & Client Lifecycle
            </h1>
            <p className="text-xs text-slate-400">
              Track inbound lead pipelines, active client contracts, proposal statuses, and meeting schedules.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/crm/leads">
              <Button size="sm" className="bg-sky-600 hover:bg-sky-500 text-white text-xs gap-1.5 shadow-md shadow-sky-600/20">
                <Plus className="size-4" />
                <span>Add Lead</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase">Pipeline Value</span>
            <div className="text-3xl font-extrabold text-white">${totalLeadsValue.toLocaleString()}</div>
            <div className="text-[11px] text-emerald-400">{mockLeads.length} Active Opportunities</div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase">Active Clients</span>
            <div className="text-3xl font-extrabold text-sky-400">{mockClients.length} Enterprise Clients</div>
            <div className="text-[11px] text-slate-400">100% Retainer Active</div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase">Upcoming Meetings</span>
            <div className="text-3xl font-extrabold text-purple-400">{mockMeetings.length} Scheduled</div>
            <div className="text-[11px] text-slate-400">This Week</div>
          </div>
        </div>

        {/* CRM Submodule Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/crm/leads">
            <div className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-800 hover:border-sky-500/40 transition-all space-y-3">
              <div className="size-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                <PhoneCall className="size-5 text-sky-400" />
              </div>
              <h3 className="text-base font-bold text-white">Leads Pipeline</h3>
              <p className="text-xs text-slate-400">Manage qualified lead pipeline, proposal values, and deal stages.</p>
            </div>
          </Link>

          <Link href="/crm/clients">
            <div className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-800 hover:border-sky-500/40 transition-all space-y-3">
              <div className="size-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <UserCheck className="size-5 text-purple-400" />
              </div>
              <h3 className="text-base font-bold text-white">Clients Directory</h3>
              <p className="text-xs text-slate-400">View active client profiles, total contract values, and active projects.</p>
            </div>
          </Link>

          <Link href="/crm/meetings">
            <div className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-800 hover:border-sky-500/40 transition-all space-y-3">
              <div className="size-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Calendar className="size-5 text-indigo-400" />
              </div>
              <h3 className="text-base font-bold text-white">Meetings & Notes</h3>
              <p className="text-xs text-slate-400">Schedule client calls, record meeting summaries, and AI notes.</p>
            </div>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
