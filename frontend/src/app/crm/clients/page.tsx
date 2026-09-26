'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Mail, Phone, X } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { mockClients } from '@/lib/mockData';
import { Client } from '@/types';
import { crmApi } from '@/services/crmApi';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    activeProjects: 1,
    totalValue: 100000,
    status: 'Active' as const,
  });

  const loadClients = () => {
    crmApi
      .getClients()
      .then((data) => {
        if (data && data.length > 0) setClients(data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.company || !formData.email || !formData.phone) return;
    try {
      await crmApi.createClient(formData);
      setIsModalOpen(false);
      setFormData({
        name: '',
        company: '',
        email: '',
        phone: '',
        activeProjects: 1,
        totalValue: 100000,
        status: 'Active',
      });
      loadClients();
    } catch (err) {
      console.error('Failed to create client', err);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Client Directory</h1>
            <p className="text-xs text-slate-400">Enterprise accounts, active contracts, and engagement records.</p>
          </div>
          <Button
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="bg-sky-600 hover:bg-sky-500 text-white text-xs gap-1.5 shadow-md shadow-sky-600/20"
          >
            <Plus className="size-4" />
            <span>Add Client</span>
          </Button>
        </div>

        {/* Create Client Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl bg-[#0b0f19] border border-slate-800 p-6 space-y-4 text-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold">Add Enterprise Client</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleCreateClient} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Company Name</label>
                  <input
                    type="text"
                    required
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                    placeholder="e.g. Apex Global Industries"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Primary Contact Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                    placeholder="e.g. Marcus Vance"
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
                    placeholder="e.g. contact@apex.com"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Phone</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                    placeholder="e.g. +1 (555) 123-4567"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Total Contract Value ($)</label>
                    <input
                      type="number"
                      value={formData.totalValue}
                      onChange={(e) => setFormData({ ...formData, totalValue: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Active Projects</label>
                    <input
                      type="number"
                      value={formData.activeProjects}
                      onChange={(e) => setFormData({ ...formData, activeProjects: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
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
                    Save Client
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {clients.map((client) => (
            <div key={client.id} className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-800 hover:border-slate-700 transition-colors space-y-4">
              <div className="flex items-center gap-3">
                <img src={client.avatar} alt="" className="size-12 rounded-xl object-cover ring-2 ring-sky-500/30" />
                <div>
                  <h3 className="text-base font-bold text-white">{client.company}</h3>
                  <p className="text-xs text-slate-400">Contact: {client.name}</p>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <Mail className="size-3.5 text-sky-400" />
                  <span>{client.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="size-3.5 text-purple-400" />
                  <span>{client.phone}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
                <span>Active Projects: {client.activeProjects}</span>
                <span className="font-mono font-bold text-emerald-400">${client.totalValue.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
