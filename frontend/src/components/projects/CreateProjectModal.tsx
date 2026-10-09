'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  AlertCircle,
  User,
  Building2,
  Loader2,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3.5 sm:p-4 overflow-y-auto devflow-backdrop-enter">
      <div className="relative w-full max-w-md max-h-[88dvh] sm:max-h-[90vh] flex flex-col rounded-2xl bg-[#0b0f19] border border-slate-800 p-4 sm:p-6 text-white shadow-2xl z-10 devflow-modal-enter">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
          <h3 className="text-base font-bold">Create New Project</h3>
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
                className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500 text-xs"
                placeholder="e.g. FinTech Nexus Suite"
              />
            </div>

            {/* Client Account */}
            <div>
              <label className="block text-slate-400 mb-1">
                Client Account <span className="text-rose-400">*</span>
              </label>
              {isLoadingClients ? (
                <div className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-slate-500 text-xs flex items-center gap-2">
                  <Loader2 className="size-3.5 animate-spin" />
                  Loading clients...
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
                className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500 text-xs"
                placeholder="Project overview, primary deliverables, and key goals..."
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

            {/* Status & Priority */}
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
                  <option value="Planning" className="bg-[#0b0f19] text-white">Planning</option>
                  <option value="In Progress" className="bg-[#0b0f19] text-white">In Progress</option>
                  <option value="Review" className="bg-[#0b0f19] text-white">Review</option>
                  <option value="Completed" className="bg-[#0b0f19] text-white">Completed</option>
                  <option value="On Hold" className="bg-[#0b0f19] text-white">On Hold</option>
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
                  <option value="Low" className="bg-[#0b0f19] text-white">Low</option>
                  <option value="Medium" className="bg-[#0b0f19] text-white">Medium</option>
                  <option value="High" className="bg-[#0b0f19] text-white">High</option>
                  <option value="Critical" className="bg-[#0b0f19] text-white">Critical</option>
                </select>
              </div>
            </div>

            {/* Budget */}
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
                className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500 text-xs font-mono"
              />
            </div>

            {/* Tech Stack */}
            <div>
              <label className="block text-slate-400 mb-1">Tech Stack (comma separated)</label>
              <input
                type="text"
                value={formData.techStackStr}
                onChange={(e) => setFormData({ ...formData, techStackStr: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500 font-mono text-xs"
                placeholder="Next.js, TypeScript, Node.js, MongoDB"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2 shrink-0 mt-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-slate-400 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={availableClients.length === 0 || isSubmitting}
              className="bg-sky-600 hover:bg-sky-500 text-white text-xs disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  Saving...
                </>
              ) : (
                'Save Project'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
