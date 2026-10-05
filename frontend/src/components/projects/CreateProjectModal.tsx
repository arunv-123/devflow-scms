'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  AlertCircle,
  Building2,
  User,
  FolderKanban,
  Calendar,
  DollarSign,
  Code,
  AlignLeft,
  BarChart3,
  Loader2,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ProjectStatus, PriorityLevel, Client } from '@/types';
import { projectApi } from '@/services/projectApi';
import { crmApi } from '@/services/crmApi';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: () => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onProjectCreated,
}) => {
  const { user } = useAuth();
  const { addToast } = useNotifications();

  const [availableClients, setAvailableClients] = useState<Client[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  // Lock background scroll when modal is open
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

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Load clients when modal opens
  useEffect(() => {
    if (!isOpen) return;

    setFormError(null);
    setIsLoadingClients(true);

    crmApi
      .getClients()
      .then((clientsList) => {
        setIsLoadingClients(false);
        if (clientsList && clientsList.length > 0) {
          setAvailableClients(clientsList);
          setFormData((prev) => ({
            ...prev,
            clientId: prev.clientId || clientsList[0].id,
            clientName: prev.clientName || clientsList[0].company,
          }));
        } else {
          setAvailableClients([]);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch clients for project creation', err);
        setIsLoadingClients(false);
        setAvailableClients([]);
      });
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Please enter a project name.');
      return;
    }

    if (!formData.clientId || !formData.clientName) {
      setFormError('Please select a valid client account.');
      return;
    }

    if (!formData.description.trim()) {
      setFormError('Please enter a project description.');
      return;
    }

    if (formData.budget < 0) {
      setFormError('Budget cannot be a negative amount.');
      return;
    }

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setFormError('End Date cannot be earlier than Start Date.');
      return;
    }

    setIsSubmitting(true);

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

      addToast({
        type: 'success',
        title: 'Project Created',
        message: `Project "${formData.name.trim()}" has been initialized.`,
      });

      onProjectCreated();
      onClose();

      // Reset form
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
    } catch (err: any) {
      setFormError(
        err.response?.data?.error || err.message || 'Failed to create project. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const parsedTechTags = formData.techStackStr
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 sm:p-6 devflow-backdrop-enter"
    >
      <div className="relative w-full max-w-xl max-h-[88vh] flex flex-col rounded-2xl bg-[#0b0f19] border border-slate-800 text-white shadow-2xl overflow-hidden devflow-modal-enter">
        {/* Header (Sticky Header) */}
        <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between shrink-0 bg-[#0b0f19] z-10">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shadow-sm shadow-sky-500/10">
              <Plus className="size-4.5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Create New Project</h3>
              <p className="text-[11px] text-slate-400">
                Initialize a client workspace, timeline, and budget allocation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <X className="size-4.5" />
          </button>
        </div>

        {/* Form Outer Container */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Scrollable Content Body */}
          <div className="p-6 overflow-y-auto min-h-0 flex-1 space-y-4 text-xs">
            {/* Creator info banner */}
            {user && (
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400">
                <User className="size-3.5 text-sky-400 shrink-0" />
                <span>
                  Creating as{' '}
                  <span className="text-white font-semibold">{user.name}</span>{' '}
                  <span className="text-sky-400 font-medium">({user.role})</span>
                </span>
              </div>
            )}

            {formError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2.5">
                <AlertCircle className="size-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Project Name */}
            <div>
              <label className="flex items-center gap-1.5 font-semibold text-slate-300 mb-1.5">
                <FolderKanban className="size-3.5 text-sky-400" />
                <span>Project Name</span>
                <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#060913] border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 transition-all text-xs"
                placeholder="e.g. FinTech Nexus Suite"
              />
            </div>

            {/* Client Account Selection */}
            <div>
              <label className="flex items-center gap-1.5 font-semibold text-slate-300 mb-1.5">
                <Building2 className="size-3.5 text-sky-400" />
                <span>Client Account</span>
                <span className="text-rose-400">*</span>
              </label>
              {isLoadingClients ? (
                <div className="w-full px-3.5 py-2.5 rounded-xl bg-[#060913] border border-slate-800 text-slate-500 text-xs flex items-center gap-2">
                  <Loader2 className="size-3.5 animate-spin text-sky-400" />
                  <span>Loading client list...</span>
                </div>
              ) : availableClients.length > 0 ? (
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 text-xs cursor-pointer"
                >
                  {availableClients.map((client) => (
                    <option key={client.id} value={client.id} className="bg-[#0b0f19] text-white">
                      {client.company} ({client.name})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3.5 rounded-xl bg-[#060913] border border-amber-500/30 text-amber-400 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="size-4 shrink-0" />
                    <span>No clients available in database.</span>
                  </div>
                  <Link href="/crm/clients" className="text-sky-400 underline hover:text-sky-300 font-semibold">
                    Add Client
                  </Link>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="flex items-center gap-1.5 font-semibold text-slate-300 mb-1.5">
                <AlignLeft className="size-3.5 text-sky-400" />
                <span>Description</span>
                <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#060913] border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 transition-all text-xs resize-none"
                placeholder="Project overview, primary deliverables, and key goals..."
              />
            </div>

            {/* Start Date & End Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="flex items-center gap-1.5 font-semibold text-slate-300 mb-1.5">
                  <Calendar className="size-3.5 text-sky-400" />
                  <span>Start Date</span>
                  <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 text-xs [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 font-semibold text-slate-300 mb-1.5">
                  <Calendar className="size-3.5 text-sky-400" />
                  <span>End Date</span>
                  <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 text-xs [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Status, Priority & Budget */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="flex items-center gap-1.5 font-semibold text-slate-300 mb-1.5">
                  <BarChart3 className="size-3.5 text-sky-400" />
                  <span>Status</span>
                  <span className="text-rose-400">*</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500 text-xs cursor-pointer font-medium"
                >
                  <option value="Planning" className="bg-[#0b0f19]">Planning</option>
                  <option value="In Progress" className="bg-[#0b0f19]">In Progress</option>
                  <option value="Review" className="bg-[#0b0f19]">Review</option>
                  <option value="Completed" className="bg-[#0b0f19]">Completed</option>
                  <option value="On Hold" className="bg-[#0b0f19]">On Hold</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-1.5 font-semibold text-slate-300 mb-1.5">
                  <Sparkles className="size-3.5 text-sky-400" />
                  <span>Priority</span>
                  <span className="text-rose-400">*</span>
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as PriorityLevel })}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500 text-xs cursor-pointer font-medium"
                >
                  <option value="Low" className="bg-[#0b0f19]">Low</option>
                  <option value="Medium" className="bg-[#0b0f19]">Medium</option>
                  <option value="High" className="bg-[#0b0f19]">High</option>
                  <option value="Critical" className="bg-[#0b0f19]">Critical</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-1.5 font-semibold text-slate-300 mb-1.5">
                  <DollarSign className="size-3.5 text-emerald-400" />
                  <span>Budget (₹)</span>
                  <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 text-xs font-mono"
                />
              </div>
            </div>

            {/* Tech Stack */}
            <div>
              <label className="flex items-center justify-between font-semibold text-slate-300 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Code className="size-3.5 text-sky-400" />
                  <span>Tech Stack</span>
                </span>
                <span className="text-[10px] text-slate-500 font-normal">Comma-separated technologies</span>
              </label>
              <input
                type="text"
                value={formData.techStackStr}
                onChange={(e) => setFormData({ ...formData, techStackStr: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 font-mono text-xs mb-2"
                placeholder="Next.js, TypeScript, Node.js, MongoDB"
              />
              {/* Live Badge Preview */}
              {parsedTechTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {parsedTechTags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md text-[10px] bg-sky-500/10 text-sky-300 border border-sky-500/20 font-mono font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sticky Action Footer */}
          <div className="px-6 py-4 border-t border-slate-800/80 bg-[#060913] flex items-center justify-end gap-3 shrink-0 z-10">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-slate-400 hover:text-white text-xs px-4"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={availableClients.length === 0 || isSubmitting}
              className="bg-sky-600 hover:bg-sky-500 text-white text-xs px-5 shadow-lg shadow-sky-600/20 disabled:opacity-50 font-semibold gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Creating Project...</span>
                </>
              ) : (
                <span>Create Project</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
