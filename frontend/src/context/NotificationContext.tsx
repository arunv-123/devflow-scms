'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { notificationsApi } from '@/services/notificationsApi';
import { NotificationItem } from '@/types';
import { useAuth } from './AuthContext';
import { Bell, CheckSquare, Flag, Calendar, Sparkles, Layers, X, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface ToastItem {
  id: string;
  notifId: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  createdAt: number;
}

export interface AddToastInput {
  title: string;
  message: string;
  type?: 'task' | 'milestone' | 'meeting' | 'ai' | 'project' | 'success' | 'error' | 'warning' | 'info' | string;
  actionUrl?: string;
}

export type SyncStatus = 'connected' | 'connecting' | 'reconnecting' | 'disconnected';

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  toasts: ToastItem[];
  syncStatus: SyncStatus;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  dismissToast: (toastId: string) => void;
  addToast: (input: AddToastInput) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

/**
 * Browser-safe synthesized notification chime using Web Audio API.
 * Uses local browser AudioContext with zero external network requests or paid APIs.
 * Gracefully handles autoplay restrictions if browser blocks audio before user interaction.
 */
function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // First tone (C5 - 523.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now);
    gain1.gain.setValueAtTime(0.1, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.2);

    // Second tone (E5 - 659.25 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, now + 0.08);
    gain2.gain.setValueAtTime(0.1, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.3);
  } catch (_) {
    // Silently handle browser autoplay policy blocks
  }
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const router = useRouter();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const [loading, setLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('connecting');

  // Ref tracking seen notification IDs & error counts
  const seenIdsRef = useRef<Set<string>>(new Set());
  const isInitialFetchRef = useRef<boolean>(true);
  const consecutiveErrorsRef = useRef<number>(0);

  // Fetch notifications from real backend API & detect genuinely NEW notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      setSyncStatus('disconnected');
      return;
    }

    if (typeof window !== 'undefined' && !navigator.onLine) {
      setSyncStatus('disconnected');
      setLoading(false);
      return;
    }

    try {
      const data = await notificationsApi.getNotifications();
      const freshNotifs = data.notifications || [];
      const freshUnreadCount = data.unreadCount || 0;

      consecutiveErrorsRef.current = 0;
      setSyncStatus('connected');

      if (isInitialFetchRef.current) {
        // On initial app mount, record existing notification IDs into seen set so old unread items don't trigger toasts
        freshNotifs.forEach((n) => seenIdsRef.current.add(n.id));
        isInitialFetchRef.current = false;
        setNotifications(freshNotifs);
      } else {
        // Identify genuinely NEW unread notifications that have never been seen by this client session
        const brandNewNotifs = freshNotifs.filter(
          (n) => !n.read && !seenIdsRef.current.has(n.id)
        );

        if (brandNewNotifs.length > 0) {
          // Play sound ONCE for new arrival
          playNotificationChime();

          // Mark as seen in memory
          brandNewNotifs.forEach((n) => seenIdsRef.current.add(n.id));

          // Enqueue floating toast items
          const newToasts: ToastItem[] = brandNewNotifs.map((n) => ({
            id: `toast-${n.id}-${Date.now()}`,
            notifId: n.id,
            type: n.entityType || n.type,
            title: n.title,
            message: n.message,
            actionUrl: n.actionUrl,
            createdAt: Date.now(),
          }));

          setToasts((prev) => [...prev, ...newToasts]);
        }

        setNotifications(freshNotifs);
      }
    } catch (err) {
      console.error('Failed to fetch notifications in context:', err);
      consecutiveErrorsRef.current += 1;

      if (typeof window !== 'undefined' && !navigator.onLine) {
        setSyncStatus('disconnected');
      } else if (consecutiveErrorsRef.current === 1) {
        setSyncStatus('reconnecting');
      } else if (consecutiveErrorsRef.current >= 3) {
        setSyncStatus('disconnected');
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Window online / offline network status listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setSyncStatus('connecting');
      fetchNotifications();
    };

    const handleOffline = () => {
      setSyncStatus('disconnected');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchNotifications]);

  // Lightweight interval polling (6s) with tab visibility detection
  useEffect(() => {
    if (!user) return;

    isInitialFetchRef.current = true;
    seenIdsRef.current.clear();
    fetchNotifications();

    let intervalId: NodeJS.Timeout | null = null;

    const startPolling = () => {
      if (!intervalId) {
        intervalId = setInterval(() => {
          if (typeof document !== 'undefined' && !document.hidden) {
            fetchNotifications();
          }
        }, 6000);
      }
    };

    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined') {
        if (document.hidden) {
          stopPolling();
        } else {
          fetchNotifications();
          startPolling();
        }
      }
    };

    if (typeof document !== 'undefined' && !document.hidden) {
      startPolling();
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      stopPolling();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [fetchNotifications, user?.id]);

  // Auto-dismiss floating toasts smoothly after ~4.5 seconds per toast
  useEffect(() => {
    if (toasts.length === 0) return;

    const oldest = toasts[0];
    const now = Date.now();
    const elapsed = now - oldest.createdAt;
    const remaining = Math.max(100, 4500 - elapsed);

    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== oldest.id));
    }, remaining);

    return () => clearTimeout(timer);
  }, [toasts]);

  // Dismiss single toast manually without marking notification read or deleting from DB
  const dismissToast = useCallback((toastId: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      throw err;
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      throw err;
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await notificationsApi.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setToasts((prev) => prev.filter((t) => t.notifId !== id));
    } catch (err) {
      console.error('Failed to delete notification:', err);
      throw err;
    }
  };

  const clearAllNotifications = async () => {
    try {
      await notificationsApi.clearAllNotifications();
      setNotifications([]);
      setToasts([]);
    } catch (err) {
      console.error('Failed to clear all notifications:', err);
      throw err;
    }
  };

  const addToast = useCallback((input: AddToastInput) => {
    const newToast: ToastItem = {
      id: `toast-manual-${Date.now()}-${Math.random()}`,
      notifId: '',
      type: input.type || 'info',
      title: input.title,
      message: input.message,
      actionUrl: input.actionUrl,
      createdAt: Date.now(),
    };
    setToasts((prev) => [...prev, newToast]);
  }, []);

  const getToastStyles = (type: string) => {
    switch (type) {
      case 'success':
        return {
          border: 'border-emerald-500/40 hover:border-emerald-400',
          iconBg: 'bg-emerald-950/60 border-emerald-500/30',
          icon: <CheckCircle2 className="size-4 text-emerald-400" />,
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        };
      case 'error':
        return {
          border: 'border-rose-500/40 hover:border-rose-400',
          iconBg: 'bg-rose-950/60 border-rose-500/30',
          icon: <X className="size-4 text-rose-400" />,
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        };
      case 'warning':
        return {
          border: 'border-amber-500/40 hover:border-amber-400',
          iconBg: 'bg-amber-950/60 border-amber-500/30',
          icon: <AlertTriangle className="size-4 text-amber-400" />,
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        };
      case 'task':
        return {
          border: 'border-sky-500/40 hover:border-sky-400',
          iconBg: 'bg-sky-950/60 border-sky-500/30',
          icon: <CheckSquare className="size-4 text-sky-400" />,
          badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
        };
      case 'milestone':
        return {
          border: 'border-amber-500/40 hover:border-amber-400',
          iconBg: 'bg-amber-950/60 border-amber-500/30',
          icon: <Flag className="size-4 text-amber-400" />,
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        };
      case 'meeting':
        return {
          border: 'border-purple-500/40 hover:border-purple-400',
          iconBg: 'bg-purple-950/60 border-purple-500/30',
          icon: <Calendar className="size-4 text-purple-400" />,
          badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        };
      case 'ai':
        return {
          border: 'border-emerald-500/40 hover:border-emerald-400',
          iconBg: 'bg-emerald-950/60 border-emerald-500/30',
          icon: <Sparkles className="size-4 text-emerald-400" />,
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        };
      case 'project':
        return {
          border: 'border-blue-500/40 hover:border-blue-400',
          iconBg: 'bg-blue-950/60 border-blue-500/30',
          icon: <Layers className="size-4 text-blue-400" />,
          badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        };
      case 'info':
      default:
        return {
          border: 'border-sky-500/40 hover:border-sky-400',
          iconBg: 'bg-sky-950/60 border-sky-500/30',
          icon: <Info className="size-4 text-sky-400" />,
          badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
        };
    }
  };

  const handleToastClick = async (toast: ToastItem) => {
    dismissToast(toast.id);
    if (!toast.notifId) {
      if (toast.actionUrl) router.push(toast.actionUrl);
      return;
    }

    const targetNotif = notifications.find((n) => n.id === toast.notifId);
    if (targetNotif && !targetNotif.read) {
      try {
        await markAsRead(targetNotif.id);
      } catch (_) {}
    }

    let targetUrl = toast.actionUrl;
    if (!targetUrl && targetNotif) {
      targetUrl = targetNotif.actionUrl;
    }

    if (!targetUrl) {
      if (toast.type === 'task') targetUrl = '/tasks';
      else if (toast.type === 'milestone') targetUrl = '/milestones';
      else if (toast.type === 'project') targetUrl = '/projects';
      else if (toast.type === 'meeting') targetUrl = '/crm';
      else if (toast.type === 'ai') targetUrl = '/ai/assistant';
      else targetUrl = '/notifications';
    }

    router.push(targetUrl);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        toasts,
        syncStatus,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
        dismissToast,
        addToast,
      }}
    >
      {children}

      {/* Floating Toast Notification Container (Top-Right Overlay) */}
      <div className="fixed top-16 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          const style = getToastStyles(toast.type);
          return (
            <div
              key={toast.id}
              onClick={() => handleToastClick(toast)}
              className={`pointer-events-auto p-3.5 rounded-xl bg-[#0b0f19]/95 border shadow-2xl backdrop-blur-md flex items-start gap-3 transform transition-all duration-300 animate-in fade-in slide-in-from-top-4 cursor-pointer group ${style.border}`}
            >
              <div className={`size-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${style.iconBg}`}>
                {style.icon}
              </div>

              <div className="flex-1 space-y-1 min-w-0 pr-2">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span className="truncate">{toast.title}</span>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded border shrink-0 ml-1 ${style.badge}`}>
                    NEW
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
                  {toast.message}
                </p>
                {toast.notifId || toast.actionUrl ? (
                  <div className="text-[10px] text-sky-400 font-medium group-hover:underline pt-0.5">
                    Click to view details &rarr;
                  </div>
                ) : null}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  dismissToast(toast.id);
                }}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
                aria-label="Close notification toast"
              >
                <X className="size-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

