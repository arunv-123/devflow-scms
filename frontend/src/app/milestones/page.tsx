'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, ArrowRight, X, Pencil, Trash2, Loader2, CheckSquare, Square, Sparkles, CheckCircle2, AlertTriangle, Check } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { mockMilestones } from '@/lib/mockData';
import { Milestone, MilestoneStatus, TeamMember, Project, Task } from '@/types';
import { projectApi } from '@/services/projectApi';
import { aiApi, AutoLinkMilestoneResult, AutoLinkMilestoneItem } from '@/services/aiApi';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { formatDate } from '@/lib/formatters';
import { CountUpNumber, AnimatedProgressBar } from '@/components/common/DataAnimation';
import { getAvatarUrl } from '@/lib/avatar';

export default function MilestonesPage() {
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
  const canCreateMilestone = ['Super Admin', 'Admin', 'Project Manager', 'Team Lead', 'Project Coordinator'].includes(role);
  const canEditMilestone = ['Super Admin', 'Admin', 'Project Manager', 'Project Coordinator'].includes(role);
  const canUpdateMilestoneProgress = ['Super Admin', 'Admin', 'Project Manager', 'Team Lead', 'Project Coordinator'].includes(role);
  const canDeleteMilestone = ['Super Admin', 'Admin', 'Project Manager'].includes(role);

  const [milestones, setMilestones] = useState<Milestone[]>(mockMilestones);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);

  const [isQuickUpdateOpen, setIsQuickUpdateOpen] = useState(false);
  const [quickMilestone, setQuickMilestone] = useState<Milestone | null>(null);
  const [quickProgress, setQuickProgress] = useState(0);
  const [quickStatus, setQuickStatus] = useState<MilestoneStatus>('In Progress');

  // AI Milestone Auto-Linking State
  const [isAutoLinkModalOpen, setIsAutoLinkModalOpen] = useState(false);
  const [isAutoLinking, setIsAutoLinking] = useState(false);
  const [isSavingAutoLinks, setIsSavingAutoLinks] = useState(false);
  const [autoLinkResult, setAutoLinkResult] = useState<AutoLinkMilestoneResult | null>(null);
  const [autoLinkItems, setAutoLinkItems] = useState<AutoLinkMilestoneItem[]>([]);
  const [autoLinkProjectId, setAutoLinkProjectId] = useState<string>('');
  const [autoLinkNotice, setAutoLinkNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    projectName: '',
    projectId: '',
    description: '',
    status: 'Upcoming' as MilestoneStatus,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    progress: 0,
    ownerName: 'Sarah Chen',
  });

  const loadMilestones = useCallback(() => {
    projectApi
      .getMilestones()
      .then((data) => {
        if (data && Array.isArray(data)) setMilestones(data);
      })
      .catch((err) => console.error('Failed to load milestones:', err));
  }, []);

  const loadProjects = () => {
    projectApi
      .getProjects()
      .then((loadedProjects) => {
        setProjects(loadedProjects || []);
        if (loadedProjects && loadedProjects.length > 0 && !formData.projectId) {
          setFormData((prev) => ({
            ...prev,
            projectId: loadedProjects[0].id,
            projectName: loadedProjects[0].name,
          }));
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadMilestones();
    loadProjects();
  }, []);

  // Fetch tasks for the selected project to display candidate unlinked tasks
  const loadTasksForProject = useCallback(async (pId: string, currentMilestoneId?: string) => {
    if (!pId) return;
    setIsLoadingTasks(true);
    try {
      const tasks = await projectApi.getTasks(pId);
      setProjectTasks(tasks || []);

      if (currentMilestoneId) {
        const preSelected = (tasks || []).filter((t) => t.milestoneId === currentMilestoneId).map((t) => t.id);
        setSelectedTaskIds(preSelected);
      } else {
        setSelectedTaskIds([]);
      }
    } catch (err) {
      console.error('Failed to load project tasks:', err);
      setProjectTasks([]);
      setSelectedTaskIds([]);
    } finally {
      setIsLoadingTasks(false);
    }
  }, []);

  const handleOpenCreateModal = () => {
    setEditingMilestone(null);
    const defaultPrj = projects[0];
    const initialPrjId = defaultPrj ? defaultPrj.id : '';
    const initialPrjName = defaultPrj ? defaultPrj.name : '';

    setFormData({
      title: '',
      projectName: initialPrjName,
      projectId: initialPrjId,
      description: '',
      status: 'Upcoming',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      progress: 0,
      ownerName: 'Sarah Chen',
    });
    setSelectedTaskIds([]);

    if (initialPrjId) {
      loadTasksForProject(initialPrjId);
    }
    setIsModalOpen(true);
  };

  const handleEditClick = (ms: Milestone) => {
    setEditingMilestone(ms);
    setFormData({
      title: ms.title,
      projectName: ms.projectName,
      projectId: ms.projectId,
      description: ms.description || '',
      status: ms.status,
      dueDate: ms.dueDate,
      progress: ms.progress || 0,
      ownerName: ms.owner?.name || 'Sarah Chen',
    });

    loadTasksForProject(ms.projectId, ms.id);
    setIsModalOpen(true);
  };

  const handleProjectSelectChange = (pId: string) => {
    const selectedPrj = projects.find((p) => p.id === pId);
    setFormData((prev) => ({
      ...prev,
      projectId: pId,
      projectName: selectedPrj ? selectedPrj.name : prev.projectName,
    }));
    loadTasksForProject(pId, editingMilestone ? editingMilestone.id : undefined);
  };

  const handleDeleteMilestone = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Milestone',
      message: 'Are you sure you want to delete this milestone? Linked tasks will not be deleted; their milestone association will simply be cleared.',
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
          loadMilestones();
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

  const handleQuickUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickMilestone) return;
    try {
      await projectApi.updateMilestone(quickMilestone.id, {
        progress: quickProgress,
        status: quickStatus,
      });
      setIsQuickUpdateOpen(false);
      setQuickMilestone(null);
      loadMilestones();
    } catch (err) {
      console.error('Failed to update milestone progress', err);
    }
  };

  const handleCreateOrUpdateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.projectId || !formData.dueDate) return;
    try {
      const owner: TeamMember = {
        id: 'tm-1',
        name: formData.ownerName,
        email: 'sarah.c@devflow.io',
        role: 'Project Manager',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        skills: ['Agile', 'Scrum'],
        assignedProjects: [formData.projectName],
        workloadPercent: 78,
        availability: 'Available',
        performanceRating: 4.9,
        joinedDate: '2023-01-15',
      };

      if (editingMilestone) {
        await projectApi.updateMilestone(editingMilestone.id, {
          title: formData.title,
          projectName: formData.projectName,
          projectId: formData.projectId,
          description: formData.description,
          status: formData.status,
          dueDate: formData.dueDate,
          progress: formData.progress,
          owner,
          linkedTaskIds: selectedTaskIds,
        });
      } else {
        await projectApi.createMilestone({
          title: formData.title,
          projectName: formData.projectName,
          projectId: formData.projectId,
          description: formData.description,
          status: formData.status,
          dueDate: formData.dueDate,
          startDate: new Date().toISOString().split('T')[0],
          progress: formData.progress,
          relatedTasksCount: selectedTaskIds.length,
          owner,
          linkedTaskIds: selectedTaskIds,
        });
      }

      setIsModalOpen(false);
      setEditingMilestone(null);
      loadMilestones();
    } catch (err) {
      console.error('Failed to save milestone', err);
    }
  };

  // AI Milestone Auto-Link Handlers
  const handleRunAutoLink = async (targetPId?: string) => {
    setIsAutoLinking(true);
    setAutoLinkNotice(null);
    const pIdToUse =
      targetPId !== undefined
        ? targetPId
        : autoLinkProjectId || formData.projectId || (projects[0] ? projects[0].id : '');

    try {
      const res = await aiApi.autoLinkMilestones(pIdToUse || undefined);
      setAutoLinkResult(res);
      setAutoLinkItems(res.recommendations || []);
      if (!autoLinkProjectId && pIdToUse) {
        setAutoLinkProjectId(pIdToUse);
      }
      setIsAutoLinkModalOpen(true);
    } catch (err: any) {
      console.error('Failed to run AI milestone auto-linking:', err);
      addToast({
        type: 'error',
        title: 'AI Auto-Link Error',
        message: 'Failed to analyze existing tasks for AI milestone assignment. Please check backend status.',
      });
    } finally {
      setIsAutoLinking(false);
    }
  };

  const handleToggleApproveAutoLinkItem = (taskId: string) => {
    setAutoLinkItems((prev) =>
      prev.map((item) => (item.taskId === taskId ? { ...item, approved: !item.approved } : item))
    );
  };

  const handleChangeItemMilestone = (taskId: string, newMilestoneId: string, newMilestoneTitle: string) => {
    setAutoLinkItems((prev) =>
      prev.map((item) =>
        item.taskId === taskId
          ? {
              ...item,
              recommendedMilestoneId: newMilestoneId,
              recommendedMilestoneTitle: newMilestoneTitle,
              approved: true,
            }
          : item
      )
    );
  };

  const handleApplyApprovedAutoLinks = async () => {
    if (autoLinkItems.length === 0) return;
    setIsSavingAutoLinks(true);
    setAutoLinkNotice(null);
    try {
      const updates = autoLinkItems.map((item) => ({
        taskId: item.taskId,
        milestoneId: item.recommendedMilestoneId,
        approved: !!item.approved,
      }));

      const res = await aiApi.confirmMilestoneLinks(updates);
      setAutoLinkNotice({
        type: 'success',
        message: `Successfully updated ${res.updatedCount} task milestone link(s) in MongoDB database.`,
      });
      loadMilestones();
      if (formData.projectId) {
        loadTasksForProject(formData.projectId);
      }
      setTimeout(() => {
        setIsAutoLinkModalOpen(false);
        setAutoLinkNotice(null);
      }, 1500);
    } catch (err: any) {
      console.error('Failed to save approved milestone links:', err);
      setAutoLinkNotice({
        type: 'error',
        message: 'Failed to update milestone links. Please try again.',
      });
    } finally {
      setIsSavingAutoLinks(false);
    }
  };

  // Filter tasks belonging to selected project that are either unlinked OR currently linked to this milestone
  const candidateTasks = projectTasks.filter(
    (t) =>
      t.projectId === formData.projectId &&
      (!t.milestoneId || t.milestoneId === '' || (editingMilestone && t.milestoneId === editingMilestone.id))
  );

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
          {canCreateMilestone && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                disabled={isAutoLinking}
                onClick={() => handleRunAutoLink()}
                className="bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-500/40 text-xs gap-1.5 shadow-md transition-all disabled:opacity-50"
              >
                {isAutoLinking ? (
                  <Loader2 className="size-4 animate-spin text-purple-300" />
                ) : (
                  <Sparkles className="size-4 text-purple-400" />
                )}
                <span>AI Link Existing Tasks</span>
              </Button>

              <Button
                size="sm"
                onClick={handleOpenCreateModal}
                className="bg-sky-600 hover:bg-sky-500 text-white text-xs gap-1.5 shadow-md shadow-sky-600/20"
              >
                <Plus className="size-4" />
                <span>Create Milestone</span>
              </Button>
            </div>
          )}
        </div>

        {/* Create / Edit Milestone Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-screen z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
            <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl bg-[#0b0f19] border border-slate-800 p-6 text-white shadow-2xl z-10">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
                <h3 className="text-base font-bold">
                  {editingMilestone ? 'Edit Milestone' : 'Create New Milestone'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleCreateOrUpdateMilestone} className="flex flex-col min-h-0 overflow-hidden mt-3">
                <div className="overflow-y-auto pr-1 space-y-3.5 text-xs">
                  {/* Project Selection */}
                  <div>
                    <label className="block text-slate-400 mb-1">Target Project</label>
                    {projects.length > 0 ? (
                      <select
                        required
                        value={formData.projectId}
                        onChange={(e) => handleProjectSelectChange(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500 cursor-pointer font-semibold"
                      >
                        {projects.map((p) => (
                          <option key={p.id} value={p.id} className="bg-[#0b0f19] text-white">
                            {p.name} ({p.clientName})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        required
                        value={formData.projectName}
                        onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                        placeholder="e.g. FinTech Nexus Suite"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Milestone Title</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500 font-semibold"
                      placeholder="e.g. Core Engine Beta Release"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                      placeholder="Milestone scope and key deliverables..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Target Due Date</label>
                      <input
                        type="date"
                        required
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        className="w-full px-2 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500 text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as MilestoneStatus })}
                        className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500 cursor-pointer"
                      >
                        <option value="Upcoming">Upcoming</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Achieved">Achieved</option>
                        <option value="Overdue">Overdue</option>
                      </select>
                    </div>
                  </div>

                  {/* ─── LINK EXISTING TASKS SECTION ─────────────────────────────── */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <label className="block text-slate-300 font-bold text-xs">
                        Link Existing Tasks{' '}
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({candidateTasks.length} available in project)
                        </span>
                      </label>
                      {candidateTasks.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedTaskIds.length === candidateTasks.length) {
                              setSelectedTaskIds([]);
                            } else {
                              setSelectedTaskIds(candidateTasks.map((t) => t.id));
                            }
                          }}
                          className="text-[10px] text-sky-400 hover:underline font-semibold"
                        >
                          {selectedTaskIds.length === candidateTasks.length ? 'Deselect All' : 'Select All'}
                        </button>
                      )}
                    </div>

                    {isLoadingTasks ? (
                      <div className="p-3 rounded-lg bg-[#060913] border border-slate-800 text-slate-400 text-xs flex items-center gap-2">
                        <Loader2 className="size-3.5 animate-spin text-sky-400" />
                        <span>Loading tasks for selected project...</span>
                      </div>
                    ) : candidateTasks.length > 0 ? (
                      <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-[#060913] border border-slate-800">
                        {candidateTasks.map((t) => {
                          const isChecked = selectedTaskIds.includes(t.id);
                          return (
                            <label
                              key={t.id}
                              className={`flex items-center justify-between p-2 rounded-lg border transition-colors cursor-pointer text-xs ${
                                isChecked
                                  ? 'bg-sky-950/30 border-sky-500/40 text-white'
                                  : 'bg-slate-900/40 border-slate-800/80 text-slate-300 hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0 pr-2">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    if (isChecked) {
                                      setSelectedTaskIds(selectedTaskIds.filter((id) => id !== t.id));
                                    } else {
                                      setSelectedTaskIds([...selectedTaskIds, t.id]);
                                    }
                                  }}
                                  className="rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-sky-500/40 cursor-pointer"
                                />
                                <span className="font-semibold truncate text-[11px]">{t.title}</span>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded text-[9px] font-bold shrink-0 ${
                                  t.status === 'Completed'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : t.status === 'In Progress'
                                    ? 'bg-sky-500/20 text-sky-400'
                                    : 'bg-amber-500/20 text-amber-400'
                                }`}
                              >
                                {t.status}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-500 italic p-2 rounded-lg bg-[#060913] border border-slate-800">
                        No unlinked tasks available in this project.
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end gap-2 shrink-0 mt-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsModalOpen(false)}
                    className="text-slate-400 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold">
                    Save Milestone
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Milestone Timeline List */}
        <div className="space-y-4">
          {milestones.map((ms) => (
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
                    <span className="font-mono text-white font-bold">{formatDate(ms.dueDate)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 text-[10px] block uppercase">Linked Tasks</span>
                    <span className="font-mono text-sky-400 font-bold">{ms.relatedTasksCount || 0} Tasks</span>
                  </div>
                  {(canEditMilestone || canUpdateMilestoneProgress || canDeleteMilestone) && (
                    <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
                      {canEditMilestone && (
                        <button
                          onClick={() => handleEditClick(ms)}
                          className="p-1 text-slate-400 hover:text-white transition-colors"
                          title="Edit Milestone"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                      )}
                      {!canEditMilestone && canUpdateMilestoneProgress && (
                        <button
                          onClick={() => {
                            setQuickMilestone(ms);
                            setQuickProgress(ms.progress || 0);
                            setQuickStatus(ms.status);
                            setIsQuickUpdateOpen(true);
                          }}
                          className="px-2 py-0.5 rounded text-[10px] bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 font-semibold"
                          title="Update Progress & Status"
                        >
                          Update Progress
                        </button>
                      )}
                      {canDeleteMilestone && (
                        <button
                          onClick={() => handleDeleteMilestone(ms.id)}
                          className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Delete Milestone"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{ms.description}</p>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Phase Completion</span>
                  <span className="text-white font-bold">
                    <CountUpNumber value={ms.progress || 0} suffix="%" />
                  </span>
                </div>
                <AnimatedProgressBar
                  percentage={ms.progress || 0}
                  className="bg-gradient-to-r from-sky-400 to-blue-600 h-full rounded-full"
                  trackClassName="w-full bg-[#060913] rounded-full h-2 overflow-hidden border border-slate-800"
                />
              </div>

              <div className="flex items-center justify-between pt-2 text-xs text-slate-400 border-t border-slate-800/60">
                <div className="flex items-center gap-2">
                  <img src={getAvatarUrl(ms.owner?.avatar, ms.owner)} alt={ms.owner?.name || 'Owner'} className="size-6 rounded-full object-cover" />
                  <span>Owner: {ms.owner?.name || 'Sarah Chen'} ({ms.owner?.role || 'Project Manager'})</span>
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

        {/* Quick Progress/Status Update Modal for Team Lead */}
        {isQuickUpdateOpen && quickMilestone && (
          <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-screen z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
            <div className="relative w-full max-w-sm max-h-[90vh] flex flex-col rounded-2xl bg-[#0b0f19] border border-slate-800 p-6 text-white shadow-2xl z-10">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
                <h3 className="text-base font-bold">Update Milestone Progress</h3>
                <button onClick={() => setIsQuickUpdateOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="size-4" />
                </button>
              </div>

              <form onSubmit={handleQuickUpdate} className="flex flex-col min-h-0 overflow-hidden mt-3">
                <div className="overflow-y-auto pr-1 space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Status</label>
                    <select
                      value={quickStatus}
                      onChange={(e) => setQuickStatus(e.target.value as MilestoneStatus)}
                      className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                    >
                      <option value="Upcoming">Upcoming</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Achieved">Achieved</option>
                      <option value="Overdue">Overdue</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Progress (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={quickProgress}
                      onChange={(e) => setQuickProgress(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end gap-2 shrink-0 mt-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsQuickUpdateOpen(false)}
                    className="text-slate-400 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-sky-600 hover:bg-sky-500 text-white text-xs">
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* AI Milestone Assignment Summary & Approval Modal */}
        {isAutoLinkModalOpen && autoLinkResult && (
          <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-screen z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
            <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-[#0b0f19] border border-slate-800 p-6 text-white shadow-2xl z-10">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                    <Sparkles className="size-4 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>AI Milestone Assignment</span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Semantic matching of existing unlinked tasks against project milestone scopes.
                    </p>
                  </div>
                </div>

                <button onClick={() => setIsAutoLinkModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="size-5" />
                </button>
              </div>

              <div className="overflow-y-auto pr-1 space-y-4 my-3 text-xs">
                {/* Notification Banner */}
                {autoLinkNotice && (
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                      autoLinkNotice.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 shrink-0" />
                      <span>{autoLinkNotice.message}</span>
                    </div>
                  </div>
                )}

                {/* Summary Metrics Banner */}
                <div className="p-4 rounded-xl bg-[#060913] border border-slate-800 space-y-3">
                  <div className="text-xs font-bold text-slate-200 border-b border-slate-800/80 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span>AI Milestone Assignment Summary</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400 font-medium">Target Project:</span>
                      <select
                        value={autoLinkProjectId}
                        onChange={(e) => {
                          const newPId = e.target.value;
                          setAutoLinkProjectId(newPId);
                          handleRunAutoLink(newPId);
                        }}
                        className="h-8 px-2.5 text-xs bg-[#0b0f19] border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500 font-semibold cursor-pointer"
                      >
                        <option value="">All Projects</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Tasks Analyzed</span>
                      <span className="text-lg font-bold text-white">{autoLinkResult.summary.totalAnalyzed} tasks analyzed</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider block">Auto-Linked (90%+)</span>
                      <span className="text-lg font-bold text-emerald-300">{autoLinkResult.summary.autoLinkedCount} automatically linked</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider block">Requires Approval (75-89%)</span>
                      <span className="text-lg font-bold text-amber-300">{autoLinkResult.summary.requiresApprovalCount} requires approval</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Unassigned (&lt;75%)</span>
                      <span className="text-lg font-bold text-slate-400">{autoLinkResult.summary.unassignedCount} remains unassigned</span>
                    </div>
                  </div>
                </div>

                {/* Recommendations List */}
                <div className="space-y-3 pr-1">
                  <h4 className="text-xs font-semibold text-slate-300 border-b border-slate-800/80 pb-1.5 flex items-center justify-between">
                    <span>Task Assignment Recommendations ({autoLinkItems.length})</span>
                    <span className="text-[10px] text-slate-500 font-normal">Review confidence scores & customize milestones</span>
                  </h4>

                  {autoLinkItems.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500 italic rounded-xl bg-slate-950/40 border border-slate-800">
                      No unlinked existing tasks found requiring milestone assignment.
                    </div>
                  ) : (
                    autoLinkItems.map((item) => {
                      const isAuto = item.status === 'auto_assigned';
                      const isApproval = item.status === 'requires_approval';
                      const isUnassigned = item.status === 'unassigned';

                      return (
                        <div
                          key={item.taskId}
                          className={`p-3.5 rounded-xl border transition-all ${
                            item.approved
                              ? 'bg-emerald-950/20 border-emerald-500/40'
                              : isApproval
                              ? 'bg-amber-950/20 border-amber-500/40'
                              : 'bg-slate-900/60 border-slate-800'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="space-y-1.5 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h5 className="font-semibold text-white text-xs">{item.taskTitle}</h5>

                                {/* Confidence score badge */}
                                {isAuto ? (
                                  <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1">
                                    <CheckCircle2 className="size-3 text-emerald-400" />
                                    {item.confidenceScore}% Match • Auto-Linked
                                  </span>
                                ) : isApproval ? (
                                  <span className="px-2 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 flex items-center gap-1">
                                    <AlertTriangle className="size-3 text-amber-400" />
                                    {item.confidenceScore}% Match • Requires Approval
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[9px] bg-slate-800 text-slate-400 font-medium border border-slate-700">
                                    {item.confidenceScore}% Match • Remains Unassigned
                                  </span>
                                )}
                              </div>

                              {item.taskDescription && (
                                <p className="text-[11px] text-slate-400 line-clamp-2">{item.taskDescription}</p>
                              )}

                              {/* Tags */}
                              {item.taskTags && item.taskTags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {item.taskTags.map((tag, idx) => (
                                    <span
                                      key={idx}
                                      className="px-1.5 py-0.2 rounded text-[9px] bg-slate-800 text-slate-300 border border-slate-700 font-mono"
                                    >
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              )}

                              <p className="text-[10px] text-purple-300 italic pt-0.5">
                                Match Rationale: {item.matchReason}
                              </p>
                            </div>

                            {/* Controls */}
                            <div className="flex flex-col sm:items-end gap-2 shrink-0">
                              <div className="space-y-1 w-full sm:w-auto">
                                <span className="text-[10px] text-slate-400 block font-medium">Recommended Milestone:</span>
                                <select
                                  value={item.recommendedMilestoneId}
                                  onChange={(e) => {
                                    const selectedMs = milestones.find((m) => m.id === e.target.value);
                                    handleChangeItemMilestone(
                                      item.taskId,
                                      e.target.value,
                                      selectedMs ? selectedMs.title : 'Selected Milestone'
                                    );
                                  }}
                                  className="h-8 px-2 text-[11px] bg-[#060913] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer max-w-[220px]"
                                >
                                  {milestones.map((m) => (
                                    <option key={m.id} value={m.id}>
                                      {m.title}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <Button
                                size="xs"
                                variant={item.approved ? 'default' : 'ghost'}
                                onClick={() => handleToggleApproveAutoLinkItem(item.taskId)}
                                className={`text-[11px] gap-1 ${
                                  item.approved
                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                    : 'text-slate-300 hover:text-white border border-slate-700'
                                }`}
                              >
                                <Check className="size-3" />
                                <span>{item.approved ? 'Approved ✓' : 'Approve Link'}</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 flex items-center justify-between border-t border-slate-800 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsAutoLinkModalOpen(false)}
                  className="text-slate-400 text-xs"
                >
                  Close
                </Button>
                <Button
                  type="button"
                  disabled={isSavingAutoLinks || autoLinkItems.length === 0}
                  onClick={handleApplyApprovedAutoLinks}
                  className="bg-purple-600 hover:bg-purple-500 text-white text-xs gap-1.5 shadow-md shadow-purple-600/20 disabled:opacity-50"
                >
                  {isSavingAutoLinks ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-3.5" />
                  )}
                  <span>Finalize & Update Milestone DB</span>
                </Button>
              </div>
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
