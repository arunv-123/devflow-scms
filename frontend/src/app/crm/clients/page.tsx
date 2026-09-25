'use client';

import React from 'react';
import { UserCheck, Plus, Mail, Phone, FolderKanban } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { mockClients } from '@/lib/mockData';

export default function ClientsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Client Directory</h1>
            <p className="text-xs text-slate-400">Enterprise accounts, active contracts, and engagement records.</p>
          </div>
          <Button size="sm" className="bg-sky-600 hover:bg-sky-500 text-white text-xs gap-1.5 shadow-md shadow-sky-600/20">
            <Plus className="size-4" />
            <span>Add Client</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {mockClients.map((client) => (
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
