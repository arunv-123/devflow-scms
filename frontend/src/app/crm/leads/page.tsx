'use client';

import React, { useEffect, useState } from 'react';
import { Plus, X, ArrowRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { mockLeads } from '@/lib/mockData';
import { Lead, LeadStatus } from '@/types';
import { crmApi } from '@/services/crmApi';

export default function LeadsPage() {
  const leadStatuses: LeadStatus[] = ['New', 'Contacted', 'Proposal', 'Converted', 'Lost'];
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
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
      loadLeads();
    } catch (err) {
      console.error('Failed to create lead', err);
    }
  };

  const handleConvert = async (id: string) => {
    try {
      await crmApi.convertLead(id);
      loadLeads();
    } catch (err) {
      console.error('Failed to convert lead', err);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Leads Pipeline</h1>
            <p className="text-xs text-slate-400">Track incoming lead prospects and deal conversion statuses.</p>
          </div>
          <Button
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="bg-sky-600 hover:bg-sky-500 text-white text-xs gap-1.5 shadow-md shadow-sky-600/20"
          >
            <Plus className="size-4" />
            <span>Create Lead</span>
          </Button>
        </div>

        {/* Modal for Creating Lead */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl bg-[#0b0f19] border border-slate-800 p-6 space-y-4 text-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold">Add New Prospect Lead</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleCreateLead} className="space-y-3 text-xs">
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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Estimated Value ($)</label>
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
                      className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                    >
                      {leadStatuses.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
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
                    Save Lead
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
          {leadStatuses.map((status) => {
            const statusLeads = leads.filter((l) => l.status === status);
            return (
              <div key={status} className="p-4 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-bold text-white">
                  <span>{status}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#060913] text-slate-300 border border-slate-800">
                    {statusLeads.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {statusLeads.map((lead) => (
                    <div key={lead.id} className="p-4 rounded-xl bg-[#060913] border border-slate-800 space-y-2 group">
                      <h4 className="text-xs font-bold text-white">{lead.name}</h4>
                      <p className="text-[11px] text-sky-400 font-semibold">{lead.company}</p>
                      <div className="text-[11px] font-mono text-emerald-400 font-bold">
                        ${lead.value.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/60 flex items-center justify-between">
                        <span>Owner: {lead.assignedTo}</span>
                        {lead.status !== 'Converted' && (
                          <button
                            onClick={() => handleConvert(lead.id)}
                            title="Convert Lead to Client"
                            className="text-sky-400 hover:text-sky-300 flex items-center gap-0.5 text-[10px] font-semibold"
                          >
                            <span>Convert</span>
                            <ArrowRight className="size-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
