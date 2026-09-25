'use client';

import React from 'react';
import { BrainCircuit, ShieldAlert, Sparkles, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { mockProjects } from '@/lib/mockData';

export default function ProjectIntelligencePage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <BrainCircuit className="size-6 text-purple-400 animate-pulse" />
              <span>AI Project Intelligence</span>
            </h1>
            <p className="text-xs text-slate-400">Automated project health scoring, deadline risk evaluation, and bottleneck mitigation.</p>
          </div>
          <Button size="sm" className="bg-sky-600 hover:bg-sky-500 text-white text-xs gap-1.5 shadow-md shadow-sky-600/20">
            <RefreshCw className="size-4 text-purple-300" />
            <span>Run Real-time Scan</span>
          </Button>
        </div>

        {/* AI Health Summary Card */}
        <div className="p-6 rounded-2xl bg-[#0b0f19] border border-purple-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">Company Project Health Rating</span>
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              88/100 (Optimal)
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            AI analysis examined 4 active projects, 24 subtasks, and team capacity. Overall delivery probability is calculated at 94.2%.
          </p>
        </div>

        {/* Project Health Score Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mockProjects.map((p) => (
            <div key={p.id} className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase">{p.clientName}</span>
                  <h3 className="text-base font-bold text-white">{p.name}</h3>
                </div>
                <div className="text-right">
                  <span className="text-xl font-extrabold text-emerald-400">{p.healthScore}/100</span>
                  <span className="text-[10px] text-slate-400 block">Risk: {p.riskLevel}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#060913] border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-sky-300">AI Diagnostic Insights:</span>
                <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                  <li>Task progress velocity matches target milestone date.</li>
                  <li>No critical architectural blocking issues flagged.</li>
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
