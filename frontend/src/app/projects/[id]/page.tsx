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
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { mockProjects, mockTasks, mockMilestones, mockActivityLogs } from '@/lib/mockData';
import { Project, Task, Milestone } from '@/types';
import { projectApi } from '@/services/projectApi';
import { useAuth } from '@/context/AuthContext';

export default function ProjectDetailsPage() {
  const { user } = useAuth();
  const role = user?.role || 'Admin';
  const canCreateTask = ['Super Admin', 'Admin', 'Project Manager', 'Team Lead'].includes(role);
  const canEditProject = ['Super Admin', 'Admin', 'Project Manager', 'Team Lead'].includes(role);
  const canDeleteProject = ['Super Admin', 'Admin'].includes(role);
  const canEditTask = ['Super Admin', 'Admin', 'Project Manager', 'Team Lead'].includes(role);
  const canDeleteTask = ['Super Admin', 'Admin', 'Project Manager'].includes(role);
  const canDeleteMilestone = ['Super Admin', 'Admin', 'Project Manager'].includes(role);

  const params = useParams();
  const projectId = (params?.id as string) || 'prj-101';

  const [project, setProject] = useState<Project>(
    () => mockProjects.find((p) => p.id === projectId) || mockProjects[0]
  );
  const [projectTasks, setProjectTasks] = useState<Task[]>(
    () => mockTasks.filter((t) => t.projectId === projectId)
  );
  const [projectMilestones, setProjectMilestones] = useState<Milestone[]>(
    () => mockMilestones.filter((m) => m.projectId === projectId)
  );

  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'milestones' | 'team' | 'health' | 'activity'>('overview');

  useEffect(() => {
    if (projectId) {
      projectApi
        .getProjectById(projectId)
        .then((data) => {
          if (data) setProject(data);
        })
        .catch(() => {});

      projectApi
        .getTasks(projectId)
        .then((data) => {
          if (data) setProjectTasks(data);
        })
        .catch(() => {});

      projectApi
        .getMilestones(projectId)
        .then((data) => {
          if (data) setProjectMilestones(data);
        })
        .catch(() => {});
    }
  }, [projectId]);

  const handleDeleteProject = async () => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await projectApi.deleteProject(projectId);
      window.location.href = '/projects';
    } catch (err) {
      console.error('Failed to delete project', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await projectApi.deleteTask(taskId);
      setProjectTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      console.error('Failed to delete task', err);
    }
  };

  const handleDeleteMilestone = async (id: string) => {
    if (!confirm('Are you sure you want to delete this milestone?')) return;
    try {
      await projectApi.deleteMilestone(id);
      setProjectMilestones((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error('Failed to delete milestone', err);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
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
                <Link href="/tasks">
                  <Button size="sm" className="bg-sky-600 hover:bg-sky-500 text-white text-xs gap-1.5 shadow-md shadow-sky-600/20">
                    <Plus className="size-4" />
                    <span>Add Task</span>
                  </Button>
                </Link>
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
                <div className="text-xl font-bold text-white">${project.budget?.toLocaleString()}</div>
                <div className="text-[11px] text-slate-400">Spent: ${project.spent?.toLocaleString()}</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Completion</span>
                <div className="text-xl font-bold text-sky-400">{project.progress}%</div>
                <div className="text-[11px] text-slate-400">Target: {project.endDate}</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Health Score</span>
                <div className="text-xl font-bold text-emerald-400">{project.healthScore}/100</div>
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
                      <div className="text-[11px] text-slate-400 mt-0.5">Assignee: {t.assignee?.name || 'Unassigned'} • Due: {t.dueDate}</div>
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
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>Target Date: {m.dueDate}</span>
                      <span>Progress: {m.progress}%</span>
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
                    <img src={m.avatar} alt="" className="size-10 rounded-xl object-cover" />
                    <div>
                      <h4 className="text-sm font-bold text-white">{m.name}</h4>
                      <span className="text-xs text-sky-400 font-semibold">{m.role}</span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800">
                    <span>Workload</span>
                    <span className="font-bold text-white">{m.workloadPercent || 50}%</span>
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
            <h3 className="text-sm font-bold text-white">Project Activity Log</h3>
            <div className="space-y-3">
              {mockActivityLogs.map((log) => (
                <div key={log.id} className="p-3 rounded-xl bg-[#060913] border border-slate-800 text-xs flex items-start gap-3">
                  <img src={log.userAvatar} alt="" className="size-7 rounded-full object-cover mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">{log.userName} — {log.action}</span>
                    <span className="text-slate-400">{log.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
