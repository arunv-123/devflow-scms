'use client';

import React, { useState, useEffect } from 'react';
import { Sliders, Shield, Bell, User, Key, Save } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { settingsApi, SystemSettings } from '@/services/settingsApi';

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    organizationName: 'DevFlow Enterprise SCMS',
    organizationEmail: 'admin@devflow.local',
    defaultCurrency: 'USD ($)',
    strictRBAC: true,
    emailNotifications: true,
    aiAssistantEnabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    settingsApi
      .getSettings()
      .then((res) => setSettings(res))
      .catch((err) => console.error('Failed to load settings', err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setSaving(true);

    try {
      const updated = await settingsApi.updateSettings(settings);
      setSettings(updated);
      setMessage('System configuration saved successfully.');
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Failed to save system settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">System Settings</h1>
          <p className="text-xs text-slate-400">Manage organization parameters, security, notifications, and integration settings.</p>
        </div>

        {message && (
          <div className="p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-medium">
            {message}
          </div>
        )}

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading system settings...</div>
        ) : (
          <form onSubmit={handleSave} className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-6">
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
                    value={settings.organizationName}
                    onChange={(e) => setSettings({ ...settings, organizationName: e.target.value })}
                    className="w-full h-9 px-3 text-xs bg-[#060913] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Default Currency</label>
                  <input
                    type="text"
                    value={settings.defaultCurrency}
                    onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value })}
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
                <input
                  type="checkbox"
                  checked={settings.strictRBAC}
                  onChange={(e) => setSettings({ ...settings, strictRBAC: e.target.checked })}
                  className="accent-sky-600 size-4 cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <Button
                type="submit"
                disabled={saving}
                size="sm"
                className="bg-sky-600 hover:bg-sky-500 text-white text-xs gap-1.5 shadow-md shadow-sky-600/20"
              >
                <Save className="size-4" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </Button>
            </div>
          </form>
        )}
      </div>
    </AppLayout>
  );
}
