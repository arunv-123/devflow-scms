'use client';

import React from 'react';
import { Calendar, Plus, Clock, Users, FileText } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { mockMeetings } from '@/lib/mockData';

export default function MeetingsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Meetings & Notes</h1>
            <p className="text-xs text-slate-400">Scheduled client reviews, sprint demos, and AI meeting summaries.</p>
          </div>
          <Button size="sm" className="bg-sky-600 hover:bg-sky-500 text-white text-xs gap-1.5 shadow-md shadow-sky-600/20">
            <Plus className="size-4" />
            <span>Schedule Meeting</span>
          </Button>
        </div>

        <div className="space-y-4">
          {mockMeetings.map((m) => (
            <div key={m.id} className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-semibold text-sky-400 uppercase tracking-wider">{m.clientName}</span>
                  <h3 className="text-base font-bold text-white">{m.title}</h3>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 font-semibold border border-purple-500/20">
                    {m.date} at {m.time} ({m.duration})
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 bg-[#060913] p-3 rounded-xl border border-slate-800">
                <span className="font-bold text-sky-300 block mb-1">Meeting Agenda & Notes:</span>
                {m.notes}
              </p>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span>Participants: {m.participants.join(', ')}</span>
                <span className="text-emerald-400 font-semibold">{m.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
