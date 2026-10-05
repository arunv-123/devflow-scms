'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CheckCheck,
  Trash2,
  CheckCircle2,
  Calendar,
  CheckSquare,
  Flag,
  Sparkles,
  Layers,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { NotificationItem } from '@/types';
import { useNotifications } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';

function NotificationsContent() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
  } = useNotifications();
  const { user } = useAuth();
  const uRole = user?.role || '';

  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'task' | 'milestone' | 'meeting' | 'ai'>('all');

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const handleClearAll = async () => {
    try {
      await clearAllNotifications();
    } catch (err) {
      console.error('Failed to clear notifications', err);
    }
  };

  const handleNotificationClick = async (n: NotificationItem) => {
    if (!n.read) {
      try {
        await markAsRead(n.id);
      } catch (err) {
        console.error('Failed to mark as read', err);
      }
    }

    // Navigation with actionUrl / entity metadata & role protection
    const type = n.entityType || n.type;
    const isDevOrLead = ['Developer', 'Designer', 'QA', 'Team Lead'].includes(uRole);
    const isClient = uRole === 'Client';

    let targetUrl = n.actionUrl || '';

    // Sanitize destination based on user RBAC permissions
    if (type === 'meeting' || targetUrl.startsWith('/crm')) {
      if (isDevOrLead) {
        targetUrl = '/notifications';
      } else if (isClient) {
        targetUrl = n.entityId ? `/crm/meetings?meetingId=${n.entityId}` : '/crm/meetings';
      } else {
        targetUrl = targetUrl || (n.entityId ? `/crm/meetings?meetingId=${n.entityId}` : '/crm/meetings');
      }
    } else if (type === 'task' || targetUrl.startsWith('/tasks')) {
      targetUrl = targetUrl || (n.entityId ? `/tasks?taskId=${n.entityId}` : '/tasks');
    } else if (type === 'milestone' || targetUrl.startsWith('/milestones')) {
      targetUrl = targetUrl || (n.entityId ? `/milestones?milestoneId=${n.entityId}` : '/milestones');
    } else if (type === 'project' || targetUrl.startsWith('/projects')) {
      targetUrl = targetUrl || (n.entityId ? `/projects?projectId=${n.entityId}` : '/projects');
    } else if (type === 'ai' || targetUrl.startsWith('/ai')) {
      targetUrl = '/ai-assistant';
    } else if (!targetUrl) {
      targetUrl = '/notifications';
    }

    if (isDevOrLead && (targetUrl.startsWith('/crm') || targetUrl.startsWith('/settings') || targetUrl.startsWith('/reports') || targetUrl.startsWith('/team') || targetUrl.startsWith('/workload'))) {
      targetUrl = '/notifications';
    }

    router.push(targetUrl);
  };

  const handleDeleteSingle = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
    } catch (err) {
      console.error('Failed to delete notification', err);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.read;
    if (activeTab === 'task') return n.type === 'task' || n.entityType === 'task';
    if (activeTab === 'milestone') return n.type === 'milestone' || n.entityType === 'milestone';
    if (activeTab === 'meeting') return n.type === 'meeting' || n.entityType === 'meeting';
    if (activeTab === 'ai') return n.type === 'ai' || n.entityType === 'ai';
    return true;
  });

  const getIcon = (type?: string) => {
    if (type === 'task') return <CheckSquare className="size-4 text-sky-400" />;
    if (type === 'milestone') return <Flag className="size-4 text-amber-400" />;
    if (type === 'meeting') return <Calendar className="size-4 text-purple-400" />;
    if (type === 'ai') return <Sparkles className="size-4 text-emerald-400" />;
    if (type === 'project') return <Layers className="size-4 text-blue-400" />;
    return <Bell className="size-4 text-slate-400" />;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Title & Global Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Notifications Center</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time activity alerts, targeted task assignments, milestone updates, meeting schedules, and committed AI actions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleMarkAllAsRead}
              className="border-slate-800 text-xs gap-1.5 hover:bg-slate-800 text-slate-300"
            >
              <CheckCheck className="size-4 text-sky-400" />
              <span>Mark All as Read</span>
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleClearAll}
              className="border-slate-800 text-xs gap-1.5 hover:bg-red-950/30 text-red-400 border-red-500/20"
            >
              <Trash2 className="size-4" />
              <span>Clear All</span>
            </Button>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'all', label: 'All Notifications', count: notifications.length },
          { id: 'unread', label: 'Unread', count: unreadCount },
          { id: 'task', label: 'Tasks', count: notifications.filter((n) => n.type === 'task' || n.entityType === 'task').length },
          { id: 'milestone', label: 'Milestones', count: notifications.filter((n) => n.type === 'milestone' || n.entityType === 'milestone').length },
          { id: 'meeting', label: 'Meetings', count: notifications.filter((n) => n.type === 'meeting' || n.entityType === 'meeting').length },
          { id: 'ai', label: 'AI Actions', count: notifications.filter((n) => n.type === 'ai' || n.entityType === 'ai').length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === tab.id
                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === tab.id ? 'bg-sky-500/20 text-sky-300' : 'bg-slate-800 text-slate-400'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {loading && notifications.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading notifications...</div>
      ) : filteredNotifications.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-2xl bg-[#060913]">
          <CheckCircle2 className="size-8 text-slate-600 mx-auto mb-2" />
          <p className="font-semibold text-slate-300">No notifications in this category</p>
          <p className="text-[11px] text-slate-500 mt-1">You are all caught up with your workspace activities.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 group ${
                !n.read
                  ? 'bg-[#0b0f19] border-sky-500/30 hover:border-sky-500/60 shadow-lg shadow-sky-950/20'
                  : 'bg-[#060913] border-slate-800/60 opacity-85 hover:opacity-100 hover:border-slate-700'
              }`}
            >
              <div className="size-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                {getIcon(n.entityType || n.type)}
              </div>

              <div className="flex-1 space-y-1 min-w-0">
                <div className="flex items-center justify-between text-xs gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <h3 className="font-bold text-white truncate">{n.title}</h3>
                    {!n.read && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                        New
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0">
                    {typeof n.timestamp === 'string'
                      ? n.timestamp.includes('T')
                        ? new Date(n.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : n.timestamp
                      : 'Just now'}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>

                {n.actionUrl && (
                  <div className="pt-1 text-[11px] text-sky-400 font-medium group-hover:underline flex items-center gap-1">
                    <span>Click to view item details &rarr;</span>
                  </div>
                )}
              </div>

              <button
                onClick={(e) => handleDeleteSingle(e, n.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-all"
                title="Delete notification"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <AppLayout>
      <NotificationsContent />
    </AppLayout>
  );
}
