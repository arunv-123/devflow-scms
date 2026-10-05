'use client';

import React, { useState, useEffect } from 'react';
import { Sliders, Shield, Save, AlertTriangle, Lock } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { settingsApi, SystemSettings } from '@/services/settingsApi';
import { SearchableSelect, SelectOption } from '@/components/ui/searchable-select';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { useAuth } from '@/context/AuthContext';
import { updateAppFormatting } from '@/lib/formatters';

const CURRENCY_OPTIONS: SelectOption[] = [
  { value: 'INR (₹) — Indian Rupee', label: 'INR (₹) — Indian Rupee' },
  { value: 'USD ($) — US Dollar', label: 'USD ($) — US Dollar' },
  { value: 'EUR (€) — Euro', label: 'EUR (€) — Euro' },
  { value: 'GBP (£) — British Pound', label: 'GBP (£) — British Pound' },
  { value: 'AED (د.إ) — UAE Dirham', label: 'AED (د.إ) — UAE Dirham' },
  { value: 'SAR (﷼) — Saudi Riyal', label: 'SAR (﷼) — Saudi Riyal' },
  { value: 'AUD (A$) — Australian Dollar', label: 'AUD (A$) — Australian Dollar' },
  { value: 'CAD (C$) — Canadian Dollar', label: 'CAD (C$) — Canadian Dollar' },
  { value: 'JPY (¥) — Japanese Yen', label: 'JPY (¥) — Japanese Yen' },
  { value: 'CNY (¥) — Chinese Yuan', label: 'CNY (¥) — Chinese Yuan' },
];

