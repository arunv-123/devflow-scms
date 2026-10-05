'use client';

import React from 'react';
import { ExternalLink, CheckCircle2, FileText, Calendar, ShieldCheck } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { mockProjects } from '@/lib/mockData';
import { CountUpNumber, AnimatedProgressBar } from '@/components/common/DataAnimation';

export default function ClientPortalPage() {
  const clientProject = mockProjects[0];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">Client Portal</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Apex Capital View
              </span>
            </div>
            <p className="text-xs text-slate-400">Dedicated stakeholder dashboard for progress transparency, deliverables & milestone sign-offs.</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">{clientProject.name}</h3>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
              {clientProject.status}
            </span>
          </div>

          <p className="text-xs text-slate-300">{clientProject.description}</p>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Milestone Progress</span>
              <span className="text-white font-bold">
                <CountUpNumber value={clientProject.progress} suffix="%" />
              </span>
            </div>
            <AnimatedProgressBar
              percentage={clientProject.progress}
              className="bg-gradient-to-r from-sky-400 to-emerald-500 h-full rounded-full"
              trackClassName="w-full bg-[#060913] rounded-full h-2 overflow-hidden border border-slate-800"
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
