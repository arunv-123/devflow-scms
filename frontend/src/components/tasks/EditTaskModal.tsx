'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  AlertCircle,
  User,
  UserX,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Calendar,
  Tag,
  ShieldCheck,
  Eye,
  Clock,
  Flag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Task, TaskStatus, PriorityLevel, AssigneeRef, Milestone } from '@/types';
import { projectApi } from '@/services/projectApi';
import { aiApi, TeamMemberRecommendation } from '@/services/aiApi';
import { useAuth } from '@/context/AuthContext';
import { getAvatarUrl } from '@/lib/avatar';

interface EditTaskModalProps {
  isOpen: boolean;
  task: Task | null;
  onClose: () => void;
  onTaskUpdated: () => void;
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({
  isOpen,
  task,
  onClose,
  onTaskUpdated,
}) => {
  const { user } = useAuth();
  const userRole = user?.role || 'Admin';

  const canEditFullTask = ['Super Admin', 'Admin', 'Project Manager', 'Team Lead'].includes(userRole);
  const canAssign = canEditFullTask;
  const isClient = userRole === 'Client';

  const isTaskAssigned = task && user
    ? (task.assignee?.name === user.name ||
       task.assignee?.email === user.email ||
       task.assignee?.id === user.id ||
       task.assignee?.id === (user as any)._id)
    : false;

  const canUpdateStatus = canEditFullTask || (!isClient && isTaskAssigned);

  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('Todo');
  const [priority, setPriority] = useState<PriorityLevel>('Medium');
  const [dueDate, setDueDate] = useState('');
  const [tagsStr, setTagsStr] = useState('');

  // Milestone state
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [milestoneId, setMilestoneId] = useState<string>('');

  // Assignee states
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [assigneeRef, setAssigneeRef] = useState<AssigneeRef | null>(null);
  const [eligibleAssignees, setEligibleAssignees] = useState<AssigneeRef[]>([]);
  const [isLoadingAssignees, setIsLoadingAssignees] = useState(false);

  // AI Recommendation states
  const [recommendation, setRecommendation] = useState<TeamMemberRecommendation | null>(null);
  const [isLoadingRec, setIsLoadingRec] = useState(false);
  const [recApplied, setRecApplied] = useState(false);

  // Lock scrolling when modal is open
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

  // Load task values when modal opens
  useEffect(() => {
    if (!isOpen || !task) return;

    setFormError(null);
    setTitle(task.title || '');
    setDescription(task.description || '');
    setStatus(task.status || 'Todo');
    setPriority(task.priority || 'Medium');
    setDueDate(task.dueDate || new Date().toISOString().split('T')[0]);
    setTagsStr(task.tags ? task.tags.join(', ') : '');
    setMilestoneId(task.milestoneId || '');

    const currentAssignee = task.assignee;
    if (currentAssignee && currentAssignee.id && currentAssignee.id !== 'unassigned') {
      setAssigneeId(currentAssignee.id);
      setAssigneeRef(currentAssignee);
    } else {
      setAssigneeId('unassigned');
      setAssigneeRef(null);
    }

    setRecApplied(false);

    // Fetch milestones for task's project
    if (task.projectId) {
      projectApi
        .getMilestones(task.projectId)
        .then((mList) => setMilestones(mList || []))
        .catch(() => setMilestones([]));
    }

    // Fetch eligible project assignees if user has assign capability
    if (task.projectId && canAssign) {
      setIsLoadingAssignees(true);
      projectApi
        .getEligibleAssignees(task.projectId)
        .then((assignees) => {
          setEligibleAssignees(assignees || []);
          if (assignees && assignees.length > 0) {
            setIsLoadingRec(true);
            aiApi
              .getTeamRecommendations(task.projectId!)
              .then((res: any) => {
                if (res.recommendations && res.recommendations.length > 0) {
                  setRecommendation(res.recommendations[0]);
                } else {
                  setRecommendation(null);
                }
              })
              .catch(() => setRecommendation(null))
              .finally(() => setIsLoadingRec(false));
          }
        })
        .catch(() => {
          setEligibleAssignees([]);
          setRecommendation(null);
          setIsLoadingRec(false);
        })
        .finally(() => setIsLoadingAssignees(false));
    }
  }, [isOpen, task, canAssign]);

  const handleAssigneeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setAssigneeId(val);
    setRecApplied(false);

    if (val === '' || val === 'unassigned') {
      setAssigneeRef(null);
    } else {
      const match = eligibleAssignees.find((m) => m.id === val);
      setAssigneeRef(match || null);
    }
  };

