'use client';

import React from 'react';
import { Bell, Check, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { mockNotifications } from '@/lib/mockData';

export default function NotificationsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Notifications Center</h1>
            <p className="text-xs text-slate-400">System alerts, AI recommendations, task updates, and milestone achievements.</p>
          </div>
          <Button size="sm" variant="outline" className="border-slate-800 text-xs gap-1.5">
            <Check className="size-4 text-emerald-400" />
            <span>Mark All as Read</span>
          </Button>
        </div>

        <div className="space-y-3">
          {mockNotifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-2xl border transition-all flex items-start gap-4 ${
                !n.read ? 'bg-[#0b0f19] border-sky-500/30' : 'bg-[#060913] border-slate-800/60'
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
      </div>
    </AppLayout>
  );
}
