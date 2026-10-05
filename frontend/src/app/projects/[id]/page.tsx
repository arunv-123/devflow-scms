'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  FolderKanban,
  CheckSquare,
  Flag,
  Users,
  BrainCircuit,
  Clock,
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Code2,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { mockProjects, mockTasks, mockMilestones, mockActivityLogs } from '@/lib/mockData';
import { Project, Task, Milestone, ActivityLogItem } from '@/types';
import { projectApi } from '@/services/projectApi';
import { activityLogsApi } from '@/services/activityLogsApi';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { ConfirmModal } from '@/components/ui/confirm-modal';

import { CreateTaskModal } from '@/components/tasks/CreateTaskModal';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/formatters';
import { CountUpNumber, AnimatedProgressBar } from '@/components/common/DataAnimation';
import { getAvatarUrl } from '@/lib/avatar';

export default function ProjectDetailsPage() {
  const { user } = useAuth();
  const { addToast } = useNotifications();
  const role = user?.role || 'Admin';

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    confirmVariant?: 'danger' | 'warning' | 'primary';
    onConfirm: () => Promise<void> | void;
    loading?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const canCreateTask = ['Super Admin', 'Admin', 'Project Manager', 'Team Lead'].includes(role);
  const canEditProject = ['Super Admin', 'Admin', 'Project Manager', 'Team Lead'].includes(role);
  const canDeleteProject = ['Super Admin', 'Admin'].includes(role);
  const canEditTask = ['Super Admin', 'Admin', 'Project Manager', 'Team Lead'].includes(role);
  const canDeleteTask = ['Super Admin', 'Admin', 'Project Manager'].includes(role);
  const canDeleteMilestone = ['Super Admin', 'Admin', 'Project Manager'].includes(role);

  const params = useParams();
  const projectId = (params?.id as string) || 'prj-101';
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const [project, setProject] = useState<Project>(
    () => mockProjects.find((p) => p.id === projectId) || mockProjects[0]
  );
  const [projectTasks, setProjectTasks] = useState<Task[]>(
    () => mockTasks.filter((t) => t.projectId === projectId)
  );
  const [projectMilestones, setProjectMilestones] = useState<Milestone[]>(
    () => mockMilestones.filter((m) => m.projectId === projectId)
  );
  const [projectActivityLogs, setProjectActivityLogs] = useState<ActivityLogItem[]>([]);

  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'milestones' | 'team' | 'health' | 'activity'>('overview');

  const loadProjectTasks = () => {
    if (projectId) {
      projectApi
        .getTasks(projectId)
        .then((data) => {
          if (data) setProjectTasks(data);
        })
        .catch(() => {});
    }
  };

  const loadProjectActivity = () => {
    if (projectId) {
      activityLogsApi
        .getActivityLogs({ projectId })
        .then((data) => {
          if (data) setProjectActivityLogs(data);
        })
        .catch(() => {});
    }
  };

  useEffect(() => {
    if (projectId) {
      projectApi
        .getProjectById(projectId)
        .then((data) => {
          if (data) setProject(data);
        })
        .catch(() => {});

      loadProjectTasks();
      loadProjectActivity();

      projectApi
        .getMilestones(projectId)
        .then((data) => {
          if (data) setProjectMilestones(data);
        })
        .catch(() => {});
    }
  }, [projectId]);

  const handleDeleteProject = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Project',
      message: 'Are you sure you want to delete this project?',
      confirmText: 'Delete Project',
      confirmVariant: 'danger',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, loading: true }));
        try {
          await projectApi.deleteProject(projectId);
          addToast({
            type: 'success',
            title: 'Project Deleted',
            message: 'Project has been deleted successfully.',
          });
          window.location.href = '/projects';
        } catch (err: any) {
          addToast({
            type: 'error',
            title: 'Deletion Failed',
            message: err.response?.data?.error || 'Failed to delete project',
          });
          setConfirmModal((prev) => ({ ...prev, isOpen: false, loading: false }));
        }
      },
    });
  };

  const handleDeleteTask = (taskId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Task',
      message: 'Are you sure you want to delete this task?',
      confirmText: 'Delete Task',
      confirmVariant: 'danger',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, loading: true }));
        try {
          await projectApi.deleteTask(taskId);
          addToast({
            type: 'success',
            title: 'Task Deleted',
            message: 'Task has been deleted successfully.',
          });
          setProjectTasks((prev) => prev.filter((t) => t.id !== taskId));
        } catch (err: any) {
          addToast({
            type: 'error',
            title: 'Deletion Failed',
            message: err.response?.data?.error || 'Failed to delete task',
          });
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false, loading: false }));
        }
      },
    });
  };

  const handleDeleteMilestone = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Milestone',
      message: 'Are you sure you want to delete this milestone?',
      confirmText: 'Delete Milestone',
      confirmVariant: 'danger',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, loading: true }));
        try {
          await projectApi.deleteMilestone(id);
          addToast({
            type: 'success',
            title: 'Milestone Deleted',
            message: 'Milestone has been deleted successfully.',
          });
          setProjectMilestones((prev) => prev.filter((m) => m.id !== id));
        } catch (err: any) {
          addToast({
            type: 'error',
            title: 'Deletion Failed',
            message: err.response?.data?.error || 'Failed to delete milestone',
          });
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false, loading: false }));
        }
      },
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <CreateTaskModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          onTaskCreated={loadProjectTasks}
          initialProjectId={projectId}
        />

        {/* Top Back Link & Title Header */}
        <div className="space-y-3">
          <Link href="/projects" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="size-3.5" />
            <span>Back to Projects</span>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white tracking-tight">{project.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  {project.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Client: {project.clientName} • Manager: {project.manager?.name || 'Alex Morgan'}</p>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/ai/project-intelligence">
                <Button size="sm" variant="outline" className="border-purple-500/30 bg-purple-950/20 text-purple-300 hover:bg-purple-900/40 text-xs gap-1.5">
                  <BrainCircuit className="size-4 text-purple-400" />
                  <span>AI Risk Scanner</span>
                </Button>
              </Link>
              {canDeleteProject && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDeleteProject}
                  className="border-rose-900/50 bg-rose-950/20 text-rose-400 hover:bg-rose-900/40 text-xs gap-1.5"
                >
                  <Trash2 className="size-3.5" />
                  <span>Delete Project</span>
                </Button>
              )}
              {canCreateTask && (
                <Button
                  size="sm"
                  onClick={() => setIsTaskModalOpen(true)}
                  className="bg-sky-600 hover:bg-sky-500 text-white text-xs gap-1.5 shadow-md shadow-sky-600/20"
                >
                  <Plus className="size-4" />
                  <span>Add Task</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation Bar */}
        <div className="border-b border-slate-800 flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: FolderKanban },
            { id: 'tasks', label: `Tasks (${projectTasks.length})`, icon: CheckSquare },
            { id: 'milestones', label: `Milestones (${projectMilestones.length})`, icon: Flag },
            { id: 'team', label: `Team (${project.members?.length || 0})`, icon: Users },
            { id: 'health', label: 'Health & Risk', icon: BrainCircuit },
            { id: 'activity', label: 'Activity Log', icon: Clock },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-sky-500 text-white bg-sky-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`size-4 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Panels */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Overview Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Budget</span>
                <div className="text-xl font-bold text-white">{formatCurrency(project.budget || 0)}</div>
                <div className="text-[11px] text-slate-400">Spent: {formatCurrency(project.spent || 0)}</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-1.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Completion</span>
                <div className="text-xl font-bold text-sky-400">
                  <CountUpNumber value={project.progress} suffix="%" />
                </div>
                <AnimatedProgressBar
                  percentage={project.progress}
                  className="bg-sky-400 h-full rounded-full"
                  trackClassName="w-full bg-[#060913] rounded-full h-1.5 overflow-hidden border border-slate-800"
                />
                <div className="text-[11px] text-slate-400 pt-0.5">Target: {formatDate(project.endDate)}</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Health Score</span>
                <div className="text-xl font-bold text-emerald-400">
                  <CountUpNumber value={project.healthScore} suffix="/100" />
                </div>
                <div className="text-[11px] text-emerald-400 font-semibold">{project.riskLevel} Risk</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Team Size</span>
                <div className="text-xl font-bold text-white">{project.members?.length || 0} Members</div>
                <div className="text-[11px] text-slate-400">Assigned</div>
              </div>
            </div>

            {/* Description & Tech Stack */}
            <div className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white">Project Description</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{project.description}</p>

              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold text-slate-400">Technologies Used:</span>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(project.techStack) &&
                    project.techStack.map((tech, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg text-xs bg-[#060913] text-sky-300 border border-slate-800 font-mono">
                        {tech}
                      </span>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white">Project Tasks</h3>
              <div className="space-y-2">
                {projectTasks.map((t) => (
                  <div key={t.id} className="p-3.5 rounded-xl bg-[#060913] border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">{t.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Assigned to: {t.assignee?.id && t.assignee.id !== 'unassigned' ? `${t.assignee.name} (${t.assignee.role})` : 'Unassigned'} • Due: {formatDate(t.dueDate)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                        {t.status}
                      </span>
                      {canDeleteTask && (
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => handleDeleteTask(t.id)}
                          className="text-xs text-rose-400 hover:text-rose-300 p-1"
                          title="Delete Task"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'milestones' && (
          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white">Project Milestones</h3>
              <div className="space-y-3">
                {projectMilestones.map((m) => (
                  <div key={m.id} className="p-4 rounded-xl bg-[#060913] border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">{m.title}</span>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {m.status}
                        </span>
                        {canDeleteMilestone && (
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => handleDeleteMilestone(m.id)}
                            className="text-xs text-rose-400 hover:text-rose-300 p-1"
                            title="Delete Milestone"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-400">{m.description}</p>
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Target Date: {formatDate(m.dueDate)}</span>
                        <span>
                          Progress: <CountUpNumber value={m.progress} suffix="%" />
                        </span>
                      </div>
                      <AnimatedProgressBar
                        percentage={m.progress}
                        className="bg-gradient-to-r from-sky-400 to-blue-600 h-full rounded-full"
                        trackClassName="w-full bg-[#0b0f19] rounded-full h-1.5 overflow-hidden border border-slate-800"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.isArray(project.members) &&
              project.members.map((m) => (
                <div key={m.id} className="p-5 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-3">
                  <div className="flex items-center gap-3">
                    <img src={getAvatarUrl(m.avatar, m)} alt="" className="size-10 rounded-xl object-cover" />
                    <div>
                      <h4 className="text-sm font-bold text-white">{m.name}</h4>
                      <span className="text-xs text-sky-400 font-semibold">{m.role}</span>
                    </div>
                  </div>
                  <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Workload</span>
                      <span className="font-bold text-white">
                        <CountUpNumber value={m.workloadPercent || 50} suffix="%" />
                      </span>
                    </div>
                    <AnimatedProgressBar
                      percentage={m.workloadPercent || 50}
                      className="bg-purple-500 h-full rounded-full"
                      trackClassName="w-full bg-[#060913] rounded-full h-1.5 overflow-hidden border border-slate-800"
                    />
                  </div>
                </div>
              ))}
          </div>
        )}

        {activeTab === 'health' && (
          <div className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
              <BrainCircuit className="size-5 text-purple-400" />
              <span>AI Project Health Diagnostic</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Overall health score is {project.healthScore}/100. Task completion velocity is on track with 0 overdue blockers.
            </p>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="size-4 text-sky-400" />
                <span>Project Activity & Tech Stack History</span>
              </h3>
              <span className="text-[11px] text-slate-400">
                {projectActivityLogs.length > 0 ? projectActivityLogs.length : mockActivityLogs.length} events logged
              </span>
            </div>

            <div className="space-y-3">
              {(projectActivityLogs.length > 0 ? projectActivityLogs : mockActivityLogs).map((log: any) => {
                const hasTechStackMeta =
                  log.metadata &&
                  (log.metadata.previousTechStack || log.metadata.newTechStack || log.metadata.additions);

                return (
                  <div key={log.id} className="p-3.5 rounded-xl bg-[#060913] border border-slate-800 text-xs space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <img src={getAvatarUrl(log.userAvatar, { id: log.userId, name: log.userName })} alt="" className="size-7 rounded-full object-cover mt-0.5 border border-slate-800" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{log.userName}</span>
                            {log.userRole && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                                {log.userRole}
                              </span>
                            )}
                          </div>
                          <p className="text-slate-300 text-[11px] mt-0.5">{log.description}</p>
                        </div>
                      </div>

                      <span className="text-[10px] text-slate-500 font-mono shrink-0">{log.timestamp ? formatDateTime(log.timestamp) : 'Just now'}</span>
                    </div>

                    {/* Tech Stack Change Detail Card */}
                    {hasTechStackMeta && log.metadata && (
                      <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/30 space-y-2 text-xs">
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-1 font-semibold text-emerald-300 text-[11px]">
                          <span className="flex items-center gap-1">
                            <Code2 className="size-3.5 text-emerald-400" />
                            Tech Stack History Audit
                          </span>
                          {log.metadata.reason && <span className="text-[10px] text-slate-400 italic">Reason: {log.metadata.reason}</span>}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                          <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                            <span className="text-[10px] text-slate-400 font-medium block mb-1">Previous:</span>
                            <div className="flex flex-wrap gap-1">
                              {log.metadata.previousTechStack && log.metadata.previousTechStack.length > 0 ? (
                                log.metadata.previousTechStack.map((t: string, i: number) => (
                                  <span key={i} className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 text-[9px] font-mono">
                                    {t}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[10px] text-slate-500 italic">None (Initial Stack)</span>
                              )}
                            </div>
                          </div>

                          <div className="p-2 rounded bg-emerald-950/20 border border-emerald-500/20">
                            <span className="text-[10px] text-emerald-300 font-medium block mb-1">Updated Stack:</span>
                            <div className="flex flex-wrap gap-1">
                              {log.metadata.newTechStack && log.metadata.newTechStack.length > 0 ? (
                                log.metadata.newTechStack.map((t: string, i: number) => (
                                  <span key={i} className="px-1.5 py-0.2 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 text-[9px] font-mono">
                                    {t}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[10px] text-slate-500 italic">Empty</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {((log.metadata.additions && log.metadata.additions.length > 0) ||
                          (log.metadata.removals && log.metadata.removals.length > 0)) && (
                          <div className="flex flex-wrap gap-2 text-[10px] pt-1">
                            {log.metadata.additions && log.metadata.additions.length > 0 && (
                              <div className="flex items-center gap-1 text-emerald-400">
                                <span className="font-bold">Added:</span>
                                {log.metadata.additions.map((t: string, i: number) => (
                                  <span key={i} className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                                    + {t}
                                  </span>
                                ))}
                              </div>
                            )}

                            {log.metadata.removals && log.metadata.removals.length > 0 && (
                              <div className="flex items-center gap-1 text-rose-400">
                                <span className="font-bold">Removed:</span>
                                {log.metadata.removals.map((t: string, i: number) => (
                                  <span key={i} className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-mono">
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
              })}
            </div>
          </div>
        )}
        {/* Reusable Confirm Modal */}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
          onConfirm={confirmModal.onConfirm}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          confirmVariant={confirmModal.confirmVariant}
          loading={confirmModal.loading}
        />
      </div>
    </AppLayout>
  );
}