  const handleUseRecommendation = () => {
    if (!recommendation) return;
    const match = eligibleAssignees.find(
      (m) => m.id === recommendation.memberId || m.email === recommendation.email
    );

    if (match) {
      setAssigneeId(match.id);
      setAssigneeRef(match);
      setRecApplied(true);
    } else {
      setFormError(
        `Recommended member (${recommendation.name}) is not currently assigned to this project team.`
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;
    setFormError(null);

    if (!canUpdateStatus) {
      onClose();
      return;
    }

    try {
      setIsSaving(true);

      if (canEditFullTask) {
        // Full update for Authorized Managers/Leads
        const tags = tagsStr
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);

        const assigneePayload: AssigneeRef = assigneeRef ?? {
          id: 'unassigned',
          name: 'Unassigned',
          email: 'unassigned@devflow.io',
          role: 'Unassigned',
          avatar: '',
        };

        await projectApi.updateTask(task.id, {
          title: title.trim(),
          description: description.trim(),
          status,
          priority,
          dueDate,
          tags,
          milestoneId,
          assignee: assigneePayload as any,
        });
      } else {
        // Restricted Status Update for assigned Developers/QA/Designers (Sends ONLY status!)
        await projectApi.updateTask(task.id, {
          status,
        });
      }

      onTaskUpdated();
      onClose();
    } catch (err: any) {
      setFormError(
        err.response?.data?.error || err.message || 'Failed to update task. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !task) return null;

  // Group eligible assignees by role for structured dropdown
  const developers = eligibleAssignees.filter((m) =>
    (m.role || '').toLowerCase().includes('developer') || (m.role || '').toLowerCase().includes('engineer')
  );
  const qas = eligibleAssignees.filter((m) =>
    (m.role || '').toLowerCase().includes('qa') || (m.role || '').toLowerCase().includes('tester')
  );
  const designers = eligibleAssignees.filter((m) =>
    (m.role || '').toLowerCase().includes('designer') || (m.role || '').toLowerCase().includes('ui') || (m.role || '').toLowerCase().includes('ux')
  );
  const others = eligibleAssignees.filter(
    (m) => !developers.includes(m) && !qas.includes(m) && !designers.includes(m)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3.5 sm:p-4 overflow-y-auto devflow-backdrop-enter">
      <div className="relative w-full max-w-lg max-h-[88dvh] sm:max-h-[90vh] flex flex-col rounded-2xl bg-[#0b0f19] border border-slate-800 p-4 sm:p-6 text-white shadow-2xl z-10 devflow-modal-enter">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">
                {canEditFullTask ? 'Edit & Assign Task' : 'Task Details'}
              </h3>
              {!canEditFullTask && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-sky-400 border border-slate-700 flex items-center gap-1">
                  <Eye className="size-3" />
                  {canUpdateStatus ? 'Status Update Mode' : 'Read-Only'}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Project: <span className="text-sky-400 font-semibold">{task.projectName}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="size-5" />
          </button>
        </div>

        {formError && (
          <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 shrink-0">
            <AlertCircle className="size-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 overflow-hidden mt-3">
          <div className="overflow-y-auto pr-1 space-y-3.5 text-xs">
            {/* Task Title */}
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Task Title</label>
              {canEditFullTask ? (
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500 font-semibold"
                  placeholder="Task title..."
                />
              ) : (
                <div className="p-3 rounded-xl bg-[#060913] border border-slate-800 text-white font-bold text-sm">
                  {task.title}
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Description</label>
              {canEditFullTask ? (
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                  placeholder="Task description..."
                />
              ) : (
                <div className="p-3 rounded-xl bg-[#060913] border border-slate-800 text-slate-300 text-xs leading-relaxed whitespace-pre-wrap">
                  {task.description || 'No description provided.'}
                </div>
              )}
            </div>

            {/* Status & Priority */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Status</label>
                {canUpdateStatus ? (
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                    className="w-full px-3 py-2 rounded-xl bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500 cursor-pointer font-semibold"
                  >
                    <option value="Todo">Todo</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Review">Review</option>
                    <option value="Completed">Completed</option>
                  </select>
                ) : (
                  <div className="p-2.5 rounded-xl bg-[#060913] border border-slate-800 font-bold text-xs text-sky-400">
                    {task.status}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Priority</label>
                {canEditFullTask ? (
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                    className="w-full px-3 py-2 rounded-xl bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500 cursor-pointer font-semibold"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                ) : (
                  <div className="p-2.5 rounded-xl bg-[#060913] border border-slate-800 flex items-center gap-1.5 font-bold text-xs">
                    <Flag className={`size-3.5 ${task.priority === 'Critical' ? 'text-red-400' : task.priority === 'High' ? 'text-amber-400' : 'text-sky-400'}`} />
                    <span>{task.priority}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Due Date & Tags */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Due Date</label>
                {canEditFullTask ? (
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                  />
                ) : (
                  <div className="p-2.5 rounded-xl bg-[#060913] border border-slate-800 text-slate-300 font-mono text-xs flex items-center gap-1.5">
                    <Clock className="size-3.5 text-slate-500" />
                    <span>{task.dueDate}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Tags</label>
                {canEditFullTask ? (
                  <input
                    type="text"
                    value={tagsStr}
                    onChange={(e) => setTagsStr(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500 font-mono text-xs"
                    placeholder="Backend, Auth"
                  />
                ) : (
                  <div className="p-2.5 rounded-xl bg-[#060913] border border-slate-800 text-slate-300 text-xs flex flex-wrap gap-1 min-h-[38px] items-center">
                    {task.tags && task.tags.length > 0 ? (
                      task.tags.map((t, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 text-sky-300 text-[10px] font-mono">
                          #{t}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500 text-[11px]">No tags</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Milestone Dropdown / Read-Only View */}
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Milestone</label>
              {canEditFullTask ? (
                <select
                  value={milestoneId}
                  onChange={(e) => setMilestoneId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500 cursor-pointer font-semibold"
                >
                  <option value="" className="bg-[#0b0f19] text-slate-400">
                    -- No Milestone --
                  </option>
                  {milestones.map((m) => (
                    <option key={m.id} value={m.id} className="bg-[#0b0f19] text-white">
                      {m.title} ({m.status})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-2.5 rounded-xl bg-[#060913] border border-slate-800 text-slate-300 text-xs">
                  {milestoneId ? (
                    <span className="font-semibold text-purple-300">
                      {milestones.find((m) => m.id === milestoneId)?.title || 'Assigned Milestone'}
                    </span>
                  ) : (
                    <span className="text-slate-500">Unlinked to milestone</span>
                  )}
                </div>
              )}
            </div>

            {/* ─── TASK ASSIGNEE SECTION ───────────────────────────────────── */}
            {canAssign ? (
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-bold block">
                    Assign To <span className="text-[10px] text-slate-400 font-normal">(Project Team Members)</span>
                  </label>
                </div>

                {/* Dropdown grouped by role */}
                {isLoadingAssignees ? (
                  <div className="w-full px-3 py-2 rounded-xl bg-[#060913] border border-slate-800 text-slate-400 flex items-center gap-2">
                    <Loader2 className="size-3.5 animate-spin text-sky-400" />
                    <span>Loading project team members...</span>
                  </div>
                ) : (
                  <select
                    value={assigneeId}
                    onChange={handleAssigneeChange}
                    className="w-full px-3 py-2 rounded-xl bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500 cursor-pointer font-semibold"
                  >
                    <option value="unassigned" className="bg-[#0b0f19] text-amber-400 font-semibold">
                      Unassigned
                    </option>

                    {developers.length > 0 && (
                      <optgroup label="Developers">
                        {developers.map((m) => (
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

                    {designers.length > 0 && (
                      <optgroup label="Designers">
                        {designers.map((m) => (
                          <option key={m.id} value={m.id} className="bg-[#0b0f19] text-white">
                            {m.name} · {m.role}
                            {m.workloadPercent !== undefined ? ` (${m.workloadPercent}% workload)` : ''}
                          </option>
                        ))}
                      </optgroup>
                    )}

                    {others.length > 0 && (
                      <optgroup label="Team Leads & Management">
                        {others.map((m) => (
                          <option key={m.id} value={m.id} className="bg-[#0b0f19] text-white">
                            {m.name} · {m.role}
                            {m.workloadPercent !== undefined ? ` (${m.workloadPercent}% workload)` : ''}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                )}

                {/* AI Recommended Assignee Suggestion Card */}
                <div
                  className={`rounded-xl border transition-colors p-3.5 space-y-2 ${
                    recApplied
                      ? 'bg-emerald-950/20 border-emerald-500/40'
                      : 'bg-purple-950/20 border-purple-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="size-3.5 text-purple-400 shrink-0" />
                      <span className="text-[11px] font-bold text-purple-300">
                        AI Recommended Assignee
                      </span>
                    </div>

                    {isLoadingRec && <Loader2 className="size-3 animate-spin text-purple-400" />}
                  </div>

                  {isLoadingRec ? (
                    <p className="text-[10px] text-slate-400">Evaluating project team skills & workload capacity...</p>
                  ) : recommendation ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={getAvatarUrl(recommendation.avatar, recommendation)}
                            alt={recommendation.name}
                            className="size-7 rounded-full object-cover ring-1 ring-purple-400/40"
                          />
                          <div>
                            <span className="text-xs font-bold text-white block">
                              AI Recommendation: {recommendation.name} —{' '}
                              <strong className="text-emerald-400">{recommendation.matchScore}% match</strong>
                            </span>
                            <span className="text-[10px] text-slate-300 font-mono block">
                              {(recommendation.matchingSkills && recommendation.matchingSkills.length > 0
                                ? recommendation.matchingSkills.join(' • ')
                                : recommendation.skills.slice(0, 3).join(' • '))}{' '}
                              | Workload: {recommendation.workloadPercent}%
                            </span>
                          </div>
                        </div>

                        {recApplied ? (
                          <span className="text-emerald-400 text-[10px] font-bold flex items-center gap-1 shrink-0">
                            <CheckCircle2 className="size-3.5" />
                            Applied
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleUseRecommendation}
                            className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-bold transition-colors shrink-0 shadow-sm"
                          >
                            Assign
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400">
                      No suitable project team member found.
                    </p>
                  )}
                </div>

                {/* Selected Assignee Badge Confirmation */}
                <div className="p-2.5 rounded-xl bg-[#060913] border border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400">Current Assignee:</span>
                  {assigneeRef ? (
                    <div className="flex items-center gap-2">
                      <img
                        src={getAvatarUrl(assigneeRef.avatar, assigneeRef)}
                        alt={assigneeRef.name}
                        className="size-6 rounded-full object-cover ring-1 ring-purple-500/30"
                      />
                      <div>
                        <span className="text-xs font-bold text-white block">{assigneeRef.name}</span>
                        <span className="text-[10px] text-sky-400 block">{assigneeRef.role}</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-amber-400 text-xs font-bold">Unassigned</span>
                  )}
                </div>
              </div>
            ) : (
              /* Read-only Assignee view for non-manager roles */
              <div className="p-3.5 rounded-xl bg-[#060913] border border-slate-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Assigned To:</span>
                {task.assignee && task.assignee.name && task.assignee.id !== 'unassigned' ? (
                  <div className="flex items-center gap-2">
                    <img
                      src={getAvatarUrl(task.assignee.avatar, task.assignee)}
                      alt={task.assignee.name}
                      className="size-6 rounded-full object-cover ring-1 ring-sky-500/30"
                    />
                    <div>
                      <span className="text-xs font-bold text-white block">{task.assignee.name}</span>
                      <span className="text-[10px] text-sky-400 block">{task.assignee.role}</span>
                    </div>
                  </div>
                ) : (
                  <span className="text-amber-400 text-xs font-bold">Unassigned</span>
                )}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2 shrink-0 mt-3">
            <Button type="button" variant="ghost" onClick={onClose} className="text-slate-400 text-xs">
              {canUpdateStatus ? 'Cancel' : 'Close'}
            </Button>
            {canUpdateStatus && (
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold disabled:opacity-50 gap-1.5"
              >
                {isSaving ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : canEditFullTask ? (
                  'Save Changes'
                ) : (
                  'Update Status'
                )}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
