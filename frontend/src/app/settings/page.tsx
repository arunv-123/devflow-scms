'use client';

import React from 'react';
import { Sliders, Shield, Bell, User, Key, Save } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  return (
    <AppLayout>
      <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">System Settings</h1>
          <p className="text-xs text-slate-400">Manage organization parameters, security, notifications, and integration settings.</p>
        </div>

        <div className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="size-4 text-sky-400" />
              <span>Organization Configuration</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Organization Name</label>
                <input
                  type="text"
                  defaultValue="DevFlow Enterprise SCMS"
                  className="w-full h-9 px-3 text-xs bg-[#060913] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Default Currency</label>
                <input
                  type="text"
                  defaultValue="USD ($)"
                  className="w-full h-9 px-3 text-xs bg-[#060913] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Shield className="size-4 text-emerald-400" />
              <span>Security & RBAC Enforcement</span>
            </h3>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#060913] border border-slate-800 text-xs">
              <div>
                <span className="font-bold text-white block">Strict Backend RBAC Authorization</span>
                <span className="text-slate-400">Enforce permission gates on API level for all user roles.</span>
              </div>
              <input type="checkbox" defaultChecked className="accent-sky-600 size-4" />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <Button size="sm" className="bg-sky-600 hover:bg-sky-500 text-white text-xs gap-1.5 shadow-md shadow-sky-600/20">
              <Save className="size-4" />
              <span>Save Changes</span>
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
