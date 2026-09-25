'use client';

import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Grid,
  List,
  Search,
  Filter,
  Clock,
  MessageSquare,
  CheckCircle2,
  Tag,
  ChevronDown,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { mockTasks } from '@/lib/mockData';
import { TaskStatus } from '@/types';

export default function TasksPage() {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  const columns: TaskStatus[] = ['Todo', 'In Progress', 'Review', 'Completed'];

  const filteredTasks = mockTasks.filter((t) => {
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
          <Button size="sm" className="bg-sky-600 hover:bg-sky-500 text-white text-xs gap-1.5 shadow-md shadow-sky-600/20">
            <Plus className="size-4" />
            <span>Create Task</span>
          </Button>
        </div>

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
                      <span className={`size-2 rounded-full ${
                        colStatus === 'Completed' ? 'bg-emerald-400' : colStatus === 'In Progress' ? 'bg-sky-400' : 'bg-amber-400'
                      }`} />
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
                          <span className="text-[10px] font-semibold text-sky-400 uppercase tracking-wider block">
                            {task.projectName}
                          </span>
                          <h4 className="text-xs font-bold text-white hover:text-sky-400 cursor-pointer transition-colors">
                            {task.title}
                          </h4>
                          <p className="text-[11px] text-slate-400 line-clamp-2">{task.description}</p>
                        </div>

                        {/* Subtasks progress */}
                        {task.subtasks.length > 0 && (
                          <div className="space-y-1 pt-1">
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              <span>Subtasks</span>
                              <span>
                                {task.subtasks.filter((st) => st.completed).length}/{task.subtasks.length}
                              </span>
                            </div>
                            <div className="w-full bg-slate-900 rounded-full h-1 overflow-hidden">
                              <div
                                className="bg-sky-400 h-full rounded-full"
                                style={{
                                  width: `${
                                    (task.subtasks.filter((st) => st.completed).length / task.subtasks.length) * 100
                                  }%`,
                                }}
                              />
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
                              {task.commentsCount}
                            </span>
                            <img
                              src={task.assignee.avatar}
                              alt={task.assignee.name}
                              className="size-5 rounded-full object-cover"
                              title={`Assignee: ${task.assignee.name}`}
                            />
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredTasks.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">{t.title}</td>
                    <td className="py-3.5 px-4 text-slate-400">{t.projectName}</td>
                    <td className="py-3.5 px-4 flex items-center gap-2">
                      <img src={t.assignee.avatar} alt="" className="size-5 rounded-full" />
                      <span>{t.assignee.name}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-amber-400">{t.priority}</td>
                    <td className="py-3.5 px-4 font-mono">{t.dueDate}</td>
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
