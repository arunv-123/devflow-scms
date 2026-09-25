'use client';

import React from 'react';
import Link from 'next/link';
import { Flag, Plus, Calendar, CheckCircle2, Clock, Users, ArrowRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { mockMilestones } from '@/lib/mockData';

export default function MilestonesPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Milestone Roadmap
            </h1>
            <p className="text-xs text-slate-400">
              Track project delivery targets, sprint completion dates, and key deliverable phase goals.
            </p>
          </div>
          <Button size="sm" className="bg-sky-600 hover:bg-sky-500 text-white text-xs gap-1.5 shadow-md shadow-sky-600/20">
            <Plus className="size-4" />
            <span>Create Milestone</span>
          </Button>
        </div>

        {/* Milestone Timeline List */}
        <div className="space-y-4">
          {mockMilestones.map((ms) => (
            <div
              key={ms.id}
              className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-800 hover:border-slate-700 transition-colors space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
                      {ms.projectName}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        ms.status === 'Achieved'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : ms.status === 'In Progress'
                          ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {ms.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white">{ms.title}</h3>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="text-right">
                    <span className="text-slate-500 text-[10px] block uppercase">Target Date</span>
                    <span className="font-mono text-white font-bold">{ms.dueDate}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 text-[10px] block uppercase">Linked Tasks</span>
                    <span className="font-mono text-sky-400 font-bold">{ms.relatedTasksCount} Tasks</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{ms.description}</p>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Phase Completion</span>
                  <span className="text-white font-bold">{ms.progress}%</span>
                </div>
                <div className="w-full bg-[#060913] rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-sky-400 to-blue-600 h-full rounded-full"
                    style={{ width: `${ms.progress}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 text-xs text-slate-400 border-t border-slate-800/60">
                <div className="flex items-center gap-2">
                  <img src={ms.owner.avatar} alt={ms.owner.name} className="size-6 rounded-full object-cover" />
                  <span>Owner: {ms.owner.name} ({ms.owner.role})</span>
                </div>

                <Link href={`/projects/${ms.projectId}`}>
                  <Button size="xs" variant="ghost" className="text-sky-400 hover:text-white gap-1">
                    <span>View Project</span>
                    <ArrowRight className="size-3" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
