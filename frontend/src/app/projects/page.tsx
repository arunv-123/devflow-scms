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
  Trash2,
  AlertCircle,
  Building2,
  User,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { mockProjects } from '@/lib/mockData';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { Project, ProjectStatus, PriorityLevel, Client } from '@/types';
import { projectApi } from '@/services/projectApi';
import { crmApi } from '@/services/crmApi';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { CountUpNumber, AnimatedProgressBar } from '@/components/common/DataAnimation';
import { getAvatarUrl } from '@/lib/avatar';

export default function ProjectsPage() {
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
  const canCreateProject = ['Super Admin', 'Admin', 'Project Manager'].includes(role);
  const canDeleteProject = ['Super Admin', 'Admin'].includes(role);

  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [availableClients, setAvailableClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    clientId: '',
    clientName: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '2026-12-31',
    status: 'In Progress' as ProjectStatus,
    priority: 'High' as PriorityLevel,
    budget: 150000,
    techStackStr: 'Next.js, TypeScript, Node.js, MongoDB',
  });

  const loadData = () => {
    projectApi
      .getProjects()
      .then((data) => {
        if (data && data.length > 0) setProjects(data);
      })
      .catch(() => {});

    crmApi
      .getClients()
      .then((clientsList) => {
        if (clientsList && clientsList.length > 0) {
          setAvailableClients(clientsList);
          setFormData((prev) => {
            if (!prev.clientId) {
              return {
                ...prev,
                clientId: clientsList[0].id,
                clientName: clientsList[0].company,
              };
            }
            return prev;
          });
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  // Prevent underlying body scrolling while modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isModalOpen]);

  const handleOpenCreateModal = () => {
    setFormError(null);
    if (availableClients.length > 0) {
      setFormData((prev) => ({
        ...prev,
        clientId: prev.clientId || availableClients[0].id,
        clientName: prev.clientName || availableClients[0].company,
      }));
    }
    setIsModalOpen(true);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Please enter a project name.');
      return;
    }

    if (!formData.clientId || !formData.clientName) {
      setFormError('Please select a valid client from the dropdown.');
      return;
    }

    if (!formData.description.trim()) {
      setFormError('Please enter a project description.');
      return;
    }

    if (formData.budget < 0) {
      setFormError('Budget cannot be negative.');
      return;
    }

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setFormError('End Date cannot be earlier than Start Date.');
      return;
    }

    try {
      const techStack = formData.techStackStr
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await projectApi.createProject({
        name: formData.name.trim(),
        clientId: formData.clientId,
        clientName: formData.clientName,
        description: formData.description.trim(),
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: formData.status,
        priority: formData.priority,
        budget: Number(formData.budget),
        spent: 0,
        progress: 10,
        techStack,
        healthScore: 95,
        riskLevel: 'Low',
      });

      setIsModalOpen(false);
      setFormData({
        name: '',
        clientId: availableClients[0]?.id || '',
        clientName: availableClients[0]?.company || '',
        description: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '2026-12-31',
        status: 'In Progress',
        priority: 'High',
        budget: 150000,
        techStackStr: 'Next.js, TypeScript, Node.js, MongoDB',
      });
      loadData();
    } catch (err: any) {
      setFormError(err.response?.data?.error || err.message || 'Failed to create project.');
    }
  };

  const handleDeleteProject = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Project',
      message: 'Are you sure you want to delete this project?',
      confirmText: 'Delete Project',
      confirmVariant: 'danger',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, loading: true }));
        try {
          await projectApi.deleteProject(id);
          addToast({
            type: 'success',
            title: 'Project Deleted',
            message: 'Project has been deleted successfully.',
          });
          loadData();
        } catch (err: any) {
          addToast({
            type: 'error',
            title: 'Deletion Failed',
            message: err.response?.data?.error || 'Failed to delete project',
          });
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false, loading: false }));
        }
      },
    });
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
      <div className="space-y-6 devflow-page-enter">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Projects & Portfolios</h1>
            <p className="text-xs text-slate-400">
              Manage client projects, budget allocations, tech stacks, and real-time health scores.
            </p>
          </div>
          {canCreateProject && (
            <Button
              size="sm"
              onClick={handleOpenCreateModal}
              className="bg-sky-600 hover:bg-sky-500 text-white text-xs gap-1.5 shadow-md shadow-sky-600/20"
            >
              <Plus className="size-4" />
              <span>Create Project</span>
            </Button>
          )}
        </div>

        {/* Modal for Creating Project */}
        {isModalOpen && (
          <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-screen z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto devflow-backdrop-enter">
            <div className="relative w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl bg-[#0b0f19] border border-slate-800 p-6 text-white shadow-2xl z-10 devflow-modal-enter">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
                <h3 className="text-base font-bold">Create New Project</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
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
                    <span className="text-white font-semibold">{user.name}</span>{' '}
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

              <form onSubmit={handleCreateProject} className="flex flex-col min-h-0 overflow-hidden mt-3">
                <div className="overflow-y-auto pr-1 space-y-3.5 text-xs">
                  {/* Project Name */}
                  <div>
                    <label className="block text-slate-400 mb-1">
                      Project Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                      placeholder="e.g. FinTech Nexus Suite"
                    />
                  </div>

                  {/* Database-Backed Client Selection */}
                  <div>
                    <label className="block text-slate-400 mb-1">
                      Client Account <span className="text-rose-400">*</span>
                    </label>
                    {availableClients.length > 0 ? (
                      <select
                        required
                        value={formData.clientId}
                        onChange={(e) => {
                          const selected = availableClients.find((c) => c.id === e.target.value);
                          if (selected) {
                            setFormData({
                              ...formData,
                              clientId: selected.id,
                              clientName: selected.company,
                            });
                          }
                        }}
                        className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500 text-xs cursor-pointer"
                      >
                        {availableClients.map((client) => (
                          <option key={client.id} value={client.id} className="bg-[#0b0f19] text-white">
                            {client.company} ({client.name})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="p-3 rounded-lg bg-[#060913] border border-amber-500/30 text-amber-400 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="size-4 shrink-0" />
                          <span>No clients available.</span>
                        </div>
                        <Link href="/crm/clients" className="text-sky-400 underline hover:text-sky-300 font-semibold">
                          Add Client
                        </Link>
                      </div>
                    )}
                  </div>

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
                      placeholder="Project overview & deliverables..."
                    />
                  </div>

                  {/* Start Date & End Date */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">
                        Start Date <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">
                        End Date <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500 text-xs"
                      />
                    </div>
                  </div>

                  {/* Status & Budget */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">
                        Status <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
                        className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500 text-xs cursor-pointer"
                      >
                        <option value="Planning">Planning</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Review">Review</option>
                        <option value="Completed">Completed</option>
                        <option value="On Hold">On Hold</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">
                        Budget (₹) <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="number"
                        min={0}
                        required
                        value={formData.budget}
                        onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500 text-xs"
                      />
                    </div>
                  </div>

                  {/* Tech Stack */}
                  <div>
                    <label className="block text-slate-400 mb-1">Tech Stack (comma separated)</label>
                    <input
                      type="text"
                      value={formData.techStackStr}
                      onChange={(e) => setFormData({ ...formData, techStackStr: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500 font-mono text-xs"
                      placeholder="Next.js, TypeScript, Node.js"
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2 shrink-0 mt-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsModalOpen(false)}
                    className="text-slate-400 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={availableClients.length === 0}
                    className="bg-sky-600 hover:bg-sky-500 text-white text-xs disabled:opacity-50"
                  >
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
                className="h-9 px-3 text-xs bg-[#060913] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="In Progress">In Progress</option>
                <option value="Planning">Planning</option>
                <option value="Review">Review</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1 border border-slate-800 bg-[#060913] p-1 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'grid' ? 'bg-slate-800 text-sky-400' : 'text-slate-400 hover:text-white'
              }`}
              title="Grid View"
            >
              <Grid className="size-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'table' ? 'bg-slate-800 text-sky-400' : 'text-slate-400 hover:text-white'
              }`}
              title="Table View"
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
                className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-800 hover:border-sky-500/40 transition-all duration-200 space-y-4 flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-semibold text-sky-400 uppercase tracking-wider block">
                        {project.clientName}
                      </span>
                      <Link
                        href={`/projects/${project.id}`}
                        className="text-lg font-bold text-white hover:text-sky-400 transition-colors leading-snug block"
                      >
                        {project.name}
                      </Link>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-semibold shrink-0 border ${
                        project.status === 'In Progress'
                          ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                          : project.status === 'Review'
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                          : project.status === 'Planning'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : project.status === 'Completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
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
                      <span className="text-slate-400">
                        Progress (<CountUpNumber value={project.progress} suffix="%" />)
                      </span>
                      <span className="text-slate-400 font-mono">
                        {formatCurrency(project.spent)} / {formatCurrency(project.budget)}
                      </span>
                    </div>
                    <AnimatedProgressBar
                      percentage={project.progress}
                      className="bg-gradient-to-r from-sky-400 to-blue-600 h-full rounded-full"
                      trackClassName="w-full bg-[#060913] rounded-full h-2 overflow-hidden border border-slate-800"
                    />
                  </div>

                  {/* Footer Row Aligned */}
                  <div className="flex items-center justify-between text-xs pt-1 flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <BrainCircuit className="size-3.5" />
                      <span>
                        Health: <CountUpNumber value={project.healthScore} suffix="/100" />
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {Array.isArray(project.members) &&
                          project.members.map((m) => (
                            <img
                              key={m.id}
                              src={getAvatarUrl(m.avatar, m)}
                              alt={m.name}
                              className="size-6 rounded-full border border-slate-900 object-cover"
                              title={m.name}
                            />
                          ))}
                      </div>
                      <Link href={`/projects/${project.id}`}>
                        <Button
                          size="xs"
                          variant="outline"
                          className="text-xs text-sky-300 border-sky-500/30 hover:bg-sky-500/10"
                        >
                          Details
                        </Button>
                      </Link>
                      {canDeleteProject && (
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => handleDeleteProject(project.id)}
                          className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
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
                    <td className="py-3.5 px-4 font-bold text-emerald-400">
                      <CountUpNumber value={p.healthScore} suffix="%" />
                    </td>
                    <td className="py-3.5 px-4">
                      <CountUpNumber value={p.progress} suffix="%" />
                    </td>
                    <td className="py-3.5 px-4 font-mono">{formatCurrency(p.budget)}</td>
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
