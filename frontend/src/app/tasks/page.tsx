'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Grid,
  List,
  Search,
  Clock,
  MessageSquare,
  X,
  CheckCircle2,
  Trash2,
  Pencil,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { mockTasks, mockProjects } from '@/lib/mockData';
import { Task, TaskStatus, PriorityLevel, TeamMember } from '@/types';
import { projectApi } from '@/services/projectApi';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { ConfirmModal } from '@/components/ui/confirm-modal';

import { CreateTaskModal } from '@/components/tasks/CreateTaskModal';
import { EditTaskModal } from '@/components/tasks/EditTaskModal';
import { CountUpNumber, AnimatedProgressBar } from '@/components/common/DataAnimation';
import { getAvatarUrl } from '@/lib/avatar';

export default function TasksPage() {
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
  const canCreateTask = ['Super Admin', 'Admin', 'Project Manager', 'Team Lead', 'Project Coordinator'].includes(role);
  const canEditTask = ['Super Admin', 'Admin', 'Project Manager', 'Team Lead', 'Project Coordinator'].includes(role);
  const canDeleteTask = ['Super Admin', 'Admin', 'Project Manager'].includes(role);
  const canUpdateAssignedTask = ['Developer', 'Designer', 'QA'].includes(role);
  const isClient = role === 'Client';

  const isTaskAssignedToUser = (task: Task) => {
    if (!user) return true;
    return (
      task.assignee?.name === user.name ||
      task.assignee?.email === user.email ||
      task.assignee?.id === user.id ||
      task.assignee?.id === (user as any)._id
    );
  };

  const canToggleSubtaskForTask = (task: Task) => {
    if (isClient) return false;
    if (canEditTask) return true;
    if (canUpdateAssignedTask && isTaskAssignedToUser(task)) return true;
    return false;
  };

  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [initialProjectId, setInitialProjectId] = useState<string | undefined>(undefined);

  // Drag and Drop State
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const columns: TaskStatus[] = ['Todo', 'In Progress', 'Review', 'Completed'];

  const canDragTask = (task: Task) => {
    const userRole = user?.role || 'Admin';

    // Clients are view-only
    if (userRole === 'Client') return false;

    // Admin & Super Admin have full control
    if (userRole === 'Super Admin' || userRole === 'Admin') return true;

    // Team Leads & Project Managers manage project task statuses
    if (userRole === 'Project Manager' || userRole === 'Team Lead') return true;

    // Developers can change status only for their assigned tasks; QA can update tasks they are responsible for; Project Coordinators require explicit assignment
    if (['Developer', 'QA', 'Designer', 'Project Coordinator'].includes(userRole)) {
      return isTaskAssignedToUser(task);
    }

    return false;
  };

  const loadTasks = () => {
    projectApi
      .getTasks()
      .then((data) => {
        if (data && data.length > 0) {
          setTasks(data);

          if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const targetTaskId = params.get('taskId');
            if (targetTaskId) {
              const matchedTask = data.find((t) => t.id === targetTaskId || (t as any)._id === targetTaskId);
              if (matchedTask) {
                setEditingTask(matchedTask);
                setIsModalOpen(false);
              }
            }
          }
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadTasks();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const targetTaskId = params.get('taskId');
      const action = params.get('action');
      const isCreateParam = params.get('createTask') === 'true' || action === 'create';
      const prjId = params.get('projectId');

      if (targetTaskId) {
        setIsModalOpen(false);
        const existing = tasks.find((t) => t.id === targetTaskId || (t as any)._id === targetTaskId);
        if (existing) {
          setEditingTask(existing);
        }
      } else if (isCreateParam) {
        if (prjId) setInitialProjectId(prjId);
        setEditingTask(null);
        setIsModalOpen(true);
      }
    }
  }, []);

  // --- DRAG AND DROP HANDLERS ---
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    if (!canDragTask(task)) {
      e.preventDefault();
      return;
    }
    setDraggedTask(task);
    try {
      e.dataTransfer.setData('text/plain', task.id);
      e.dataTransfer.setData('taskId', task.id);
      e.dataTransfer.effectAllowed = 'move';
    } catch (err) {
      console.warn('dataTransfer setData error:', err);
    }
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== status) {
      setDragOverColumn(status);
    }
  };

  const handleDragLeave = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    if (dragOverColumn === status) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverColumn(null);
    setErrorMessage(null);

    let droppedTaskId = '';
    try {
      droppedTaskId = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('taskId');
    } catch (err) {
      console.warn('dataTransfer getData error:', err);
    }

    const taskToMove = (droppedTaskId ? tasks.find((t) => t.id === droppedTaskId) : null) || draggedTask;
    setDraggedTask(null);

    if (!taskToMove || taskToMove.status === targetStatus) return;

    const previousTasks = [...tasks];
    const taskId = taskToMove.id;

    // 1. Immediate Optimistic UI Update & Column Task Count Refresh
    setTasks((prevTasks) =>
      prevTasks.map((t) => (t.id === taskId ? { ...t, status: targetStatus } : t))
    );

    // 2. Persist new status to backend/database
    try {
      await projectApi.updateTask(taskId, { status: targetStatus });
    } catch (err: any) {
      console.error('Failed to persist task status update:', err);
      // Revert card to previous column on failed update
      setTasks(previousTasks);
      const errText = err.response?.data?.error || err.message || 'Failed to update task status';
      setErrorMessage(`Could not move task "${taskToMove.title}". Reverted to "${taskToMove.status}". (${errText})`);
    }
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const handleToggleSubtask = async (taskId: string, subtaskId: string, currentCompleted: boolean) => {
    try {
      await projectApi.updateSubtask(taskId, subtaskId, !currentCompleted);
      loadTasks();
    } catch (err) {
      console.error('Failed to toggle subtask', err);
    }
  };

  const handleDeleteTask = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Task',
      message: 'Are you sure you want to delete this task?',
      confirmText: 'Delete Task',
      confirmVariant: 'danger',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, loading: true }));
        try {
          await projectApi.deleteTask(id);
          addToast({
            type: 'success',
            title: 'Task Deleted',
            message: 'Task has been deleted successfully.',
          });
          loadTasks();
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

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.projectName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Error Notification Banner */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-center justify-between shadow-lg animate-fadeIn">
            <div className="flex items-center gap-2">
              <X className="size-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-white text-xs font-semibold underline"
            >
              Dismiss
            </button>
          </div>
        )}
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Tasks & Subtasks
            </h1>
            <p className="text-xs text-slate-400">
              Manage work packages, subtask checklists, priority tags, and team assignments.
            </p>
          </div>
          {canCreateTask && (
            <Button
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="bg-sky-600 hover:bg-sky-500 text-white text-xs gap-1.5 shadow-md shadow-sky-600/20"
            >
              <Plus className="size-4" />
              <span>Create Task</span>
            </Button>
          )}
        </div>

        {/* Create Task Modal */}
        {/* Create Task Modal */}
        <CreateTaskModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onTaskCreated={loadTasks}
          initialProjectId={initialProjectId}
        />

        {/* Edit & Assign Task Modal */}
        <EditTaskModal
          isOpen={!!editingTask}
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onTaskUpdated={loadTasks}
        />

        {/* Filter Bar */}
        <div className="p-4 rounded-xl bg-[#0b0f19] border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto flex-1">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                type="text"
                placeholder="Filter tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-9 pl-9 pr-4 text-xs bg-[#060913] border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 text-xs bg-[#060913] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="All">All Statuses</option>
              <option value="Todo">Todo</option>
              <option value="In Progress">In Progress</option>
              <option value="Review">Review</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div className="flex items-center gap-1 border border-slate-800 bg-[#060913] p-1 rounded-lg">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded ${viewMode === 'kanban' ? 'bg-slate-800 text-sky-400' : 'text-slate-400'}`}
            >
              <Grid className="size-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-slate-800 text-sky-400' : 'text-slate-400'}`}
            >
              <List className="size-4" />
            </button>
          </div>
        </div>

        {/* Kanban View */}
        {viewMode === 'kanban' ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
            {columns.map((colStatus) => {
              const colTasks = filteredTasks.filter((t) => t.status === colStatus);
              const isOver = dragOverColumn === colStatus;

              return (
                <div
                  key={colStatus}
                  onDragOver={(e) => handleDragOver(e, colStatus)}
                  onDragLeave={(e) => handleDragLeave(e, colStatus)}
                  onDrop={(e) => handleDrop(e, colStatus)}
                  className={`p-4 rounded-2xl bg-[#0b0f19] border transition-all duration-200 space-y-3 min-h-[420px] ${
                    isOver
                      ? 'border-2 border-dashed border-sky-400 bg-sky-950/20 shadow-lg shadow-sky-500/10'
                      : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <span
                        className={`size-2 rounded-full ${
                          colStatus === 'Completed'
                            ? 'bg-emerald-400'
                            : colStatus === 'In Progress'
                            ? 'bg-sky-400'
                            : colStatus === 'Review'
                            ? 'bg-purple-400'
                            : 'bg-amber-400'
                        }`}
                      />
                      {colStatus}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-900 text-slate-300">
                      {colTasks.length}
                    </span>
                  </div>

                  <div
                    onDragOver={(e) => handleDragOver(e, colStatus)}
                    onDrop={(e) => handleDrop(e, colStatus)}
                    className="space-y-3 min-h-[350px]"
                  >
                    {/* Visual Drop Indicator Placeholder */}
                    {isOver && draggedTask?.status !== colStatus && (
                      <div className="p-3 rounded-xl border-2 border-dashed border-sky-400/60 bg-sky-500/10 text-sky-300 text-xs font-semibold text-center flex items-center justify-center gap-1.5 animate-pulse">
                        <span className="size-2 rounded-full bg-sky-400 animate-ping" />
                        <span>Move task to {colStatus}</span>
                      </div>
                    )}

                    {colTasks.map((task) => {
                      const isDraggable = canDragTask(task);
                      const isDraggingThis = draggedTask?.id === task.id;

                      return (
                        <div
                          key={task.id}
                          draggable={isDraggable}
                          onDragStart={(e) => handleDragStart(e, task)}
                          onDragEnd={handleDragEnd}
                          className={`p-4 rounded-xl bg-[#060913] border transition-all space-y-3 ${
                            isDraggable ? 'cursor-grab active:cursor-grabbing hover:border-sky-500/40' : 'cursor-default'
                          } ${
                            isDraggingThis
                              ? 'opacity-40 scale-[0.98] border-sky-500 shadow-md shadow-sky-500/20'
                              : 'border-slate-800'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-[10px] font-semibold text-sky-400 uppercase tracking-wider block">
                                {task.projectName}
                              </span>
                              <div className="flex items-center gap-1">
                                {canEditTask && (
                                  <button
                                    onClick={() => setEditingTask(task)}
                                    className="text-slate-500 hover:text-sky-400 p-0.5 transition-colors"
                                    title="Edit & Assign Task"
                                  >
                                    <Pencil className="size-3.5" />
                                  </button>
                                )}
                                {canDeleteTask && (
                                  <button
                                    onClick={() => handleDeleteTask(task.id)}
                                    className="text-slate-500 hover:text-rose-400 p-0.5 transition-colors"
                                    title="Delete Task"
                                  >
                                    <Trash2 className="size-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <h4
                              onClick={() => canEditTask && setEditingTask(task)}
                              className="text-xs font-bold text-white hover:text-sky-400 cursor-pointer transition-colors"
                            >
                              {task.title}
                            </h4>
                            <p className="text-[11px] text-slate-400 line-clamp-2">{task.description}</p>
                          </div>

                          {/* Subtasks checklist */}
                          {Array.isArray(task.subtasks) && task.subtasks.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              <div className="flex items-center justify-between text-[10px] text-slate-400">
                                <span>Subtasks</span>
                                <span>
                                  {task.subtasks.filter((st) => st.completed).length}/{task.subtasks.length}
                                </span>
                              </div>
                              <AnimatedProgressBar
                                percentage={Math.round((task.subtasks.filter((st) => st.completed).length / task.subtasks.length) * 100)}
                                className="bg-emerald-400 h-full rounded-full"
                                trackClassName="w-full bg-[#0b0f19] rounded-full h-1 overflow-hidden border border-slate-800"
                              />
                              <div className="space-y-1">
                                {task.subtasks.map((st) => {
                                  const canToggle = canToggleSubtaskForTask(task);
                                  return (
                                    <button
                                      key={st.id}
                                      disabled={!canToggle}
                                      onClick={() => canToggle && handleToggleSubtask(task.id, st.id, st.completed)}
                                      className={`flex items-center gap-1.5 text-[10px] w-full text-left ${
                                        canToggle ? 'text-slate-300 hover:text-white cursor-pointer' : 'text-slate-400 opacity-70 cursor-default'
                                      }`}
                                    >
                                      <CheckCircle2
                                        className={`size-3 ${st.completed ? 'text-emerald-400' : 'text-slate-600'}`}
                                      />
                                      <span className={st.completed ? 'line-through text-slate-500' : ''}>
                                        {st.title}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Footer */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock className="size-3 text-slate-500" />
                              {task.dueDate}
                            </span>

                            <div className="flex items-center gap-2">
                              <span className="flex items-center gap-1 text-slate-500">
                                <MessageSquare className="size-3" />
                                {task.commentsCount || 0}
                              </span>
                              {task.assignee?.id && task.assignee.id !== 'unassigned' ? (
                                <div
                                  className="flex items-center gap-1.5"
                                  title={`Assigned to: ${task.assignee.name} (${task.assignee.role})`}
                                >
                                  <img
                                    src={getAvatarUrl(task.assignee?.avatar, task.assignee)}
                                    alt={task.assignee.name}
                                    className="size-5 rounded-full object-cover"
                                  />
                                  <span className="text-[10px] text-slate-300 font-medium">
                                    {task.assignee.name}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-amber-500/80 font-semibold px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                                  Unassigned
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="rounded-2xl bg-[#0b0f19] border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#060913] border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
                <tr>
                  <th className="py-3 px-4">Task Title</th>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Assigned To</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredTasks.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                    <td
                      onClick={() => canEditTask && setEditingTask(t)}
                      className="py-3.5 px-4 font-bold text-white hover:text-sky-400 cursor-pointer"
                    >
                      {t.title}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{t.projectName}</td>
                    <td className="py-3.5 px-4 flex items-center gap-2">
                      {t.assignee?.id && t.assignee.id !== 'unassigned' ? (
                        <>
                          <img src={getAvatarUrl(t.assignee?.avatar, t.assignee)} alt="" className="size-5 rounded-full object-cover" />
                          <div>
                            <span className="block font-medium text-slate-200">{t.assignee.name}</span>
                            <span className="text-[10px] text-sky-400">{t.assignee.role}</span>
                          </div>
                        </>
                      ) : (
                        <span className="text-[10px] text-amber-500/80 font-semibold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-amber-400">{t.priority}</td>
                    <td className="py-3.5 px-4 font-mono">{t.dueDate}</td>
                    <td className="py-3.5 px-4 text-right flex items-center justify-end gap-1">
                      {canEditTask && (
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => setEditingTask(t)}
                          className="text-xs text-sky-400 hover:text-sky-300 p-1"
                          title="Edit & Assign Task"
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                      )}
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
