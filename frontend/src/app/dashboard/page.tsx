'use client';

import React from 'react';
import Link from 'next/link';
import {
  FolderKanban,
  CheckSquare,
  Users,
  BrainCircuit,
  TrendingUp,
  AlertTriangle,
  Clock,
  ArrowRight,
  Plus,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  BarChart3,
  Activity,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import {
  mockProjects,
  mockTasks,
  mockMilestones,
  mockActivityLogs,
  mockTeamMembers,
} from '@/lib/mockData';

export default function DashboardPage() {
  const activeProjects = mockProjects.filter((p) => p.status === 'In Progress');
  const overdueTasks = mockTasks.filter((t) => new Date(t.dueDate) < new Date('2026-10-01'));
  const overallHealth = Math.round(
    mockProjects.reduce((acc, p) => acc + p.healthScore, 0) / mockProjects.length
  );

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Top Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Company Dashboard
            </h1>
            <p className="text-xs text-slate-400">
              Overview of active projects, AI health scores, team workload, and upcoming milestones.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/ai/project-intelligence">
              <Button
                size="sm"
                variant="outline"
                className="border-sky-500/30 bg-sky-950/20 text-sky-300 hover:bg-sky-900/40 text-xs gap-1.5"
              >
                <BrainCircuit className="size-4 text-sky-400" />
                <span>AI Health Scan</span>
              </Button>
            </Link>
            <Link href="/projects">
              <Button size="sm" className="bg-sky-600 hover:bg-sky-500 text-white text-xs gap-1.5 shadow-md shadow-sky-600/20">
                <Plus className="size-4" />
                <span>New Project</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Stitch Style Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Active Projects */}
          <div className="p-5 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Active Projects</span>
              <FolderKanban className="size-5 text-sky-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white">{activeProjects.length}</span>
              <span className="text-xs text-slate-400">of {mockProjects.length} total</span>
            </div>
            <div className="w-full bg-[#060913] rounded-full h-1.5 overflow-hidden border border-slate-800">
              <div
                className="bg-sky-400 h-full rounded-full"
                style={{ width: `${(activeProjects.length / mockProjects.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Pending Tasks */}
          <div className="p-5 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Pending Tasks</span>
              <CheckSquare className="size-5 text-indigo-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white">
                {mockTasks.filter((t) => t.status !== 'Completed').length}
              </span>
              <span className="text-xs text-amber-400 font-medium">
                {overdueTasks.length} near due date
              </span>
            </div>
            <div className="w-full bg-[#060913] rounded-full h-1.5 overflow-hidden border border-slate-800">
              <div className="bg-indigo-500 h-full rounded-full" style={{ width: '65%' }} />
            </div>
          </div>

          {/* Stitch Radial Health Score Card */}
          <div className="p-5 rounded-2xl bg-[#0b0f19] border border-slate-800 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Project Health</span>
              <div className="text-2xl font-extrabold text-white">{overallHealth} <span className="text-xs text-slate-500 font-normal">/ 100</span></div>
              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                AI-verified optimal
              </span>
            </div>

            {/* Circular Donut Donut Metric Ring */}
            <div className="relative size-16 flex items-center justify-center">
              <svg className="size-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-sky-400"
                  strokeDasharray={`${overallHealth}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <Activity className="absolute size-5 text-sky-400" />
            </div>
          </div>

          {/* Team Capacity */}
          <div className="p-5 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Team Capacity</span>
              <Users className="size-5 text-purple-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white">78%</span>
              <span className="text-xs text-slate-400">{mockTeamMembers.length} Active Members</span>
            </div>
            <div className="w-full bg-[#060913] rounded-full h-1.5 overflow-hidden border border-slate-800">
              <div className="bg-purple-500 h-full rounded-full" style={{ width: '78%' }} />
            </div>
          </div>
        </div>

        {/* Main Grid: Active Projects + AI Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Projects Table */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FolderKanban className="size-4 text-sky-400" />
                <span>Active Projects Overview</span>
              </h2>
              <Link href="/projects" className="text-xs text-sky-400 hover:underline flex items-center gap-1">
                <span>View All Projects</span>
                <ChevronRight className="size-3" />
              </Link>
            </div>

            <div className="space-y-3">
              {mockProjects.map((project) => (
                <div
                  key={project.id}
                  className="p-4 rounded-xl bg-[#060913] border border-slate-800 hover:border-slate-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 max-w-sm">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/projects/${project.id}`}
                        className="text-sm font-bold text-white hover:text-sky-400 transition-colors"
                      >
                        {project.name}
                      </Link>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                        {project.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1">{project.description}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span>Client: {project.clientName}</span>
                      <span>•</span>
                      <span>Budget: ${project.budget.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Health Score */}
                    <div className="text-right">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase block">Health</span>
                      <span className="text-xs font-extrabold text-emerald-400">{project.healthScore}/100</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-24 space-y-1 text-right">
                      <div className="text-xs font-semibold text-white">{project.progress}%</div>
                      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
                        <div
                          className="bg-gradient-to-r from-sky-400 to-blue-600 h-full rounded-full"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>

                    <Link href={`/projects/${project.id}`}>
                      <Button size="xs" variant="ghost" className="text-slate-400 hover:text-white">
                        <ChevronRight className="size-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Project Assistant Side Card */}
          <div className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
                <Sparkles className="size-4 text-sky-400 animate-pulse" />
                <span>AI Project Assistant</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Real-time automated inspection detected high workload on Marcus Vance.
              </p>

              <div className="p-4 rounded-xl bg-sky-950/20 border border-sky-500/30 space-y-2">
                <div className="text-xs font-bold text-sky-200">Recommended Actions:</div>
                <ul className="text-[11px] text-slate-300 space-y-1.5 list-disc list-inside">
                  <li>Reassign Task <span className="text-sky-300 font-mono">tsk-201</span> subtasks to Elena.</li>
                  <li>Schedule milestone review for FinTech Nexus Suite.</li>
                </ul>
              </div>
            </div>

            <Link href="/ai/team-recommendations" className="block pt-2">
              <Button size="sm" className="w-full bg-sky-600 hover:bg-sky-500 text-white text-xs gap-2">
                <span>Run Team Matcher</span>
                <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Bottom Section: Activity & Milestones */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Activity Log */}
          <div className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="size-4 text-sky-400" />
              <span>Recent System Activity</span>
            </h3>

            <div className="space-y-3">
              {mockActivityLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl bg-[#060913] border border-slate-800/60">
                  <img src={log.userAvatar} alt={log.userName} className="size-8 rounded-full object-cover mt-0.5" />
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">{log.userName}</span>
                      <span className="text-[10px] text-slate-500">{log.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-300 font-medium">{log.entity}</p>
                    <p className="text-[11px] text-slate-400">{log.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Milestones */}
          <div className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-400" />
                <span>Upcoming Milestones</span>
              </h3>
              <Link href="/milestones" className="text-xs text-sky-400 hover:underline">
                View Timeline
              </Link>
            </div>

            <div className="space-y-3">
              {mockMilestones.map((ms) => (
                <div key={ms.id} className="p-4 rounded-xl bg-[#060913] border border-slate-800/60 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{ms.title}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Due: {ms.dueDate}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{ms.description}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Owner: {ms.owner.name}</span>
                    <span>{ms.progress}% Complete</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
