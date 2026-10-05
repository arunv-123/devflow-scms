'use client';

import React from 'react';
import { useNotifications, SyncStatus } from '@/context/NotificationContext';
import { RefreshCw } from 'lucide-react';

interface LiveSyncStatusProps {
  className?: string;
}

export function LiveSyncStatus({ className = '' }: LiveSyncStatusProps) {
  const { syncStatus } = useNotifications();

  switch (syncStatus) {
    case 'connected':
      return (
        <span
          className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 transition-all select-none ${className}`}
          title="Real-time live sync connected"
        >
          <span className="relative flex size-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full size-1.5 bg-emerald-500"></span>
          </span>
          <span>Live Sync</span>
        </span>
      );

    case 'connecting':
      return (
        <span
          className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 transition-all select-none ${className}`}
          title="Connecting to sync server..."
        >
          <span className="size-1.5 rounded-full bg-sky-400 animate-pulse"></span>
          <span>Connecting...</span>
        </span>
      );

    case 'reconnecting':
      return (
        <span
          className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 transition-all select-none ${className}`}
          title="Reconnecting to sync server..."
        >
          <RefreshCw className="size-3 animate-spin text-amber-400" />
          <span>Reconnecting...</span>
        </span>
      );

    case 'disconnected':
    default:
      return (
        <span
          className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 transition-all select-none ${className}`}
          title="Sync offline / Server disconnected"
        >
          <span className="size-1.5 rounded-full bg-rose-500"></span>
          <span>Offline</span>
        </span>
      );
  }
}
