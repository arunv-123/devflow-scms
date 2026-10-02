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

export default function TasksPage() {
  const { user } = useAuth();
  const role = user?.role || 'Admin';
  const canCreateTask = ['Super Admin', 'Admin', 'Project Manager', 'Team Lead'].includes(role);
  const canEditTask = ['Super Admin', 'Admin', 'Project Manager', 'Team Lead'].includes(role);
  const canDeleteTask = ['Super Admin', 'Admin', 'Project Manager'].includes(role);
  const canUpdateAssignedTask = ['Developer', 'Designer', 'QA'].includes(role);
  const isClient = role === 'Client';

  const isTaskAssignedToUser = (task: Task) => {
    if (!user) return false;
    return (
      task.assignee?.name === user.name ||
      task.assignee?.email === user.email ||
      task.assignee?.id === user.id
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

  const columns: TaskStatus[] = ['Todo', 'In Progress', 'Review', 'Completed'];

  const [formData, setFormData] = useState({
    title: '',
    projectName: 'FinTech Nexus Suite',
    projectId: 'prj-101',
    description: '',
    status: 'Todo' as TaskStatus,
    priority: 'Medium' as PriorityLevel,
    dueDate: new Date().toISOString().split('T')[0],
    tagsStr: 'Backend, Feature',
    assigneeName: 'Sarah Chen',
  });

  const loadTasks = () => {
    projectApi
      .getTasks()
      .then((data) => {
        if (data && data.length > 0) setTasks(data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.projectName || !formData.dueDate) return;
    try {
      const tags = formData.tagsStr
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const assignee: TeamMember = {
        id: 'tm-1',
        name: formData.assigneeName,
        email: 'sarah.c@devflow.io',
        role: 'Project Manager',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        skills: ['Agile', 'Scrum'],
        assignedProjects: ['FinTech Nexus Suite'],
        workloadPercent: 78,
        availability: 'Available',
        performanceRating: 4.9,
        joinedDate: '2023-01-15',
      };

      await projectApi.createTask({
        title: formData.title,
        projectName: formData.projectName,
        projectId: formData.projectId,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        dueDate: formData.dueDate,
        tags,
        assignee,
        subtasks: [],
      });

      setIsModalOpen(false);
      setFormData({
        title: '',
        projectName: 'FinTech Nexus Suite',
        projectId: 'prj-101',
        description: '',
        status: 'Todo',
        priority: 'Medium',
        dueDate: new Date().toISOString().split('T')[0],
        tagsStr: 'Backend, Feature',
        assigneeName: 'Sarah Chen',
      });
      loadTasks();
    } catch (err) {
      console.error('Failed to create task', err);
    }
  };

  const handleToggleSubtask = async (taskId: string, subtaskId: string, currentCompleted: boolean) => {
    try {
      await projectApi.updateSubtask(taskId, subtaskId, !currentCompleted);
      loadTasks();
    } catch (err) {
      console.error('Failed to toggle subtask', err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await projectApi.deleteTask(id);
      loadTasks();
    } catch (err) {
      console.error('Failed to delete task', err);
    }
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

        {/* Modal for Creating Task */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl bg-[#0b0f19] border border-slate-800 p-6 space-y-4 text-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold">Create New Task</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Task Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                    placeholder="e.g. Implement OAuth2 flow"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Project Name</label>
                  <input
                    type="text"
                    required
                    value={formData.projectName}
                    onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                    placeholder="e.g. FinTech Nexus Suite"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                    placeholder="Task details & acceptance criteria..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                      className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                    >
                      {columns.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as PriorityLevel })}
                      className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Due Date</label>
                    <input
                      type="date"
                      required
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full px-2 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500 text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Assignee</label>
                    <input
                      type="text"
                      value={formData.assigneeName}
                      onChange={(e) => setFormData({ ...formData, assigneeName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                      placeholder="e.g. Sarah Chen"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={formData.tagsStr}
                    onChange={(e) => setFormData({ ...formData, tagsStr: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                    placeholder="Security, Backend"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsModalOpen(false)}
                    className="text-slate-400 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-sky-600 hover:bg-sky-500 text-white text-xs">
                    Save Task
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

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
              return (
                <div key={colStatus} className="p-4 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <span
                        className={`size-2 rounded-full ${
                          colStatus === 'Completed'
                            ? 'bg-emerald-400'
                            : colStatus === 'In Progress'
                            ? 'bg-sky-400'
                            : 'bg-amber-400'
                        }`}
                      />
                      {colStatus}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-900 text-slate-300">
                      {colTasks.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {colTasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-4 rounded-xl bg-[#060913] border border-slate-800 hover:border-sky-500/30 transition-all space-y-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-[10px] font-semibold text-sky-400 uppercase tracking-wider block">
                              {task.projectName}
                            </span>
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
                          <h4 className="text-xs font-bold text-white hover:text-sky-400 cursor-pointer transition-colors">
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
                            {task.assignee?.avatar && (
                              <img
                                src={task.assignee.avatar}
                                alt={task.assignee.name}
                                className="size-5 rounded-full object-cover"
                                title={`Assignee: ${task.assignee.name}`}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
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
                  <th className="py-3 px-4">Assignee</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Due Date</th>
                  {canDeleteTask && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredTasks.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">{t.title}</td>
                    <td className="py-3.5 px-4 text-slate-400">{t.projectName}</td>
                    <td className="py-3.5 px-4 flex items-center gap-2">
                      {t.assignee?.avatar && (
                        <img src={t.assignee.avatar} alt="" className="size-5 rounded-full" />
                      )}
                      <span>{t.assignee?.name || 'Unassigned'}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-amber-400">{t.priority}</td>
                    <td className="py-3.5 px-4 font-mono">{t.dueDate}</td>
                    {canDeleteTask && (
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => handleDeleteTask(t.id)}
                          className="text-xs text-rose-400 hover:text-rose-300 p-1"
                          title="Delete Task"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
