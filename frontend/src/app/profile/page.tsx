'use client';

import React from 'react';
import { User, Mail, Shield, Save } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { currentUser } from '@/lib/mockData';

export default function ProfilePage() {
  return (
    <AppLayout>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">My Profile</h1>
          <p className="text-xs text-slate-400">Manage user account details, credentials, and profile image.</p>
        </div>

        <div className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-6">
          <div className="flex items-center gap-4">
            <img src={currentUser.avatar} alt="" className="size-16 rounded-2xl object-cover ring-2 ring-sky-500/40" />
            <div>
              <h3 className="text-lg font-bold text-white">{currentUser.name}</h3>
              <p className="text-xs text-slate-400">{currentUser.email}</p>
              <span className="mt-1 inline-block text-[10px] font-semibold text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-full border border-sky-500/20">
                {currentUser.role}
              </span>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Full Name</label>
              <input
                type="text"
                defaultValue={currentUser.name}
                className="w-full h-9 px-3 text-xs bg-[#060913] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Email Address</label>
              <input
                type="email"
                defaultValue={currentUser.email}
                className="w-full h-9 px-3 text-xs bg-[#060913] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button size="sm" className="bg-sky-600 hover:bg-sky-500 text-white text-xs gap-1.5 shadow-md shadow-sky-600/20">
              <Save className="size-4" />
              <span>Update Profile</span>
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
