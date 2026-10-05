'use client';

import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, Save, Sun } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { ThemeSwitcher } from '@/components/common/ThemeSwitcher';
import { ProfilePhotoUploader } from '@/components/profile/ProfilePhotoUploader';
import { usersApi } from '@/services/usersApi';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { addToast } = useNotifications();
  const [fullName, setFullName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.name) {
      setFullName(user.name);
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setSaving(true);
    try {
      await usersApi.updateUser(user.id, { name: fullName.trim() });
      await refreshUser();
      addToast({
        type: 'success',
        title: 'Profile Updated',
        message: 'Your account profile details have been saved successfully.',
      });
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: err.response?.data?.error || 'Failed to save profile changes.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">My Profile</h1>
          <p className="text-xs text-slate-400">Manage user account details, profile photo, preferences, and workspace appearance.</p>
        </div>

        <div className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-6">
          {/* User Header Info */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">{user?.name || 'Authenticated User'}</h3>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>
            <span className="text-xs font-semibold text-sky-400 bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/20">
              {user?.role || 'Member'}
            </span>
          </div>

          {/* Profile Photo Uploader Section */}
          <ProfilePhotoUploader />

          {/* Edit Form */}
          <form onSubmit={handleUpdateProfile} className="space-y-4 pt-4 border-t border-slate-800">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-[#060913] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Email Address</label>
              <input
                type="email"
                readOnly
                value={user?.email || ''}
                className="w-full h-9 px-3 text-xs bg-[#060913]/60 border border-slate-800/80 rounded-lg text-slate-400 cursor-not-allowed"
              />
              <p className="text-[10px] text-slate-500">Email address is linked to your authentication identity.</p>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={saving}
                size="sm"
                className="bg-sky-600 hover:bg-sky-500 text-white text-xs gap-1.5 shadow-md shadow-sky-600/20"
              >
                <Save className="size-4" />
                <span>{saving ? 'Saving...' : 'Update Profile'}</span>
              </Button>
            </div>
          </form>

          {/* User Specific Appearance / Theme Preferences Section */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <Sun className="size-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white">Appearance & Theme Preferences</h3>
            </div>
            <p className="text-xs text-slate-400">Customize your personal workspace interface theme preference across DevFlow.</p>
            <ThemeSwitcher />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
