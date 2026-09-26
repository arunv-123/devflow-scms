'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Check } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { NotificationItem } from '@/types';
import { notificationsApi } from '@/services/notificationsApi';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationsApi.getNotifications();
      setNotifications(res.notifications);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      await loadNotifications();
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const handleMarkSingleAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      await loadNotifications();
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Notifications Center</h1>
            <p className="text-xs text-slate-400">System alerts, AI recommendations, task updates, and milestone achievements.</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleMarkAllAsRead}
            className="border-slate-800 text-xs gap-1.5 hover:bg-slate-800"
          >
            <Check className="size-4 text-emerald-400" />
            <span>Mark All as Read</span>
          </Button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
            No notifications available.
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleMarkSingleAsRead(n.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                  !n.read ? 'bg-[#0b0f19] border-sky-500/30 hover:border-sky-500/50' : 'bg-[#060913] border-slate-800/60 opacity-80'
                }`}
              >
                <div className="size-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Bell className="size-4 text-sky-400" />
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <h3 className="font-bold text-white">{n.title}</h3>
                    <span className="text-[10px] text-slate-500">{n.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
