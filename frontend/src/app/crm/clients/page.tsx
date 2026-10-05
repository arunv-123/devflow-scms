'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Mail, Phone, X, Eye, Pencil, Trash2, Calendar, FolderKanban, ShieldAlert } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { mockClients } from '@/lib/mockData';
import { Client, Project, Meeting } from '@/types';
import { crmApi } from '@/services/crmApi';
import { projectApi } from '@/services/projectApi';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/formatters';
import { getAvatarUrl } from '@/lib/avatar';
import { ClientImageUploader } from '@/components/crm/ClientImageUploader';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [projects, setProjects] = useState<Project[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);

  const { user } = useAuth();
  const canManageClients = !user || ['Super Admin', 'Admin', 'Project Manager'].includes(user.role);

  // Form states
  const [createFormData, setCreateFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    activeProjects: 1,
    totalValue: 100000,
    status: 'Active' as 'Active' | 'Inactive',
    avatar: '',
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    activeProjects: 1,
    totalValue: 100000,
    status: 'Active' as 'Active' | 'Inactive',
    avatar: '',
  });

  const loadData = () => {
    crmApi
      .getClients()
      .then((data) => {
        if (data && data.length > 0) {
          setClients((prev) => {
            return data.map((d) => {
              const match = prev.find((p) => p.id === d.id);
              if (match && match.avatar !== undefined && match.avatar !== '' && match.avatar !== d.avatar) {
                return { ...d, avatar: match.avatar };
              }
              return d;
            });
          });
        }
      })
      .catch(() => {});

    projectApi
      .getProjects()
      .then((data) => {
        if (data) setProjects(data);
      })
      .catch(() => {});

    crmApi
      .getMeetings()
      .then((data) => {
        if (data) setMeetings(data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createFormData.name || !createFormData.company || !createFormData.email || !createFormData.phone) return;
    try {
      const created = await crmApi.createClient(createFormData);
      setIsCreateModalOpen(false);
      setCreateFormData({
        name: '',
        company: '',
        email: '',
        phone: '',
        activeProjects: 1,
        totalValue: 100000,
        status: 'Active',
        avatar: '',
      });
      if (created) {
        setClients((prev) => [created, ...prev.filter((c) => c.id !== created.id)]);
      }
    } catch (err) {
      console.error('Failed to create client', err);
    }
  };

  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setEditFormData({
      name: client.name,
      company: client.company,
      email: client.email,
      phone: client.phone,
      activeProjects: client.activeProjects,
      totalValue: client.totalValue,
      status: client.status || 'Active',
      avatar: client.avatar || '',
    });
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient || !editFormData.name || !editFormData.company || !editFormData.email) return;

    const updatedClient: Client = {
      ...editingClient,
      ...editFormData,
    };

    // Optimistically update clients list state so avatar change reflects instantly
    setClients((prev) => prev.map((c) => (c.id === editingClient.id ? updatedClient : c)));
    setEditingClient(null);

    try {
      const res = await crmApi.updateClient(editingClient.id, editFormData);
      if (res) {
        setClients((prev) => prev.map((c) => (c.id === editingClient.id ? res : c)));
      }
    } catch (err) {
      console.error('Failed to update client', err);
    }
  };

  const handleDeleteClient = async () => {
    if (!deletingClient) return;
    try {
      await crmApi.deleteClient(deletingClient.id);
      setDeletingClient(null);
      setClients((prev) => prev.filter((c) => c.id !== deletingClient.id));
    } catch (err) {
      console.error('Failed to delete client', err);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Client Directory</h1>
            <p className="text-xs text-slate-400">Enterprise accounts, active contracts, and engagement records.</p>
          </div>
          {canManageClients && (
            <Button
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-sky-600 hover:bg-sky-500 text-white text-xs gap-1.5 shadow-md shadow-sky-600/20"
            >
              <Plus className="size-4" />
              <span>Add Client</span>
            </Button>
          )}
        </div>

        {/* Create Client Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-screen z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
            <div className="relative w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl bg-[#0b0f19] border border-slate-800 p-6 text-white shadow-2xl z-10">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
                <h3 className="text-base font-bold">Add Enterprise Client</h3>
                <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleCreateClient} className="overflow-y-auto mt-3 space-y-3 text-xs pr-1">
                <ClientImageUploader
                  avatar={createFormData.avatar}
                  clientSeed={{ name: createFormData.company || createFormData.name, email: createFormData.email }}
                  onChange={(newAvatar) => setCreateFormData({ ...createFormData, avatar: newAvatar })}
                  canEdit={canManageClients}
                />
                <div>
                  <label className="block text-slate-400 mb-1">Company Name</label>
                  <input
                    type="text"
                    required
                    value={createFormData.company}
                    onChange={(e) => setCreateFormData({ ...createFormData, company: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                    placeholder="e.g. Apex Global Industries"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Primary Contact Name</label>
                  <input
                    type="text"
                    required
                    value={createFormData.name}
                    onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                    placeholder="e.g. Marcus Vance"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={createFormData.email}
                    onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                    placeholder="e.g. contact@apex.com"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Phone</label>
                  <input
                    type="text"
                    required
                    value={createFormData.phone}
                    onChange={(e) => setCreateFormData({ ...createFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                    placeholder="e.g. +1 (555) 123-4567"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Total Contract Value (₹)</label>
                    <input
                      type="number"
                      value={createFormData.totalValue}
                      onChange={(e) => setCreateFormData({ ...createFormData, totalValue: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Active Projects</label>
                    <input
                      type="number"
                      value={createFormData.activeProjects}
                      onChange={(e) => setCreateFormData({ ...createFormData, activeProjects: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Account Status</label>
                  <select
                    value={createFormData.status}
                    onChange={(e) =>
                      setCreateFormData({ ...createFormData, status: e.target.value as 'Active' | 'Inactive' })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="text-slate-400 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-sky-600 hover:bg-sky-500 text-white text-xs">
                    Save Client
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Client Modal */}
        {editingClient && (
          <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-screen z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
            <div className="relative w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl bg-[#0b0f19] border border-slate-800 p-6 text-white shadow-2xl z-10">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
                <h3 className="text-base font-bold">Edit Client Details</h3>
                <button onClick={() => setEditingClient(null)} className="text-slate-400 hover:text-white transition-colors">
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateClient} className="overflow-y-auto mt-3 space-y-3 text-xs pr-1">
                <ClientImageUploader
                  avatar={editFormData.avatar}
                  clientSeed={{ id: editingClient.id, name: editFormData.company || editFormData.name, email: editFormData.email }}
                  onChange={(newAvatar) => setEditFormData({ ...editFormData, avatar: newAvatar })}
                  canEdit={canManageClients}
                />
                <div>
                  <label className="block text-slate-400 mb-1">Company Name</label>
                  <input
                    type="text"
                    required
                    value={editFormData.company}
                    onChange={(e) => setEditFormData({ ...editFormData, company: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Primary Contact Name</label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
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
                <div>
                  <label className="block text-slate-400 mb-1">Phone</label>
                  <input
                    type="text"
                    required
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Total Contract Value (₹)</label>
                    <input
                      type="number"
                      value={editFormData.totalValue}
                      onChange={(e) => setEditFormData({ ...editFormData, totalValue: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Active Projects</label>
                    <input
                      type="number"
                      value={editFormData.activeProjects}
                      onChange={(e) => setEditFormData({ ...editFormData, activeProjects: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Account Status</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, status: e.target.value as 'Active' | 'Inactive' })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setEditingClient(null)}
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

        {/* View Client Modal */}
        {viewingClient && (
          <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-screen z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
            <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-[#0b0f19] border border-slate-800 p-6 text-white shadow-2xl z-10">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-800 pb-4 shrink-0">
                <div className="flex items-center gap-4">
                  <img
                    src={getAvatarUrl(viewingClient.avatar, viewingClient)}
                    alt={viewingClient.company}
                    className="size-14 rounded-2xl object-cover ring-2 ring-sky-500/30"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-white">{viewingClient.company}</h2>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                          viewingClient.status === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {viewingClient.status || 'Active'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">Primary Contact: {viewingClient.name}</p>
                  </div>
                </div>
                <button onClick={() => setViewingClient(null)} className="text-slate-400 hover:text-white transition-colors">
                  <X className="size-5" />
                </button>
              </div>

              {/* Scrollable Content Body */}
              <div className="overflow-y-auto my-4 space-y-5 text-xs pr-1">
                {/* Client Logo Management in View Mode */}
                <ClientImageUploader
                  avatar={viewingClient.avatar}
                  clientSeed={viewingClient}
                  onChange={async (newAvatar) => {
                    try {
                      await crmApi.updateClient(viewingClient.id, { avatar: newAvatar });
                      setViewingClient({ ...viewingClient, avatar: newAvatar });
                      loadData();
                    } catch (e) {
                      console.error('Failed to update client avatar from view modal', e);
                    }
                  }}
                  canEdit={canManageClients}
                />
                {/* Quick Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-[#060913] border border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Email</span>
                    <span className="text-slate-200 font-medium truncate block">{viewingClient.email}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Phone</span>
                    <span className="text-slate-200 font-medium truncate block">{viewingClient.phone}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Active Projects</span>
                    <span className="text-sky-400 font-bold">{viewingClient.activeProjects}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Contract Value</span>
                    <span className="text-emerald-400 font-mono font-bold">{formatCurrency(viewingClient.totalValue)}</span>
                  </div>
                </div>

                {/* Linked Projects */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-white border-b border-slate-800/80 pb-2">
                    <FolderKanban className="size-4 text-sky-400" />
                    <span>Associated Projects</span>
                  </div>
                  {projects.filter(
                    (p) =>
                      p.clientName?.toLowerCase() === viewingClient.company?.toLowerCase() ||
                      p.clientName?.toLowerCase() === viewingClient.name?.toLowerCase()
                  ).length > 0 ? (
                    <div className="space-y-2">
                      {projects
                        .filter(
                          (p) =>
                            p.clientName?.toLowerCase() === viewingClient.company?.toLowerCase() ||
                            p.clientName?.toLowerCase() === viewingClient.name?.toLowerCase()
                        )
                        .map((prj) => (
                          <div
                            key={prj.id}
                            className="p-3 rounded-lg bg-[#060913] border border-slate-800/80 flex items-center justify-between text-xs"
                          >
                            <div>
                              <h4 className="font-bold text-white">{prj.name}</h4>
                              <p className="text-[10px] text-slate-400 truncate max-w-sm">{prj.description}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-emerald-400 font-mono font-bold text-[11px]">
                                {formatCurrency(prj.budget || 0)}
                              </span>
                              <span className="block text-[10px] text-slate-500">{prj.status}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic p-3 bg-[#060913] rounded-lg border border-slate-800/60">
                      No active projects currently linked to this client account.
                    </p>
                  )}
                </div>

                {/* Linked Meetings */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-white border-b border-slate-800/80 pb-2">
                    <Calendar className="size-4 text-purple-400" />
                    <span>Scheduled Meetings</span>
                  </div>
                  {meetings.filter(
                    (m) =>
                      m.clientName?.toLowerCase() === viewingClient.company?.toLowerCase() ||
                      m.clientName?.toLowerCase() === viewingClient.name?.toLowerCase()
                  ).length > 0 ? (
                    <div className="space-y-2">
                      {meetings
                        .filter(
                          (m) =>
                            m.clientName?.toLowerCase() === viewingClient.company?.toLowerCase() ||
                            m.clientName?.toLowerCase() === viewingClient.name?.toLowerCase()
                        )
                        .map((mtg) => (
                          <div
                            key={mtg.id}
                            className="p-3 rounded-lg bg-[#060913] border border-slate-800/80 flex items-center justify-between text-xs"
                          >
                            <div>
                              <h4 className="font-bold text-white">{mtg.title}</h4>
                              <p className="text-[10px] text-slate-400">{mtg.notes}</p>
                            </div>
                            <div className="text-right text-[10px]">
                              <span className="text-purple-400 font-semibold">{mtg.date}</span>
                              <span className="block text-slate-500">{mtg.time}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic p-3 bg-[#060913] rounded-lg border border-slate-800/60">
                      No upcoming meetings scheduled for this client.
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end shrink-0">
                <Button variant="ghost" onClick={() => setViewingClient(null)} className="text-slate-400 text-xs">
                  Close Profile
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingClient && (
          <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-screen z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="relative w-full max-w-sm rounded-2xl bg-[#0b0f19] border border-slate-800 p-6 space-y-4 text-white shadow-2xl z-10">
              <div className="flex items-center gap-3 text-red-400 border-b border-slate-800 pb-3">
                <ShieldAlert className="size-6 shrink-0" />
                <h3 className="text-base font-bold text-white">Remove Client Account</h3>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Are you sure you want to remove <strong className="text-white">{deletingClient.company}</strong>?
                Associated projects will be archived to prevent broken references.
              </p>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <Button variant="ghost" onClick={() => setDeletingClient(null)} className="text-slate-400 text-xs">
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteClient}
                  className="bg-red-600 hover:bg-red-500 text-white text-xs font-semibold"
                >
                  Remove Client
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Clients Directory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {clients.map((client) => (
            <div
              key={client.id}
              className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={getAvatarUrl(client.avatar, client)}
                      alt={client.company}
                      className="size-12 rounded-xl object-cover ring-2 ring-sky-500/30"
                    />
                    <div>
                      <h3 className="text-base font-bold text-white leading-tight">{client.company}</h3>
                      <p className="text-xs text-slate-400">Contact: {client.name}</p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border shrink-0 ${
                      client.status === 'Active'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {client.status || 'Active'}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-300 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <Mail className="size-3.5 text-sky-400 shrink-0" />
                    <span className="truncate">{client.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="size-3.5 text-purple-400 shrink-0" />
                    <span>{client.phone}</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/60">
                  <span>Active Projects: {client.activeProjects}</span>
                  <span className="font-mono font-bold text-emerald-400">{formatCurrency(client.totalValue)}</span>
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                <button
                  onClick={() => setViewingClient(client)}
                  className="text-slate-400 hover:text-sky-400 flex items-center gap-1 text-[11px] font-medium transition-colors"
                  title="View Client Details"
                >
                  <Eye className="size-3.5" />
                  <span>View</span>
                </button>

                {canManageClients && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleOpenEdit(client)}
                      className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px] font-medium transition-colors"
                      title="Edit Client Profile"
                    >
                      <Pencil className="size-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setDeletingClient(client)}
                      className="text-slate-400 hover:text-red-400 flex items-center gap-1 text-[11px] font-medium transition-colors"
                      title="Remove Client Account"
                    >
                      <Trash2 className="size-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
