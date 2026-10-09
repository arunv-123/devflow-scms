'use client';

import React, { useEffect, useState } from 'react';
import { Plus, X, ArrowRight, Pencil, Search, Trash2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { mockLeads } from '@/lib/mockData';
import { Lead, LeadStatus } from '@/types';
import { crmApi } from '@/services/crmApi';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { formatCurrency } from '@/lib/formatters';

export default function LeadsPage() {
  const leadStatuses: LeadStatus[] = ['New', 'Contacted', 'Proposal', 'Converted', 'Lost'];
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const { user } = useAuth();
  const { addToast } = useNotifications();
  const canManageLeads = !user || ['Super Admin', 'Admin', 'Project Manager'].includes(user.role);

  // Drag and Drop State
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<LeadStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    value: 50000,
    status: 'New' as LeadStatus,
    source: 'Inbound Web Contact',
    assignedTo: 'Sarah Chen',
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    company: '',
    email: '',
    value: 50000,
    status: 'New' as LeadStatus,
    source: 'Inbound Web Contact',
    assignedTo: 'Sarah Chen',
  });

  const loadLeads = () => {
    crmApi
      .getLeads()
      .then((data) => {
        if (data && data.length > 0) setLeads(data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadLeads();
  }, []);

  // --- DRAG AND DROP HANDLERS (matching Tasks Kanban architecture) ---
  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    if (!canManageLeads) {
      e.preventDefault();
      return;
    }
    setDraggedLead(lead);
    try {
      e.dataTransfer.setData('text/plain', lead.id);
      e.dataTransfer.setData('leadId', lead.id);
      e.dataTransfer.effectAllowed = 'move';
    } catch (err) {
      console.warn('dataTransfer setData error:', err);
    }
  };

  const handleDragOver = (e: React.DragEvent, status: LeadStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== status) {
      setDragOverColumn(status);
    }
  };

  const handleDragLeave = (e: React.DragEvent, status: LeadStatus) => {
    e.preventDefault();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    if (dragOverColumn === status) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: LeadStatus) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverColumn(null);
    setErrorMessage(null);

    let droppedLeadId = '';
    try {
      droppedLeadId = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('leadId');
    } catch (err) {
      console.warn('dataTransfer getData error:', err);
    }

    const leadToMove = (droppedLeadId ? leads.find((l) => l.id === droppedLeadId) : null) || draggedLead;
    setDraggedLead(null);

    // Prevent duplicate API requests when dropped into the same status column
    if (!leadToMove || leadToMove.status === targetStatus) return;

    // Prevent direct conversion of Lost leads via drag
    if (leadToMove.status === 'Lost' && targetStatus === 'Converted') {
      addToast({
        type: 'error',
        title: 'Invalid Status Change',
        message: 'Lost leads cannot be directly converted to active clients.',
      });
      return;
    }

    const previousLeads = [...leads];
    const leadId = leadToMove.id;

    // 1. Immediate Optimistic UI Update
    setLeads((prevLeads) =>
      prevLeads.map((l) => (l.id === leadId ? { ...l, status: targetStatus } : l))
    );

    // 2. Persist new status through existing backend API
    try {
      if (targetStatus === 'Converted') {
        await crmApi.convertLead(leadId);
        addToast({
          type: 'success',
          title: 'Lead Converted',
          message: `Lead "${leadToMove.name}" successfully converted to active client!`,
        });
      } else {
        await crmApi.updateLead(leadId, { status: targetStatus });
        addToast({
          type: 'success',
          title: 'Lead Status Updated',
          message: `Updated "${leadToMove.name}" status to ${targetStatus}.`,
        });
      }
      loadLeads();
    } catch (err: any) {
      console.error('Failed to persist lead status update:', err);
      // Revert UI to previous status on failed update
      setLeads(previousLeads);
      const errText = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to update lead status';
      setErrorMessage(`Could not move lead "${leadToMove.name}". Reverted to "${leadToMove.status}". (${errText})`);
      addToast({
        type: 'error',
        title: 'Status Update Failed',
        message: `Could not move lead "${leadToMove.name}". Reverted to "${leadToMove.status}". (${errText})`,
      });
    }
  };

  const handleDragEnd = () => {
    setDraggedLead(null);
    setDragOverColumn(null);
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.company || !formData.email) return;
    try {
      await crmApi.createLead(formData);
      setIsModalOpen(false);
      setFormData({
        name: '',
        company: '',
        email: '',
        value: 50000,
        status: 'New',
        source: 'Inbound Web Contact',
        assignedTo: 'Sarah Chen',
      });
      addToast({
        type: 'success',
        title: 'Lead Created',
        message: `Created lead prospect "${formData.name}".`,
      });
      loadLeads();
    } catch (err: any) {
      console.error('Failed to create lead', err);
      addToast({
        type: 'error',
        title: 'Creation Failed',
        message: err.response?.data?.error || 'Failed to create lead.',
      });
    }
  };

  const handleEditClick = (lead: Lead) => {
    setEditingLead(lead);
    setEditFormData({
      name: lead.name,
      company: lead.company,
      email: lead.email,
      value: lead.value,
      status: lead.status,
      source: lead.source || 'Inbound Web Contact',
      assignedTo: lead.assignedTo || 'Sarah Chen',
    });
  };

  const handleUpdateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead || !editFormData.name || !editFormData.company || !editFormData.email) return;
    try {
      if (editFormData.status === 'Converted' && editingLead.status !== 'Converted') {
        await crmApi.convertLead(editingLead.id);
      } else {
        await crmApi.updateLead(editingLead.id, editFormData);
      }
      setEditingLead(null);
      addToast({
        type: 'success',
        title: 'Lead Updated',
        message: `Updated lead details for "${editFormData.name}".`,
      });
      loadLeads();
    } catch (err: any) {
      console.error('Failed to update lead', err);
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: err.response?.data?.error || 'Failed to update lead.',
      });
    }
  };

  const handleStatusChange = async (id: string, newStatus: LeadStatus, currentStatus: LeadStatus) => {
    // Prevent direct conversion of Lost leads
    if (currentStatus === 'Lost' && newStatus === 'Converted') {
      addToast({
        type: 'error',
        title: 'Invalid Status Change',
        message: 'Lost leads cannot be directly converted to active clients.',
      });
      return;
    }

    const targetLead = leads.find((l) => l.id === id);
    const previousLeads = [...leads];

    // Optimistic UI update
    setLeads((prevLeads) =>
      prevLeads.map((l) => (l.id === id ? { ...l, status: newStatus } : l))
    );

    try {
      if (newStatus === 'Converted') {
        await crmApi.convertLead(id);
        addToast({
          type: 'success',
          title: 'Lead Converted',
          message: `Lead "${targetLead?.name || 'Prospect'}" converted to active client!`,
        });
      } else {
        await crmApi.updateLead(id, { status: newStatus });
        addToast({
          type: 'success',
          title: 'Lead Status Updated',
          message: `Updated status to ${newStatus}.`,
        });
      }
      loadLeads();
    } catch (err: any) {
      console.error('Failed to update lead status', err);
      setLeads(previousLeads);
      addToast({
        type: 'error',
        title: 'Status Update Failed',
        message: err.response?.data?.error || 'Failed to update lead status.',
      });
    }
  };

  const handleConvert = async (id: string) => {
    const targetLead = leads.find((l) => l.id === id);
    try {
      await crmApi.convertLead(id);
      addToast({
        type: 'success',
        title: 'Lead Converted',
        message: `Lead "${targetLead?.name || 'Prospect'}" converted to active client!`,
      });
      loadLeads();
    } catch (err: any) {
      console.error('Failed to convert lead', err);
      addToast({
        type: 'error',
        title: 'Conversion Failed',
        message: err.response?.data?.error || 'Failed to convert lead.',
      });
    }
  };

  const getAvailableStatuses = (currentStatus: LeadStatus): LeadStatus[] => {
    if (currentStatus === 'Lost') {
      return ['New', 'Contacted', 'Proposal', 'Lost'];
    }
    return ['New', 'Contacted', 'Proposal', 'Converted', 'Lost'];
  };

  const [statusFilter, setStatusFilter] = useState<string>('All');

  const filteredLeads = leads.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || l.status === statusFilter;
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

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Leads Pipeline</h1>
            <p className="text-xs text-slate-400">Track incoming lead prospects and deal conversion statuses.</p>
          </div>
          {canManageLeads && (
            <Button
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="bg-sky-600 hover:bg-sky-500 text-white text-xs gap-1.5 shadow-md shadow-sky-600/20"
            >
              <Plus className="size-4" />
              <span>Create Lead</span>
            </Button>
          )}
        </div>

        {/* Filter Bar */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-[#0b0f19] border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full flex-1">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                type="text"
                placeholder="Filter leads by name, company, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-9 pl-9 pr-4 text-xs bg-[#060913] border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto h-9 px-3 text-xs bg-[#060913] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              {leadStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Modal for Creating Lead */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3.5 sm:p-4 overflow-y-auto animate-fadeIn">
            <div className="relative w-full max-w-md max-h-[88dvh] sm:max-h-[90vh] flex flex-col rounded-2xl bg-[#0b0f19] border border-slate-800 p-4 sm:p-6 text-white shadow-2xl z-10">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
                <h3 className="text-base font-bold">Add New Prospect Lead</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleCreateLead} className="flex flex-col min-h-0 overflow-hidden mt-3">
                <div className="overflow-y-auto pr-1 space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Contact Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                      placeholder="e.g. Eleanor Vance"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Company</label>
                    <input
                      type="text"
                      required
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                      placeholder="e.g. Acme Corp"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                      placeholder="e.g. eleanor@acme.com"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Estimated Value (₹)</label>
                      <input
                        type="number"
                        value={formData.value}
                        onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Lead Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as LeadStatus })}
                        className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500 cursor-pointer"
                      >
                        {leadStatuses.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
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
                  <Button type="submit" className="bg-sky-600 hover:bg-sky-500 text-white text-xs">
                    Save Lead
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal for Editing Lead */}
        {editingLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3.5 sm:p-4 overflow-y-auto animate-fadeIn">
            <div className="relative w-full max-w-md max-h-[88dvh] sm:max-h-[90vh] flex flex-col rounded-2xl bg-[#0b0f19] border border-slate-800 p-4 sm:p-6 text-white shadow-2xl z-10">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
                <h3 className="text-base font-bold">Edit Lead Details</h3>
                <button onClick={() => setEditingLead(null)} className="text-slate-400 hover:text-white">
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateLead} className="flex flex-col min-h-0 overflow-hidden mt-3">
                <div className="overflow-y-auto pr-1 space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Contact Name</label>
                    <input
                      type="text"
                      required
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Company</label>
                    <input
                      type="text"
                      required
                      value={editFormData.company}
                      onChange={(e) => setEditFormData({ ...editFormData, company: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Estimated Value (₹)</label>
                      <input
                        type="number"
                        value={editFormData.value}
                        onChange={(e) => setEditFormData({ ...editFormData, value: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Assigned Owner</label>
                      <input
                        type="text"
                        value={editFormData.assignedTo}
                        onChange={(e) => setEditFormData({ ...editFormData, assignedTo: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end gap-2 shrink-0 mt-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setEditingLead(null)}
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

        {/* 5 Column Pipeline Board */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-start">
          {leadStatuses.map((status) => {
            const statusLeads = filteredLeads.filter((l) => l.status === status);
            const isConvertedStage = status === 'Converted';
            const isLostStage = status === 'Lost';
            const isOver = dragOverColumn === status;

            return (
              <div
                key={status}
                onDragOver={(e) => handleDragOver(e, status)}
                onDragLeave={(e) => handleDragLeave(e, status)}
                onDrop={(e) => handleDrop(e, status)}
                className={`p-4 rounded-2xl border transition-all duration-200 space-y-3 min-h-[420px] ${
                  isOver
                    ? 'border-2 border-dashed border-sky-400 bg-sky-950/20 shadow-lg shadow-sky-500/10'
                    : isConvertedStage
                    ? 'bg-[#0b0f19] border-emerald-900/40'
                    : isLostStage
                    ? 'bg-[#0b0f19] border-slate-800/80'
                    : 'bg-[#0b0f19] border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-bold text-white">
                  <div className="flex items-center gap-1.5">
                    <span>{status}</span>
                    {isConvertedStage && (
                      <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Closed
                      </span>
                    )}
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#060913] text-slate-300 border border-slate-800">
                    {statusLeads.length}
                  </span>
                </div>

                <div
                  onDragOver={(e) => handleDragOver(e, status)}
                  onDrop={(e) => handleDrop(e, status)}
                  className="space-y-3 min-h-[350px]"
                >
                  {/* Visual Drop Indicator Placeholder */}
                  {isOver && draggedLead?.status !== status && (
                    <div className="p-3 rounded-xl border-2 border-dashed border-sky-400/60 bg-sky-500/10 text-sky-300 text-xs font-semibold text-center flex items-center justify-center gap-1.5 animate-pulse">
                      <span className="size-2 rounded-full bg-sky-400 animate-ping" />
                      <span>Move lead to {status}</span>
                    </div>
                  )}

                  {statusLeads.map((lead) => {
                    const isActiveLead = ['New', 'Contacted', 'Proposal'].includes(lead.status);
                    const isDraggable = canManageLeads;
                    const isDraggingThis = draggedLead?.id === lead.id;

                    return (
                      <div
                        key={lead.id}
                        draggable={isDraggable}
                        onDragStart={(e) => handleDragStart(e, lead)}
                        onDragEnd={handleDragEnd}
                        className={`p-4 rounded-xl bg-[#060913] border transition-all flex flex-col justify-between space-y-3 group ${
                          isDraggable ? 'cursor-grab active:cursor-grabbing hover:border-sky-500/40' : 'cursor-default'
                        } ${
                          isDraggingThis
                            ? 'opacity-40 scale-[0.98] border-sky-500 shadow-md shadow-sky-500/20'
                            : 'border-slate-800'
                        }`}
                      >
                        {/* Card Content following exact visual hierarchy */}
                        <div className="space-y-2">
                          {/* 1. Lead Name */}
                          <h4 className="text-xs font-bold text-white leading-tight">{lead.name}</h4>

                          {/* 2. Company */}
                          <p className="text-[11px] text-sky-400 font-semibold">{lead.company}</p>

                          {/* 3. Deal Value */}
                          <div className="text-[11px] font-mono text-emerald-400 font-bold">
                            {formatCurrency(lead.value)}
                          </div>

                          {/* 4. Status Control */}
                          <div
                            className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2"
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <span className="text-[10px] text-slate-500 font-medium">Status:</span>
                            <select
                              value={lead.status}
                              onChange={(e) =>
                                handleStatusChange(lead.id, e.target.value as LeadStatus, lead.status)
                              }
                              disabled={!canManageLeads}
                              className="bg-[#0b0f19] text-slate-200 text-[10px] rounded-md border border-slate-700/60 px-2 py-1 focus:outline-none focus:border-sky-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Change Lead Status"
                            >
                              {getAvailableStatuses(lead.status).map((s) => (
                                <option key={s} value={s} className="bg-[#0b0f19] text-white">
                                  {s}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* 5. Owner */}
                          <div className="text-[10px] text-slate-500">
                            <span>Owner:</span>{' '}
                            <span className="text-slate-400">{lead.assignedTo || 'Unassigned'}</span>
                          </div>
                        </div>

                        {/* 6. Actions Aligned at Bottom */}
                        <div
                          className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px]"
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          {canManageLeads && (
                            <button
                              onClick={() => handleEditClick(lead)}
                              title="Edit Lead Details"
                              className="text-slate-400 hover:text-white flex items-center gap-1 text-[10px] font-medium transition-colors"
                            >
                              <Pencil className="size-3" />
                              <span>Edit</span>
                            </button>
                          )}

                          {canManageLeads && isActiveLead && (
                            <button
                              onClick={() => handleConvert(lead.id)}
                              title="Convert Lead to Client"
                              className="text-sky-400 hover:text-sky-300 flex items-center gap-0.5 text-[10px] font-semibold shrink-0 transition-colors ml-auto"
                            >
                              <span>Convert</span>
                              <ArrowRight className="size-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}

