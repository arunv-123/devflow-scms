'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Plus,
  Grid,
  List,
  BrainCircuit,
  X,
  Pencil,
  Trash2,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { mockProjects } from '@/lib/mockData';
import { useAuth } from '@/context/AuthContext';
import { Project, ProjectStatus, PriorityLevel } from '@/types';
import { projectApi } from '@/services/projectApi';

export default function ProjectsPage() {
  const { user } = useAuth();
  const role = user?.role || 'Admin';
  const canCreateProject = ['Super Admin', 'Admin', 'Project Manager'].includes(role);
  const canEditProject = ['Super Admin', 'Admin', 'Project Manager', 'Team Lead'].includes(role);
  const canDeleteProject = ['Super Admin', 'Admin'].includes(role);

  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    clientName: 'Apex Capital Corp',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '2026-12-31',
    status: 'In Progress' as ProjectStatus,
    priority: 'High' as PriorityLevel,
    budget: 150000,
    techStackStr: 'Next.js, TypeScript, Node.js, MongoDB',
  });

  const loadProjects = () => {
    projectApi
      .getProjects()
      .then((data) => {
        if (data && data.length > 0) setProjects(data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.clientName || !formData.description) return;
    try {
      const techStack = formData.techStackStr
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await projectApi.createProject({
        name: formData.name,
        clientName: formData.clientName,
        description: formData.description,
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: formData.status,
        priority: formData.priority,
        budget: formData.budget,
        spent: 0,
        progress: 10,
        techStack,
        healthScore: 95,
        riskLevel: 'Low',
      });

      setIsModalOpen(false);
      setFormData({
        name: '',
        clientName: 'Apex Capital Corp',
        description: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '2026-12-31',
        status: 'In Progress',
        priority: 'High',
        budget: 150000,
        techStackStr: 'Next.js, TypeScript, Node.js, MongoDB',
      });
      loadProjects();
    } catch (err) {
      console.error('Failed to create project', err);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await projectApi.deleteProject(id);
      loadProjects();
    } catch (err) {
      console.error('Failed to delete project', err);
    }
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Projects & Portfolios
            </h1>
            <p className="text-xs text-slate-400">
              Manage client projects, budget allocations, tech stacks, and real-time health scores.
            </p>
          </div>
          {canCreateProject && (
            <Button
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="bg-sky-600 hover:bg-sky-500 text-white text-xs gap-1.5 shadow-md shadow-sky-600/20"
            >
              <Plus className="size-4" />
              <span>Create Project</span>
            </Button>
          )}
        </div>

        {/* Modal for Creating Project */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl bg-[#0b0f19] border border-slate-800 p-6 space-y-4 text-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold">Create New Project</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleCreateProject} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Project Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                    placeholder="e.g. FinTech Nexus Suite"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Client Name</label>
                  <input
                    type="text"
                    required
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                    placeholder="e.g. Apex Capital Corp"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Description</label>
                  <textarea
                    rows={2}
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                    placeholder="Project overview & objectives..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Start Date</label>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-2 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500 text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">End Date</label>
                    <input
                      type="date"
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-2 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500 text-[11px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
                      className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                    >
                      <option value="Planning">Planning</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Review">Review</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Budget ($)</label>
                    <input
                      type="number"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Tech Stack (comma separated)</label>
                  <input
                    type="text"
                    value={formData.techStackStr}
                    onChange={(e) => setFormData({ ...formData, techStackStr: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500 font-mono"
                    placeholder="Next.js, TypeScript, Node.js"
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
                    Save Project
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
                placeholder="Search projects or clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-9 pl-9 pr-4 text-xs bg-[#060913] border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="size-4 text-slate-400 hidden sm:block" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 px-3 text-xs bg-[#060913] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="All">All Statuses</option>
                <option value="In Progress">In Progress</option>
                <option value="Planning">Planning</option>
                <option value="Review">Review</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1 border border-slate-800 bg-[#060913] p-1 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-slate-800 text-sky-400' : 'text-slate-400'}`}
            >
              <Grid className="size-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-slate-800 text-sky-400' : 'text-slate-400'}`}
            >
              <List className="size-4" />
            </button>
          </div>
        </div>

        {/* Grid View */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-800 hover:border-sky-500/40 transition-all duration-200 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-semibold text-sky-400 uppercase tracking-wider block">
                        {project.clientName}
                      </span>
                      <Link
                        href={`/projects/${project.id}`}
                        className="text-lg font-bold text-white hover:text-sky-400 transition-colors"
                      >
                        {project.name}
                      </Link>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                        project.status === 'In Progress'
                          ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                          : project.status === 'Review'
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {project.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                    {project.description}
                  </p>

                  {/* Tech Stack Pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {project.techStack.map((tech, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md text-[10px] bg-[#060913] text-slate-300 border border-slate-800 font-mono"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/80 space-y-3">
                  {/* Progress & Budget */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Progress ({project.progress}%)</span>
                      <span className="text-slate-400 font-mono">
                        ${project.spent.toLocaleString()} / ${project.budget.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-[#060913] rounded-full h-2 overflow-hidden border border-slate-800">
                      <div
                        className="bg-gradient-to-r from-sky-400 to-blue-600 h-full rounded-full"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer Row */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <BrainCircuit className="size-3.5" />
                      <span>Health: {project.healthScore}/100</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {Array.isArray(project.members) &&
                          project.members.map((m) => (
                            <img
                              key={m.id}
                              src={m.avatar}
                              alt={m.name}
                              className="size-6 rounded-full border border-slate-900 object-cover"
                              title={m.name}
                            />
                          ))}
                      </div>
                      <Link href={`/projects/${project.id}`}>
                        <Button size="xs" variant="outline" className="text-xs text-sky-300 border-sky-500/30">
                          Details
                        </Button>
                      </Link>
                      {canDeleteProject && (
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => handleDeleteProject(project.id)}
                          className="text-xs text-rose-400 hover:text-rose-300"
                          title="Delete Project"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Table View */
          <div className="rounded-2xl bg-[#0b0f19] border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#060913] border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
                <tr>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Health</th>
                  <th className="py-3 px-4">Progress</th>
                  <th className="py-3 px-4">Budget</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredProjects.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">{p.name}</td>
                    <td className="py-3.5 px-4 text-slate-400">{p.clientName}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-400">{p.healthScore}%</td>
                    <td className="py-3.5 px-4">{p.progress}%</td>
                    <td className="py-3.5 px-4 font-mono">${p.budget.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/projects/${p.id}`}>
                          <Button size="xs" variant="ghost" className="text-sky-400">
                            View
                          </Button>
                        </Link>
                        {canDeleteProject && (
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => handleDeleteProject(p.id)}
                            className="text-xs text-rose-400 hover:text-rose-300"
                            title="Delete Project"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
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
