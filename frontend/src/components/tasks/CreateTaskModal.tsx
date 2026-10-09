'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  AlertCircle,
  User,
  UserX,
  FolderKanban,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Project, TaskStatus, PriorityLevel, AssigneeRef, Milestone } from '@/types';
import { projectApi } from '@/services/projectApi';
import { aiApi, TeamMemberRecommendation } from '@/services/aiApi';
import { useAuth } from '@/context/AuthContext';
import { getAvatarUrl } from '@/lib/avatar';

// Roles that are permitted to assign tasks to team members
const TASK_ASSIGNER_ROLES = ['Super Admin', 'Admin', 'Project Manager', 'Team Lead'];

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
  initialProjectId?: string;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onTaskCreated,
  initialProjectId,
}) => {
  const { user } = useAuth();
  const canAssign = user ? TASK_ASSIGNER_ROLES.includes(user.role) : false;

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    projectId: '',
    description: '',
    status: 'Todo' as TaskStatus,
    priority: 'Medium' as PriorityLevel,
    dueDate: new Date().toISOString().split('T')[0],
    tagsStr: 'Backend, Feature',
  });

  // Milestone state
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [milestoneId, setMilestoneId] = useState<string>('');

  // Assign To state — separate from formData for clarity
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [assigneeRef, setAssigneeRef] = useState<AssigneeRef | null>(null);
  const [eligibleAssignees, setEligibleAssignees] = useState<AssigneeRef[]>([]);
  const [isLoadingAssignees, setIsLoadingAssignees] = useState(false);

  // Smart Team Matcher recommendation state
  const [recommendation, setRecommendation] = useState<TeamMemberRecommendation | null>(null);
  const [isLoadingRec, setIsLoadingRec] = useState(false);
  const [recApplied, setRecApplied] = useState(false);

  // Prevent underlying body scrolling while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Load projects when modal opens
  useEffect(() => {
    if (!isOpen) return;

    setFormError(null);
    setIsLoadingProjects(true);
    setAssigneeId('');
    setAssigneeRef(null);
    setEligibleAssignees([]);
    setRecommendation(null);
    setRecApplied(false);

    projectApi
      .getProjects()
      .then((loadedProjects) => {
        setProjects(loadedProjects || []);
        setIsLoadingProjects(false);

        if (loadedProjects && loadedProjects.length > 0) {
          const matched = initialProjectId
            ? loadedProjects.find((p) => p.id === initialProjectId)
            : null;
          const targetProject = matched || loadedProjects[0];
          setFormData((prev) => ({ ...prev, projectId: targetProject.id }));
        }
      })
      .catch((err) => {
        console.error('Failed to load projects for Create Task', err);
        setIsLoadingProjects(false);
      });
  }, [isOpen, initialProjectId]);

  // Load eligible assignees and Smart Team Matcher recommendation when project changes
  const loadAssigneesAndRec = useCallback(
    async (projectId: string) => {
      if (!projectId || !canAssign) return;

      setIsLoadingAssignees(true);
      setAssigneeId('');
      setAssigneeRef(null);
      setRecommendation(null);
      setRecApplied(false);

      // Load project milestones for selected project
      projectApi
        .getMilestones(projectId)
        .then((msList) => setMilestones(msList || []))
        .catch((err) => {
          console.warn('Could not load project milestones', err);
          setMilestones([]);
        });

      try {
        const assignees = await projectApi.getEligibleAssignees(projectId);
        setEligibleAssignees(assignees);

        if (assignees.length === 0) {
          setRecommendation(null);
          return;
        }

        // Fetch task assignee recommendations strictly for project team members
        setIsLoadingRec(true);
        try {
          const taskRecs = await aiApi.getTaskAssigneeRecommendations(projectId, formData.tagsStr);
          const validRecs = (taskRecs || []).filter((rec) =>
            assignees.some((m) => m.id === rec.memberId || m.email === rec.email)
          );
          if (validRecs.length > 0) {
            setRecommendation(validRecs[0]);
          } else {
            setRecommendation(null);
          }
        } catch (err) {
          console.warn('Could not fetch task recommendation', err);
          setRecommendation(null);
        } finally {
          setIsLoadingRec(false);
        }
      } catch (err) {
        console.error('Failed to load eligible assignees', err);
        setEligibleAssignees([]);
        setRecommendation(null);
      } finally {
        setIsLoadingAssignees(false);
      }
    },
    [canAssign, formData.tagsStr]
  );

  useEffect(() => {
    if (formData.projectId) {
      loadAssigneesAndRec(formData.projectId);
    }
  }, [formData.projectId, loadAssigneesAndRec]);

  // Handle manual "Assign To" dropdown change
  const handleAssigneeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setAssigneeId(selectedId);
    setRecApplied(false);
    if (selectedId === '' || selectedId === 'unassigned') {
      setAssigneeRef(null);
    } else {
      const member = eligibleAssignees.find((m) => m.id === selectedId);
      setAssigneeRef(member || null);
    }
  };

  // Apply the AI recommendation to the Assign To field
  const handleUseRecommendation = () => {
    if (!recommendation) return;
    // Find the recommendation in the eligible list
    const match = eligibleAssignees.find(
      (m) => m.id === recommendation.memberId || m.email === recommendation.email
    );
    if (match) {
      setAssigneeId(match.id);
      setAssigneeRef(match);
      setRecApplied(true);
    } else {
      // Recommendation member is not in the project's eligible list — inform the user
      setFormError(
        `AI recommendation (${recommendation.name}) is not a member of this project. Please select manually.`
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.title.trim()) {
      setFormError('Please enter a task title.');
      return;
    }
    if (!formData.projectId) {
      setFormError('Please select a valid project.');
      return;
    }
    if (!formData.description.trim()) {
      setFormError('Please enter a task description.');
      return;
    }
    if (!formData.dueDate) {
      setFormError('Please select a valid due date.');
      return;
    }

    const selectedProject = projects.find((p) => p.id === formData.projectId);
    if (!selectedProject) {
      setFormError('Selected project is no longer available.');
      return;
    }

    try {
      const tags = formData.tagsStr
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      // Build the assignee payload:
      // - If a valid assignee was selected, use their data.
      // - Otherwise send an 'unassigned' placeholder; backend will persist it as such.
      const assigneePayload: AssigneeRef = assigneeRef ?? {
        id: 'unassigned',
        name: 'Unassigned',
        email: 'unassigned@devflow.io',
        role: 'Unassigned',
        avatar: '',
      };

      await projectApi.createTask({
        title: formData.title.trim(),
        projectId: selectedProject.id,
        projectName: selectedProject.name,
        description: formData.description.trim(),
        status: formData.status,
        priority: formData.priority,
        dueDate: formData.dueDate,
        milestoneId,
        tags,
        assignee: assigneePayload as any,
        subtasks: [],
      });

      onTaskCreated();
      onClose();

      // Reset form
      setFormData({
        title: '',
        projectId: projects[0]?.id || '',
        description: '',
        status: 'Todo',
        priority: 'Medium',
        dueDate: new Date().toISOString().split('T')[0],
        tagsStr: 'Backend, Feature',
      });
      setMilestoneId('');
      setAssigneeId('');
      setAssigneeRef(null);
      setRecApplied(false);
    } catch (err: any) {
      setFormError(
        err.response?.data?.error || err.message || 'Failed to create task. Please try again.'
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3.5 sm:p-4 overflow-y-auto devflow-backdrop-enter">
      <div className="relative w-full max-w-md max-h-[88dvh] sm:max-h-[90vh] flex flex-col rounded-2xl bg-[#0b0f19] border border-slate-800 p-4 sm:p-6 text-white shadow-2xl z-10 devflow-modal-enter">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
          <h3 className="text-base font-bold">Create New Task</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Creator info banner */}
        {user && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-700/50 text-[11px] text-slate-400 shrink-0">
            <User className="size-3.5 text-slate-500 shrink-0" />
            <span>
              Creating as{' '}
              <span className="text-white font-semibold">{user.name}</span>
              {' '}
              <span className="text-sky-400">({user.role})</span>
            </span>
          </div>
        )}

        {formError && (
          <div className="mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 shrink-0">
            <AlertCircle className="size-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 overflow-hidden mt-3">
          <div className="overflow-y-auto pr-1 space-y-3.5 text-xs">
            {/* Task Title */}
            <div>
              <label className="block text-slate-400 mb-1">
                Task Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                placeholder="e.g. Implement OAuth2 flow"
              />
            </div>

            {/* Project Dropdown */}
            <div>
              <label className="block text-slate-400 mb-1">
                Project <span className="text-rose-400">*</span>
              </label>
              {isLoadingProjects ? (
                <div className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-slate-500 text-xs flex items-center gap-2">
                  <Loader2 className="size-3.5 animate-spin" />
                  Loading projects...
                </div>
              ) : projects.length > 0 ? (
                <select
                  required
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500 text-xs cursor-pointer"
                >
                  {projects.map((prj) => (
                    <option key={prj.id} value={prj.id} className="bg-[#0b0f19] text-white">
                      {prj.name} ({prj.clientName})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 rounded-lg bg-[#060913] border border-amber-500/30 text-amber-400 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FolderKanban className="size-4 shrink-0" />
                    <span>No projects available.</span>
                  </div>
                  <Link href="/projects" className="text-sky-400 underline hover:text-sky-300 font-semibold">
                    Create Project
                  </Link>
                </div>
              )}
            </div>

            {/* Milestone Dropdown */}
            {formData.projectId && (
              <div>
                <label className="block text-slate-400 mb-1">
                  Milestone <span className="text-[10px] text-slate-500">(Optional)</span>
                </label>
                <select
                  value={milestoneId}
                  onChange={(e) => setMilestoneId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500 text-xs cursor-pointer font-medium"
                >
                  <option value="" className="bg-[#0b0f19] text-slate-400">
                    No Milestone (Unassigned)
                  </option>
                  {milestones.map((m) => (
                    <option key={m.id} value={m.id} className="bg-[#0b0f19] text-white">
                      {m.title} ({m.status})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-slate-400 mb-1">
                Description <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={2}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                placeholder="Task details & acceptance criteria..."
              />
            </div>

            {/* Status & Priority */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">
                  Status <span className="text-rose-400">*</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                  className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500 text-xs cursor-pointer"
                >
                  <option value="Todo">Todo</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Review">Review</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">
                  Priority <span className="text-rose-400">*</span>
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as PriorityLevel })}
                  className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500 text-xs cursor-pointer"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-slate-400 mb-1">
                Due Date <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500 text-xs"
              />
            </div>

            {/* ─── Assign To Section ─────────────────────────────────────────── */}
            {canAssign && (
              <div className="space-y-2">
                {/* Assign To label + dropdown */}
                <div>
                  <label className="block text-slate-400 mb-1">
                    Assign To{' '}
                    <span className="text-[10px] text-slate-500 font-normal ml-1">
                      (Project Team Members)
                    </span>
                  </label>

                  {isLoadingAssignees ? (
                    <div className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-slate-500 text-xs flex items-center gap-2">
                      <Loader2 className="size-3.5 animate-spin text-sky-400" />
                      Loading team members...
                    </div>
                  ) : eligibleAssignees.length > 0 ? (
                    <select
                      value={assigneeId}
                      onChange={handleAssigneeChange}
                      className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500 text-xs cursor-pointer font-semibold"
                    >
                      <option value="unassigned" className="bg-[#0b0f19] text-amber-400 font-semibold">
                        Unassigned
                      </option>

                      {(() => {
                        const devs = eligibleAssignees.filter((m) =>
                          (m.role || '').toLowerCase().includes('developer') || (m.role || '').toLowerCase().includes('engineer')
                        );
                        const qas = eligibleAssignees.filter((m) =>
                          (m.role || '').toLowerCase().includes('qa') || (m.role || '').toLowerCase().includes('tester')
                        );
                        const des = eligibleAssignees.filter((m) =>
                          (m.role || '').toLowerCase().includes('designer') || (m.role || '').toLowerCase().includes('ui') || (m.role || '').toLowerCase().includes('ux')
                        );
                        const oth = eligibleAssignees.filter(
                          (m) => !devs.includes(m) && !qas.includes(m) && !des.includes(m)
                        );

                        return (
                          <>
                            {devs.length > 0 && (
                              <optgroup label="Developers">
                                {devs.map((m) => (
                                  <option key={m.id} value={m.id} className="bg-[#0b0f19] text-white">
                                    {m.name} · {m.role}
                                    {m.workloadPercent !== undefined ? ` (${m.workloadPercent}% workload)` : ''}
                                  </option>
                                ))}
                              </optgroup>
                            )}

                            {qas.length > 0 && (
                              <optgroup label="QA Engineers">
                                {qas.map((m) => (
                                  <option key={m.id} value={m.id} className="bg-[#0b0f19] text-white">
                                    {m.name} · {m.role}
                                    {m.workloadPercent !== undefined ? ` (${m.workloadPercent}% workload)` : ''}
                                  </option>
                                ))}
                              </optgroup>
                            )}

                            {des.length > 0 && (
                              <optgroup label="Designers">
                                {des.map((m) => (
                                  <option key={m.id} value={m.id} className="bg-[#0b0f19] text-white">
                                    {m.name} · {m.role}
                                    {m.workloadPercent !== undefined ? ` (${m.workloadPercent}% workload)` : ''}
                                  </option>
                                ))}
                              </optgroup>
                            )}

                            {oth.length > 0 && (
                              <optgroup label="Team Leads & Management">
                                {oth.map((m) => (
                                  <option key={m.id} value={m.id} className="bg-[#0b0f19] text-white">
                                    {m.name} · {m.role}
                                    {m.workloadPercent !== undefined ? ` (${m.workloadPercent}% workload)` : ''}
                                  </option>
                                ))}
                              </optgroup>
                            )}
                          </>
                        );
                      })()}
                    </select>
                  ) : formData.projectId ? (
                    <div className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-700 text-slate-500 text-xs">
                      No eligible team members found for this project.
                    </div>
                  ) : (
                    <select
                      disabled
                      className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-slate-400 text-xs cursor-not-allowed"
                    >
                      <option>Select a project first</option>
                    </select>
                  )}
                </div>

                {/* Smart Team Matcher Recommendation */}
                {formData.projectId && (
                  <div
                    className={`rounded-lg border transition-colors ${
                      recApplied
                        ? 'bg-emerald-500/10 border-emerald-500/40'
                        : 'bg-purple-950/20 border-purple-500/30'
                    } p-3 space-y-2`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="size-3.5 text-purple-400 shrink-0" />
                      <span className="text-[11px] font-bold text-purple-300">
                        AI Recommended Assignee
                      </span>
                      {isLoadingRec && (
                        <Loader2 className="size-3 animate-spin text-purple-400 ml-auto" />
                      )}
                    </div>

                    {isLoadingRec ? (
                      <p className="text-[10px] text-slate-500">Analyzing team fit & workload...</p>
                    ) : recommendation ? (
                      <>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={getAvatarUrl(recommendation.avatar, recommendation)}
                              alt={recommendation.name}
                              className="size-6.5 rounded-full object-cover shrink-0 border border-slate-700"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white leading-tight truncate">
                                AI Recommendation: {recommendation.name} —{' '}
                                <strong className="text-emerald-400">{recommendation.matchScore}% match</strong>
                              </p>
                              <p className="text-[10px] text-slate-300 font-mono">
                                {(recommendation.matchingSkills && recommendation.matchingSkills.length > 0
                                  ? recommendation.matchingSkills.join(' • ')
                                  : recommendation.skills.slice(0, 3).join(' • '))}{' '}
                                | Workload: {recommendation.workloadPercent}%
                              </p>
                            </div>
                          </div>

                          {recApplied ? (
                            <div className="flex items-center gap-1 text-emerald-400 text-[10px] font-bold shrink-0">
                              <CheckCircle2 className="size-3.5" />
                              Applied
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={handleUseRecommendation}
                              className="px-2 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-bold transition-colors shrink-0 shadow-sm"
                            >
                              Assign
                            </button>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="text-[10px] text-slate-500">
                        No suitable project team member found.
                      </p>
                    )}
                  </div>
                )}

                {/* Selected Assignee confirmation badge */}
                <div className="p-2.5 rounded-lg bg-[#060913] border border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-semibold">Assigned To:</span>
                  {assigneeRef ? (
                    <div className="flex items-center gap-2">
                      <img
                        src={getAvatarUrl(assigneeRef.avatar, assigneeRef)}
                        alt={assigneeRef.name}
                        className="size-5 rounded-full object-cover shrink-0 border border-slate-700"
                      />
                      <div className="text-right">
                        <span className="text-xs font-semibold text-white block leading-tight">
                          {assigneeRef.name}
                        </span>
                        <span className="text-[10px] text-sky-400 font-medium block">
                          {assigneeRef.role}
                          {assigneeRef.workloadPercent !== undefined && (
                            <span className="text-slate-500 ml-1">
                              · {assigneeRef.workloadPercent}% workload
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                      <UserX className="size-3.5 text-amber-400" />
                      <span className="text-amber-400 font-semibold text-xs">Unassigned</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tags */}
            <div>
              <label className="block text-slate-400 mb-1">Tags (comma separated)</label>
              <input
                type="text"
                value={formData.tagsStr}
                onChange={(e) => setFormData({ ...formData, tagsStr: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500 font-mono text-xs"
                placeholder="Security, Backend"
              />
            </div>
          </div>

          {/* Buttons */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2 shrink-0 mt-3">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="text-slate-400 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={projects.length === 0}
                className="bg-sky-600 hover:bg-sky-500 text-white text-xs disabled:opacity-50"
              >
                Save Task
              </Button>
            </div>
          </form>
        </div>
      </div>
  );
};

