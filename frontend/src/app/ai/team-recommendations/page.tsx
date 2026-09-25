'use client';

import React from 'react';
import { Sparkles, Users, CheckCircle2, ArrowRight, BrainCircuit } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { mockTeamMembers } from '@/lib/mockData';

export default function TeamRecommendationsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="size-6 text-purple-400 animate-pulse" />
              <span>Smart Team Matcher</span>
            </h1>
            <p className="text-xs text-slate-400">Algorithmic recommendation engine for optimal team member assignments based on skills & availability.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mockTeamMembers.map((m) => (
            <div key={m.id} className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-4">
              <div className="flex items-center gap-3">
                <img src={m.avatar} alt="" className="size-12 rounded-xl object-cover ring-2 ring-purple-500/30" />
                <div>
                  <h3 className="text-base font-bold text-white">{m.name}</h3>
                  <span className="text-xs text-sky-400 font-semibold">{m.role}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-purple-300">Match Compatibility Score</span>
                  <span className="font-extrabold text-emerald-400">96% Match</span>
                </div>
                <p className="text-xs text-slate-300">
                  Ideal match for FinTech Nexus backend security sprint due to expertise in Node.js, JWT, and agile delivery.
                </p>
              </div>

              <Button size="sm" className="w-full bg-sky-600 hover:bg-sky-500 text-white text-xs gap-1.5 shadow-md shadow-sky-600/20">
                <span>Assign to Project</span>
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
