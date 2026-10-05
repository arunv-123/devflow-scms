'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Search,
  Filter,
  RefreshCw,
  Code2,
  FileText,
  Flag,
  CheckSquare,
  Building,
  User as UserIcon,
  Sparkles,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { activityLogsApi, ActivityLogFilters } from '@/services/activityLogsApi';
import { projectApi } from '@/services/projectApi';
import { ActivityLogItem, Project } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { formatDateTime } from '@/lib/formatters';
import { getAvatarUrl } from '@/lib/avatar';

export default function ActivityLogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [selectedUser, setSelectedUser] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchLogs = () => {
    setLoading(true);
    const filters: ActivityLogFilters = {};
    if (selectedProjectId !== 'ALL') filters.projectId = selectedProjectId;
    if (selectedAction !== 'ALL') filters.action = selectedAction;
    if (selectedUser !== 'ALL') filters.userName = selectedUser;
    if (searchQuery.trim()) filters.search = searchQuery.trim();

    activityLogsApi
      .getActivityLogs(filters)
      .then((data) => {
        setLogs(data);
      })
      .catch((err) => console.error('Failed to fetch activity logs:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // Load projects for project filter dropdown
    projectApi
      .getProjects()
      .then((data) => setProjects(data))
      .catch((err) => console.error('Failed to fetch projects for filter:', err));
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [selectedProjectId, selectedAction, selectedUser]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  // Extract unique user names for filter
  const uniqueUsers = Array.from(new Set(logs.map((l) => l.userName))).filter(Boolean);

  const getActionBadge = (action: string) => {
    const actLower = action.toLowerCase();
    if (actLower.includes('tech stack')) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
          <Code2 className="size-3 text-emerald-400" />
          {action}
        </span>
      );
    }
    if (actLower.includes('document')) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-300 border border-sky-500/30 flex items-center gap-1">
          <FileText className="size-3 text-sky-400" />
          {action}
        </span>
      );
    }
    if (actLower.includes('milestone')) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
          <Flag className="size-3 text-amber-400" />
          {action}
        </span>
      );
    }
    if (actLower.includes('task')) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30 flex items-center gap-1">
          <CheckSquare className="size-3 text-purple-400" />
          {action}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
        <Sparkles className="size-3 text-slate-400" />
        {action}
      </span>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center">
              <Clock className="size-6 text-sky-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <span>Workspace Activity Logs & History</span>
              </h1>
              <p className="text-xs text-slate-400">
                Chronological system activity, user actions, and project tech stack change history.
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={fetchLogs}
            disabled={loading}
            className="text-xs text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800 gap-1.5 self-start sm:self-auto"
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Filter className="size-3.5 text-sky-400" />
            <span>Filter Activity Logs:</span>
          </div>

          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Project Filter */}
            <div>
              <label className="block text-[10px] font-medium text-slate-400 mb-1">Project</label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-[#060913] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="ALL">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Type Filter */}
            <div>
              <label className="block text-[10px] font-medium text-slate-400 mb-1">Activity Type</label>
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-[#060913] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="ALL">All Activity Types</option>
                <option value="Tech Stack">Tech Stack Changes</option>
                <option value="Document">Document Uploads</option>
                <option value="Task">Task Actions</option>
                <option value="Milestone">Milestone Actions</option>
              </select>
            </div>

            {/* User Filter */}
            <div>
              <label className="block text-[10px] font-medium text-slate-400 mb-1">User</label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-[#060913] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="ALL">All Users</option>
                {uniqueUsers.map((name, idx) => (
                  <option key={idx} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Box */}
            <div>
              <label className="block text-[10px] font-medium text-slate-400 mb-1">Keyword Search</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="Search description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 h-9 px-3 text-xs bg-[#060913] border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                />
                <Button type="submit" size="sm" className="h-9 px-3 bg-sky-600 hover:bg-sky-500 text-white text-xs">
                  <Search className="size-3.5" />
                </Button>
              </div>
            </div>
          </form>
        </div>

        {/* Activity Logs Stream */}
        <div className="space-y-3">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400 space-y-2 rounded-2xl bg-[#0b0f19] border border-slate-800">
              <RefreshCw className="size-6 text-sky-400 animate-spin mx-auto" />
              <span>Loading workspace activity logs...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 space-y-3 rounded-2xl bg-[#0b0f19] border border-slate-800">
              <Clock className="size-8 text-slate-600 mx-auto" />
              <div>
                <p className="font-semibold text-slate-300">No activity logs found</p>
                <p className="text-[11px] text-slate-500">Try adjusting your filter selection or search query.</p>
              </div>
            </div>
          ) : (
            logs.map((log) => {
              const hasTechStackMeta =
                log.metadata &&
                (log.metadata.previousTechStack || log.metadata.newTechStack || log.metadata.additions);

              return (
                <div
                  key={log.id}
                  className="p-4 rounded-2xl bg-[#0b0f19] border border-slate-800 hover:border-slate-700 transition-all space-y-3"
                >
                  {/* Top Bar: User + Action + Timestamp */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <img
                        src={getAvatarUrl(log.userAvatar, { id: log.userId, name: log.userName })}
                        alt={log.userName}
                        className="size-9 rounded-full object-cover border border-slate-800 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white">{log.userName}</span>
                          {log.userRole && (
                            <span className="px-2 py-0.2 rounded text-[9px] bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                              {log.userRole}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400">{log.description}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      {getActionBadge(log.action)}
                      <span className="text-[10px] text-slate-500 font-mono">{formatDateTime(log.timestamp)}</span>
                    </div>
                  </div>

                  {/* Project Context Reference */}
                  {log.projectName && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                      <Building className="size-3 text-slate-500" />
                      <span>Project: <strong className="text-slate-200">{log.projectName}</strong></span>
                    </div>
                  )}

                  {/* TECH STACK AUDIT DETAIL CARD */}
                  {hasTechStackMeta && log.metadata && (
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/30 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                        <span className="font-semibold text-emerald-300 text-[11px] flex items-center gap-1.5">
                          <Code2 className="size-3.5 text-emerald-400" />
                          Tech Stack Change Record
                        </span>
                        {log.metadata.reason && (
                          <span className="text-[10px] text-slate-400 italic">
                            Reason: {log.metadata.reason}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                        {/* Previous Stack */}
                        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
                          <span className="text-[10px] text-slate-400 font-semibold block">Previous Stack:</span>
                          <div className="flex flex-wrap gap-1">
                            {log.metadata.previousTechStack && log.metadata.previousTechStack.length > 0 ? (
                              log.metadata.previousTechStack.map((tech: string, idx: number) => (
                                <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono">
                                  {tech}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-slate-500 italic">Initial creation (None)</span>
                            )}
                          </div>
                        </div>

                        {/* New Stack */}
                        <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 space-y-1">
                          <span className="text-[10px] text-emerald-300 font-semibold block">New Stack:</span>
                          <div className="flex flex-wrap gap-1">
                            {log.metadata.newTechStack && log.metadata.newTechStack.length > 0 ? (
                              log.metadata.newTechStack.map((tech: string, idx: number) => (
                                <span key={idx} className="px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono">
                                  {tech}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-slate-500 italic">Empty stack</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Additions & Removals Breakdown */}
                      {((log.metadata.additions && log.metadata.additions.length > 0) ||
                        (log.metadata.removals && log.metadata.removals.length > 0)) && (
                        <div className="flex flex-wrap gap-2 text-[10px] pt-1">
                          {log.metadata.additions && log.metadata.additions.length > 0 && (
                            <div className="flex items-center gap-1 text-emerald-400">
                              <span className="font-bold">Added:</span>
                              {log.metadata.additions.map((t: string, idx: number) => (
                                <span key={idx} className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                                  + {t}
                                </span>
                              ))}
                            </div>
                          )}

                          {log.metadata.removals && log.metadata.removals.length > 0 && (
                            <div className="flex items-center gap-1 text-rose-400">
                              <span className="font-bold">Removed:</span>
                              {log.metadata.removals.map((t: string, idx: number) => (
                                <span key={idx} className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-mono">
                                  - {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </AppLayout>
  );
}