const TIMEZONE_OPTIONS: SelectOption[] = [
  { group: 'Asia & Middle East', value: 'Asia/Kolkata (IST, UTC+05:30)', label: 'Asia/Kolkata (IST, UTC+05:30)' },
  { group: 'Asia & Middle East', value: 'Asia/Dubai (GST, UTC+04:00)', label: 'Asia/Dubai (GST, UTC+04:00)' },
  { group: 'Asia & Middle East', value: 'Asia/Riyadh (AST, UTC+03:00)', label: 'Asia/Riyadh (AST, UTC+03:00)' },
  { group: 'Asia & Middle East', value: 'Asia/Singapore (SGT, UTC+08:00)', label: 'Asia/Singapore (SGT, UTC+08:00)' },
  { group: 'Asia & Middle East', value: 'Asia/Tokyo (JST, UTC+09:00)', label: 'Asia/Tokyo (JST, UTC+09:00)' },
  { group: 'Asia & Middle East', value: 'Asia/Shanghai (CST, UTC+08:00)', label: 'Asia/Shanghai (CST, UTC+08:00)' },
  { group: 'Europe', value: 'Europe/London (GMT/BST, UTC+00:00)', label: 'Europe/London (GMT/BST, UTC+00:00)' },
  { group: 'Europe', value: 'Europe/Paris (CET/CEST, UTC+01:00)', label: 'Europe/Paris (CET/CEST, UTC+01:00)' },
  { group: 'Americas', value: 'America/New_York (EST/EDT, UTC-05:00)', label: 'America/New_York (EST/EDT, UTC-05:00)' },
  { group: 'Americas', value: 'America/Chicago (CST/CDT, UTC-06:00)', label: 'America/Chicago (CST/CDT, UTC-06:00)' },
  { group: 'Americas', value: 'America/Denver (MST/MDT, UTC-07:00)', label: 'America/Denver (MST/MDT, UTC-07:00)' },
  { group: 'Americas', value: 'America/Los_Angeles (PST/PDT, UTC-08:00)', label: 'America/Los_Angeles (PST/PDT, UTC-08:00)' },
  { group: 'Australia', value: 'Australia/Sydney (AEST/AEDT, UTC+10:00)', label: 'Australia/Sydney (AEST/AEDT, UTC+10:00)' },
  { group: 'Universal', value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
];

function normalizeCurrency(val?: string): string {
  if (!val) return 'INR (₹) — Indian Rupee';
  const match = CURRENCY_OPTIONS.find((opt) => opt.value === val || opt.value.startsWith(val.split(' ')[0]));
  return match ? match.value : val;
}

function normalizeTimezone(val?: string): string {
  if (!val) return 'Asia/Kolkata (IST, UTC+05:30)';
  const match = TIMEZONE_OPTIONS.find((opt) => opt.value === val || opt.value.startsWith(val.split(' ')[0]));
  return match ? match.value : val;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const canModifyRBAC = !user || ['Super Admin', 'Admin'].includes(user.role);

  const [settings, setSettings] = useState<SystemSettings>({
    organizationName: 'DevFlow Enterprise SCMS',
    organizationEmail: 'admin@devflow.local',
    defaultCurrency: 'INR (₹) — Indian Rupee',
    timezone: 'Asia/Kolkata (IST, UTC+05:30)',
    strictRBAC: true,
    emailNotifications: true,
    aiAssistantEnabled: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // RBAC Confirmation Modal State
  const [isDisableRBACModalOpen, setIsDisableRBACModalOpen] = useState(false);

  useEffect(() => {
    settingsApi
      .getSettings()
      .then((res) => {
        const normalized = {
          ...res,
          defaultCurrency: normalizeCurrency(res.defaultCurrency),
          timezone: normalizeTimezone(res.timezone),
        };
        setSettings(normalized);
        updateAppFormatting(normalized.defaultCurrency, normalized.timezone);
      })
      .catch((err) => console.error('Failed to load settings', err))
      .finally(() => setLoading(false));
  }, []);

  const handleRBACToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canModifyRBAC) return;
    const isChecked = e.target.checked;
    if (!isChecked) {
      // Opening confirmation modal before disabling
      setIsDisableRBACModalOpen(true);
    } else {
      setSettings((prev) => ({ ...prev, strictRBAC: true }));
    }
  };

  const handleConfirmDisableRBAC = () => {
    setSettings((prev) => ({ ...prev, strictRBAC: false }));
    setIsDisableRBACModalOpen(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);

    try {
      const updated = await settingsApi.updateSettings(settings);
      const normalized = {
        ...updated,
        defaultCurrency: normalizeCurrency(updated.defaultCurrency),
        timezone: normalizeTimezone(updated.timezone),
      };
      setSettings(normalized);
      updateAppFormatting(normalized.defaultCurrency, normalized.timezone);
      setMessage({ type: 'success', text: 'System configuration saved successfully.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to save system settings.' });
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
          <div
            className={`p-3.5 rounded-xl border text-xs font-medium ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
            }`}
          >
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading system settings...</div>
        ) : (
          <form onSubmit={handleSave} className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-6">
            {/* 1. ORGANIZATION CONFIGURATION */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800/80 pb-2.5">
                <Sliders className="size-4 text-sky-400" />
                <span>Organization Configuration</span>
              </h3>

              <div className="space-y-4">
                {/* Organization Name */}
                <div className="space-y-1 max-w-lg">
                  <label className="text-xs font-semibold text-slate-400">Organization Name</label>
                  <input
                    type="text"
                    value={settings.organizationName}
                    onChange={(e) => setSettings({ ...settings, organizationName: e.target.value })}
                    className="w-full h-9 px-3 text-xs bg-[#060913] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>

                {/* Default Currency & Timezone Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                  {/* Default Currency Searchable Dropdown */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400">Default Currency</label>
                    <SearchableSelect
                      options={CURRENCY_OPTIONS}
                      value={settings.defaultCurrency || 'INR (₹) — Indian Rupee'}
                      onChange={(val) => setSettings({ ...settings, defaultCurrency: val })}
                      placeholder="Select default currency..."
                    />
                  </div>

                  {/* Timezone Searchable Dropdown */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400">Timezone</label>
                    <SearchableSelect
                      options={TIMEZONE_OPTIONS}
                      value={settings.timezone || 'Asia/Kolkata (IST, UTC+05:30)'}
                      onChange={(val) => setSettings({ ...settings, timezone: val })}
                      placeholder="Select organization timezone..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. SECURITY & RBAC ENFORCEMENT */}
            <div className="pt-4 border-t border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Shield className="size-4 text-emerald-400" />
                  <span>Security & RBAC Enforcement</span>
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                  <AlertTriangle className="size-3" />
                  Security Critical
                </span>
              </div>

              <div
                className={`p-4 rounded-xl border transition-all ${
                  settings.strictRBAC
                    ? 'bg-[#060913] border-slate-800'
                    : 'bg-rose-950/20 border-rose-500/40'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white">Strict Backend RBAC Authorization</span>
                      {settings.strictRBAC ? (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Active & Enforced
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          Disabled (Security Risk)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                      Enforce strict role-based access control (RBAC) permission gates on all backend API routes. When enabled, non-authorized user roles cannot bypass protected workspace endpoints.
                    </p>
                    {!canModifyRBAC && (
                      <p className="text-[11px] text-amber-400/90 font-medium flex items-center gap-1 pt-1">
                        <Lock className="size-3 text-amber-400 shrink-0" />
                        <span>Only Admin and Super Admin roles can modify strict RBAC security enforcement.</span>
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 pt-0.5">
                    <input
                      type="checkbox"
                      checked={settings.strictRBAC}
                      onChange={handleRBACToggle}
                      disabled={!canModifyRBAC}
                      className="accent-sky-600 size-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      title={canModifyRBAC ? 'Toggle Strict RBAC Authorization' : 'Only Admins can modify strict RBAC'}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. SAVE BUTTON */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <Button
                type="submit"
                disabled={saving}
                size="sm"
                className="bg-sky-600 hover:bg-sky-500 text-white text-xs gap-1.5 shadow-md shadow-sky-600/20 px-5"
              >
                <Save className="size-4" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </Button>
            </div>
          </form>
        )}

        {/* Confirmation Modal for Disabling Strict RBAC */}
        <ConfirmModal
          isOpen={isDisableRBACModalOpen}
          onClose={() => setIsDisableRBACModalOpen(false)}
          onConfirm={handleConfirmDisableRBAC}
          title="Disable Backend RBAC Authorization?"
          message="Disabling backend authorization enforcement may allow users to bypass role-based API permission checks and access protected operations. This can create a serious security risk."
          confirmText="Disable Anyway"
          confirmVariant="danger"
        />
      </div>
    </AppLayout>
  );
}
