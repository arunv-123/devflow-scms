'use client';

import React, { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { mockMeetings } from '@/lib/mockData';
import { Meeting } from '@/types';
import { crmApi } from '@/services/crmApi';

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>(mockMeetings);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    clientName: 'Apex Capital Corp',
    date: new Date().toISOString().split('T')[0],
    time: '14:00 EST',
    duration: '45 mins',
    status: 'Scheduled' as const,
    participantsStr: 'Alex Morgan, Sarah Chen',
    notes: '',
  });

  const loadMeetings = () => {
    crmApi
      .getMeetings()
      .then((data) => {
        if (data && data.length > 0) setMeetings(data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadMeetings();
  }, []);

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.clientName || !formData.date || !formData.time) return;
    try {
      const participants = formData.participantsStr
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);

      await crmApi.createMeeting({
        title: formData.title,
        clientName: formData.clientName,
        date: formData.date,
        time: formData.time,
        duration: formData.duration,
        status: formData.status,
        participants,
        notes: formData.notes,
      });

      setIsModalOpen(false);
      setFormData({
        title: '',
        clientName: 'Apex Capital Corp',
        date: new Date().toISOString().split('T')[0],
        time: '14:00 EST',
        duration: '45 mins',
        status: 'Scheduled',
        participantsStr: 'Alex Morgan, Sarah Chen',
        notes: '',
      });
      loadMeetings();
    } catch (err) {
      console.error('Failed to schedule meeting', err);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Meetings & Notes</h1>
            <p className="text-xs text-slate-400">Scheduled client reviews, sprint demos, and AI meeting summaries.</p>
          </div>
          <Button
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="bg-sky-600 hover:bg-sky-500 text-white text-xs gap-1.5 shadow-md shadow-sky-600/20"
          >
            <Plus className="size-4" />
            <span>Schedule Meeting</span>
          </Button>
        </div>

        {/* Schedule Meeting Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl bg-[#0b0f19] border border-slate-800 p-6 space-y-4 text-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold">Schedule New Meeting</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleCreateMeeting} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Meeting Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                    placeholder="e.g. Q4 Sprint Architecture Review"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Client Name</label>
                  <input
                    type="text"
                    required
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                    placeholder="e.g. Apex Capital Corp"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1">Date</label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-2 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500 text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Time</label>
                    <input
                      type="text"
                      required
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="w-full px-2 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500 text-[11px]"
                      placeholder="14:00 EST"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Duration</label>
                    <input
                      type="text"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      className="w-full px-2 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500 text-[11px]"
                      placeholder="45 mins"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Participants (comma separated)</label>
                  <input
                    type="text"
                    value={formData.participantsStr}
                    onChange={(e) => setFormData({ ...formData, participantsStr: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                    placeholder="Alex Morgan, Sarah Chen, Marcus Vance"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Agenda & Notes</label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                    placeholder="Key topics to discuss during the call..."
                  />
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsModalOpen(false)}
                    className="text-slate-400 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-sky-600 hover:bg-sky-500 text-white text-xs">
                    Save Meeting
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {meetings.map((m) => (
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

              {m.notes && (
                <p className="text-xs text-slate-300 bg-[#060913] p-3 rounded-xl border border-slate-800">
                  <span className="font-bold text-sky-300 block mb-1">Meeting Agenda & Notes:</span>
                  {m.notes}
                </p>
              )}

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span>Participants: {Array.isArray(m.participants) ? m.participants.join(', ') : m.participants}</span>
                <span className="text-emerald-400 font-semibold">{m.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
