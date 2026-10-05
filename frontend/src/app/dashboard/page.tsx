'use client';

import React, { useState, useEffect } from 'react';
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
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { dashboardApi, DashboardData } from '@/services/dashboardApi';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/formatters';
import { CountUpNumber, AnimatedProgressBar, AnimatedDonutScore } from '@/components/common/DataAnimation';
import { getAvatarUrl } from '@/lib/avatar';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi
      .getDashboardData()
      .then((res) => setData(res))
      .catch((err) => console.error('Failed to load dashboard data', err))
      .finally(() => setLoading(false));
  }, []);

  const role = user?.role || '';
  const dashboardTitle = ['Super Admin', 'Admin', 'Project Manager'].includes(role)
    ? 'Company Dashboard'
    : ['Team Lead', 'Project Coordinator'].includes(role)
    ? 'Team Dashboard'
    : 'My Workspace Dashboard';

  const metrics = data?.metrics || {
    totalProjects: 4,
    activeProjectsCount: 2,
    completedProjectsCount: 1,
    totalTasks: 12,
    pendingTasksCount: 7,
    completedTasksCount: 5,
    overdueTasksCount: 2,
    totalClientsCount: 4,
    totalTeamMembersCount: 4,
    overallHealth: 87,
    avgCapacity: 75,
  };

  const activeProjects = data?.activeProjects || [];
  const upcomingMilestones = data?.upcomingMilestones || [];
  const recentActivity = data?.recentActivity || [];

  return (
    <AppLayout>
      <div className="space-y-8 devflow-page-enter">
        {/* Top Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {dashboardTitle}
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
          {/* Active Projects KPI Card */}
          <div className="p-5 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-3 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Active Projects</span>
              <FolderKanban className="size-5 text-sky-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <CountUpNumber value={metrics.activeProjectsCount} className="text-3xl font-extrabold text-white" />
              <span className="text-xs text-slate-400">of {metrics.totalProjects} total</span>
            </div>
            <AnimatedProgressBar
              percentage={metrics.totalProjects > 0 ? (metrics.activeProjectsCount / metrics.totalProjects) * 100 : 50}
              className="bg-sky-400 h-full rounded-full"
              trackClassName="w-full bg-[#060913] rounded-full h-1.5 overflow-hidden border border-slate-800"
            />
          </div>

          {/* Pending Tasks KPI Card */}
          <div className="p-5 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-3 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Pending Tasks</span>
              <CheckSquare className="size-5 text-indigo-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <CountUpNumber value={metrics.pendingTasksCount} className="text-3xl font-extrabold text-white" />
              <span className="text-xs text-amber-400 font-medium">
                <CountUpNumber value={metrics.overdueTasksCount} /> overdue
              </span>
            </div>
            <AnimatedProgressBar
              percentage={65}
              className="bg-indigo-500 h-full rounded-full"
              trackClassName="w-full bg-[#060913] rounded-full h-1.5 overflow-hidden border border-slate-800"
            />
          </div>

          {/* Stitch Radial Health Score Card */}
          <div className="p-5 rounded-2xl bg-[#0b0f19] border border-slate-800 flex items-center justify-between gap-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Project Health
              </span>
              <div className="flex items-baseline gap-1.5">
                <CountUpNumber value={metrics.overallHealth} className="text-3xl font-extrabold text-white tracking-tight" />
                <span className="text-xs font-semibold text-slate-500">/ 100</span>
              </div>
              <div className="pt-0.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-sm">
                  <Sparkles className="size-3 text-sky-400 shrink-0" />
                  <span>AI-verified optimal</span>
                </span>
              </div>
            </div>

            {/* Circular Donut Metric Ring with Centered Icon */}
            <AnimatedDonutScore
              score={metrics.overallHealth}
              size={60}
              strokeWidth={7}
              colorClass="text-sky-400"
              showCenterText={false}
              centerIcon={<Activity className="size-5 text-sky-400" />}
            />
          </div>

          {/* Team Capacity KPI Card */}
          <div className="p-5 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-3 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Team Capacity</span>
              <Users className="size-5 text-purple-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <CountUpNumber value={metrics.avgCapacity} suffix="%" className="text-3xl font-extrabold text-white" />
              <span className="text-xs text-slate-400">{metrics.totalTeamMembersCount} Members</span>
            </div>
            <AnimatedProgressBar
              percentage={metrics.avgCapacity}
              className="bg-purple-500 h-full rounded-full"
              trackClassName="w-full bg-[#060913] rounded-full h-1.5 overflow-hidden border border-slate-800"
            />
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

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading active projects...</div>
            ) : activeProjects.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">No active projects currently running.</div>
            ) : (
              <div className="space-y-3">
                {activeProjects.map((project) => (
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
                        <span>Budget: {formatCurrency(project.budget || 0)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Health Score */}
                      <div className="text-right">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase block">Health</span>
                        <CountUpNumber value={project.healthScore} suffix="/100" className="text-xs font-extrabold text-emerald-400 block" />
                      </div>

                      {/* Progress Bar */}
                      <div className="w-24 space-y-1 text-right">
                        <div className="text-xs font-semibold text-white">
                          <CountUpNumber value={project.progress} suffix="%" />
                        </div>
                        <AnimatedProgressBar
                          percentage={project.progress}
                          className="bg-gradient-to-r from-sky-400 to-blue-600 h-full rounded-full"
                          trackClassName="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800"
                        />
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
            )}
          </div>

          {/* AI Project Assistant Side Card */}
          <div className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
                <Sparkles className="size-4 text-sky-400 animate-pulse" />
                <span>AI Project Assistant</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Real-time automated inspection active. Workload balances and risk prediction monitored.
              </p>

              <div className="p-4 rounded-xl bg-sky-950/20 border border-sky-500/30 space-y-2">
                <div className="text-xs font-bold text-sky-200">Recommended Actions:</div>
                <ul className="text-[11px] text-slate-300 space-y-1.5 list-disc list-inside">
                  <li>Review active project deadlines and milestone targets.</li>
                  <li>Check team workload capacity matrix.</li>
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

            {recentActivity.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">No recent activity logs.</div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl bg-[#060913] border border-slate-800/60">
                    <img
                      src={getAvatarUrl(log.userAvatar, { id: log.userId, name: log.userName })}
                      alt={log.userName}
                      className="size-8 rounded-full object-cover mt-0.5"
                    />
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white">{log.userName}</span>
                        <span className="text-[10px] text-slate-500">{formatDateTime(log.timestamp)}</span>
                      </div>
                      <p className="text-xs text-slate-300 font-medium">{log.entity}</p>
                      <p className="text-[11px] text-slate-400">{log.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
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

            {upcomingMilestones.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">No upcoming milestones.</div>
            ) : (
              <div className="space-y-3">
                {upcomingMilestones.map((ms) => (
                  <div key={ms.id} className="p-4 rounded-xl bg-[#060913] border border-slate-800/60 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">{ms.title}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Due: {formatDate(ms.dueDate)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{ms.description}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Owner: {ms.owner?.name || 'Team Lead'}</span>
                      <span>{ms.progress}% Complete</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
