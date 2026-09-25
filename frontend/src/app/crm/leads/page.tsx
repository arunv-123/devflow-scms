'use client';

import React from 'react';
import { PhoneCall, Plus, DollarSign, Calendar, User } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { mockLeads } from '@/lib/mockData';
import { LeadStatus } from '@/types';

export default function LeadsPage() {
  const leadStatuses: LeadStatus[] = ['New', 'Contacted', 'Proposal', 'Converted', 'Lost'];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Leads Pipeline</h1>
            <p className="text-xs text-slate-400">Track incoming lead prospects and deal conversion statuses.</p>
          </div>
          <Button size="sm" className="bg-sky-600 hover:bg-sky-500 text-white text-xs gap-1.5 shadow-md shadow-sky-600/20">
            <Plus className="size-4" />
            <span>Create Lead</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
          {leadStatuses.map((status) => {
            const statusLeads = mockLeads.filter((l) => l.status === status);
            return (
              <div key={status} className="p-4 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-bold text-white">
                  <span>{status}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#060913] text-slate-300 border border-slate-800">{statusLeads.length}</span>
                </div>

                <div className="space-y-3">
                  {statusLeads.map((lead) => (
                    <div key={lead.id} className="p-4 rounded-xl bg-[#060913] border border-slate-800 space-y-2">
                      <h4 className="text-xs font-bold text-white">{lead.name}</h4>
                      <p className="text-[11px] text-sky-400 font-semibold">{lead.company}</p>
                      <div className="text-[11px] font-mono text-emerald-400 font-bold">
                        ${lead.value.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                        Owner: {lead.assignedTo}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
