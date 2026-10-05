'use client';

import React, { useEffect, useState } from 'react';
import {
  Plus,
  X,
  Play,
  CheckCircle2,
  Ban,
  Calendar,
  Clock,
  Users,
  FileText,
  CheckSquare,
  Sparkles,
  ArrowRight,
  Search,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { mockMeetings } from '@/lib/mockData';
import { Meeting, MeetingStatus } from '@/types';
import { crmApi } from '@/services/crmApi';
import { formatDate } from '@/lib/formatters';
import { CountUpNumber } from '@/components/common/DataAnimation';

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>(mockMeetings);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);
  const [completingMeeting, setCompletingMeeting] = useState<Meeting | null>(null);

  // New Meeting Form state
  const [scheduleFormData, setScheduleFormData] = useState({
    title: '',
    clientName: 'Apex Capital Corp',
    date: new Date().toISOString().split('T')[0],
    time: '14:00 EST',
    duration: '45 mins',
    status: 'Scheduled' as MeetingStatus,
    participantsStr: 'Alex Morgan, Sarah Chen',
    notes: '',
  });

  // Complete Meeting Form state
  const [completeFormData, setCompleteFormData] = useState({
    notes: '',
    outcome: '',
    actionItems: [''],
    nextSteps: '',
  });
  const [completeError, setCompleteError] = useState<string>('');

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

  // Schedule New Meeting
  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleFormData.title || !scheduleFormData.clientName || !scheduleFormData.date || !scheduleFormData.time) {
      return;
    }
    try {
      const participants = scheduleFormData.participantsStr
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);

      await crmApi.createMeeting({
        title: scheduleFormData.title,
        clientName: scheduleFormData.clientName,
        date: scheduleFormData.date,
        time: scheduleFormData.time,
        duration: scheduleFormData.duration,
        status: 'Scheduled', // Always defaults to Scheduled
        participants,
        notes: scheduleFormData.notes,
      });

      setIsScheduleModalOpen(false);
      setScheduleFormData({
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

  // Action: Start Meeting (Scheduled -> In Progress)
  const handleStartMeeting = async (meeting: Meeting) => {
    try {
      await crmApi.updateMeeting(meeting.id, { status: 'In Progress' });
      loadMeetings();
    } catch (err) {
      console.error('Failed to start meeting', err);
    }
  };

  // Action: Open Complete Meeting Modal
  const openCompleteModal = (meeting: Meeting) => {
    setCompletingMeeting(meeting);
    setCompleteError('');
    setCompleteFormData({
      notes: meeting.notes || '',
      outcome: meeting.outcome || '',
      actionItems:
        Array.isArray(meeting.actionItems) && meeting.actionItems.length > 0
          ? meeting.actionItems
          : ['Prepare technical proposal', 'Estimate development timeline'],
      nextSteps: meeting.nextSteps || '',
    });
  };

  // Helper: Action items management in modal
  const handleActionItemChange = (index: number, value: string) => {
    const updated = [...completeFormData.actionItems];
    updated[index] = value;
    setCompleteFormData({ ...completeFormData, actionItems: updated });
  };

  const addActionItemField = () => {
    setCompleteFormData({
      ...completeFormData,
      actionItems: [...completeFormData.actionItems, ''],
    });
  };

  const removeActionItemField = (index: number) => {
    const updated = completeFormData.actionItems.filter((_, i) => i !== index);
    setCompleteFormData({
      ...completeFormData,
      actionItems: updated.length > 0 ? updated : [''],
    });
  };

  // Action: Submit Complete Meeting (In Progress -> Completed)
  const handleCompleteMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingMeeting) return;

    if (!completeFormData.notes.trim()) {
      setCompleteError('Meeting Notes are required.');
      return;
    }
    if (!completeFormData.outcome.trim()) {
      setCompleteError('Meeting Outcome is required.');
      return;
    }

    try {
      const filteredActionItems = completeFormData.actionItems
        .map((item) => item.trim())
        .filter(Boolean);

      await crmApi.updateMeeting(completingMeeting.id, {
        status: 'Completed',
        notes: completeFormData.notes.trim(),
        outcome: completeFormData.outcome.trim(),
        actionItems: filteredActionItems,
        nextSteps: completeFormData.nextSteps.trim(),
      });

      setCompletingMeeting(null);
      loadMeetings();
    } catch (err: any) {
      console.error('Failed to complete meeting', err);
      setCompleteError(err.response?.data?.error || 'Failed to complete meeting. Please check required fields.');
    }
  };

  // Action: Cancel Meeting
  const handleCancelMeeting = async (meeting: Meeting) => {
    try {
      await crmApi.updateMeeting(meeting.id, { status: 'Cancelled' });
      loadMeetings();
    } catch (err) {
      console.error('Failed to cancel meeting', err);
    }
  };

  // Filtered meetings
  const filteredMeetings = meetings.filter((m) => {
    const matchesStatus = filterStatus === 'ALL' || m.status === filterStatus;
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.notes && m.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.outcome && m.outcome.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  // Overview Counters
  const scheduledCount = meetings.filter((m) => m.status === 'Scheduled').length;
  const inProgressCount = meetings.filter((m) => m.status === 'In Progress').length;
  const completedCount = meetings.filter((m) => m.status === 'Completed').length;
  const cancelledCount = meetings.filter((m) => m.status === 'Cancelled').length;

  const getStatusBadge = (status: MeetingStatus) => {
    switch (status) {
      case 'Scheduled':
        return (
          <span className="px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-400 font-semibold border border-sky-500/20 text-xs flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-sky-400"></span>
            Scheduled
          </span>
        );
      case 'In Progress':
        return (
          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/20 text-xs flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            In Progress
          </span>
        );
      case 'Completed':
        return (
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20 text-xs flex items-center gap-1.5">
            <CheckCircle2 className="size-3 text-emerald-400" />
            Completed
          </span>
        );
      case 'Cancelled':
        return (
          <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 font-semibold border border-rose-500/20 text-xs flex items-center gap-1.5">
            <Ban className="size-3 text-rose-400" />
            Cancelled
          </span>
        );
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 pb-12">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Meetings & Notes Workflow</h1>
            <p className="text-xs text-slate-400">
              Track client meetings lifecycle, record notes & outcomes, and manage actionable next steps.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setIsScheduleModalOpen(true)}
            className="bg-sky-600 hover:bg-sky-500 text-white text-xs gap-1.5 shadow-md shadow-sky-600/20"
          >
            <Plus className="size-4" />
            <span>Schedule Meeting</span>
          </Button>
        </div>

        {/* Status Counters Header */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            onClick={() => setFilterStatus('Scheduled')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              filterStatus === 'Scheduled'
                ? 'bg-sky-500/10 border-sky-500/40 text-white'
                : 'bg-[#0b0f19] border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="text-[11px] font-semibold uppercase tracking-wider text-sky-400">Scheduled</div>
            <div className="text-2xl font-extrabold text-white mt-1">
              <CountUpNumber value={scheduledCount} />
            </div>
          </div>

          <div
            onClick={() => setFilterStatus('In Progress')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              filterStatus === 'In Progress'
                ? 'bg-amber-500/10 border-amber-500/40 text-white'
                : 'bg-[#0b0f19] border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">In Progress</div>
            <div className="text-2xl font-extrabold text-white mt-1">
              <CountUpNumber value={inProgressCount} />
            </div>
          </div>

          <div
            onClick={() => setFilterStatus('Completed')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              filterStatus === 'Completed'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                : 'bg-[#0b0f19] border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">Completed</div>
            <div className="text-2xl font-extrabold text-white mt-1">
              <CountUpNumber value={completedCount} />
            </div>
          </div>

          <div
            onClick={() => setFilterStatus('Cancelled')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              filterStatus === 'Cancelled'
                ? 'bg-rose-500/10 border-rose-500/40 text-white'
                : 'bg-[#0b0f19] border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="text-[11px] font-semibold uppercase tracking-wider text-rose-400">Cancelled</div>
            <div className="text-2xl font-extrabold text-white mt-1">
              <CountUpNumber value={cancelledCount} />
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-[#0b0f19] border border-slate-800">
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'Scheduled', 'In Progress', 'Completed', 'Cancelled'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                  filterStatus === st
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {st === 'ALL' ? 'All Meetings' : st}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 size-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search meetings, clients..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#060913] border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Schedule Meeting Modal */}
        {isScheduleModalOpen && (
          <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-screen z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
            <div className="relative w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl bg-[#0b0f19] border border-slate-800 p-6 text-white shadow-2xl z-10">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
                <h3 className="text-base font-bold">Schedule New Meeting</h3>
                <button onClick={() => setIsScheduleModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleScheduleMeeting} className="flex flex-col min-h-0 overflow-hidden mt-3">
                <div className="overflow-y-auto pr-1 space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Meeting Title</label>
                    <input
                      type="text"
                      required
                      value={scheduleFormData.title}
                      onChange={(e) => setScheduleFormData({ ...scheduleFormData, title: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                      placeholder="e.g. Q4 Sprint Architecture Review"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Client Name</label>
                    <input
                      type="text"
                      required
                      value={scheduleFormData.clientName}
                      onChange={(e) => setScheduleFormData({ ...scheduleFormData, clientName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                      placeholder="e.g. Apex Capital Corp"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Date</label>
                      <input
                        type="date"
                        required
                        value={scheduleFormData.date}
                        onChange={(e) => setScheduleFormData({ ...scheduleFormData, date: e.target.value })}
                        className="w-full px-2 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500 text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Time</label>
                      <input
                        type="text"
                        required
                        value={scheduleFormData.time}
                        onChange={(e) => setScheduleFormData({ ...scheduleFormData, time: e.target.value })}
                        className="w-full px-2 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500 text-[11px]"
                        placeholder="14:00 EST"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Duration</label>
                      <input
                        type="text"
                        value={scheduleFormData.duration}
                        onChange={(e) => setScheduleFormData({ ...scheduleFormData, duration: e.target.value })}
                        className="w-full px-2 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500 text-[11px]"
                        placeholder="45 mins"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Participants (comma separated)</label>
                    <input
                      type="text"
                      value={scheduleFormData.participantsStr}
                      onChange={(e) => setScheduleFormData({ ...scheduleFormData, participantsStr: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                      placeholder="Alex Morgan, Sarah Chen, Marcus Vance"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Initial Agenda & Notes</label>
                    <textarea
                      rows={3}
                      value={scheduleFormData.notes}
                      onChange={(e) => setScheduleFormData({ ...scheduleFormData, notes: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                      placeholder="Key topics or agenda for discussion..."
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end gap-2 shrink-0 mt-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsScheduleModalOpen(false)}
                    className="text-slate-400 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-sky-600 hover:bg-sky-500 text-white text-xs">
                    Save & Schedule
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Complete Meeting Modal */}
        {completingMeeting && (
          <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-screen z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
            <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl bg-[#0b0f19] border border-slate-800 p-6 text-white shadow-2xl z-10">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
                <div>
                  <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                    Complete Meeting
                  </span>
                  <h3 className="text-base font-bold">{completingMeeting.title}</h3>
                </div>
                <button onClick={() => setCompletingMeeting(null)} className="text-slate-400 hover:text-white">
                  <X className="size-5" />
                </button>
              </div>

              {completeError && (
                <div className="mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2 shrink-0">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{completeError}</span>
                </div>
              )}

              <form onSubmit={handleCompleteMeeting} className="flex flex-col min-h-0 overflow-hidden mt-3">
                <div className="overflow-y-auto pr-1 space-y-4 text-xs">
                  {/* 1. Meeting Notes (multiline, required) */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                      <FileText className="size-3.5 text-sky-400" />
                      Meeting Notes <span className="text-rose-400">*</span>
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={completeFormData.notes}
                      onChange={(e) => setCompleteFormData({ ...completeFormData, notes: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-emerald-500 placeholder-slate-500"
                      placeholder="e.g. Tony Stark discussed requirements for a real-time cybersecurity monitoring platform."
                    />
                  </div>

                  {/* 2. Outcome (multiline, required) */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                      <Sparkles className="size-3.5 text-purple-400" />
                      Outcome <span className="text-rose-400">*</span>
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={completeFormData.outcome}
                      onChange={(e) => setCompleteFormData({ ...completeFormData, outcome: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-emerald-500 placeholder-slate-500"
                      placeholder="e.g. Client is interested and requested a technical proposal."
                    />
                  </div>

                  {/* 3. Action Items (multiple item list) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                        <CheckSquare className="size-3.5 text-amber-400" />
                        Action Items
                      </label>
                      <button
                        type="button"
                        onClick={addActionItemField}
                        className="text-sky-400 hover:text-sky-300 text-[11px] font-medium flex items-center gap-1"
                      >
                        <Plus className="size-3" />
                        <span>Add Item</span>
                      </button>
                    </div>
                    <div className="space-y-2">
                      {completeFormData.actionItems.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => handleActionItemChange(idx, e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-emerald-500 text-xs placeholder-slate-500"
                            placeholder={`Action item ${idx + 1}... (e.g. Prepare technical proposal)`}
                          />
                          {completeFormData.actionItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeActionItemField(idx)}
                              className="text-slate-500 hover:text-rose-400 p-1"
                              title="Remove Action Item"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 4. Next Steps (multiline, optional) */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                      <ArrowRight className="size-3.5 text-sky-400" />
                      Next Steps <span className="text-slate-500 font-normal">(optional)</span>
                    </label>
                    <textarea
                      rows={2}
                      value={completeFormData.nextSteps}
                      onChange={(e) => setCompleteFormData({ ...completeFormData, nextSteps: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-emerald-500 placeholder-slate-500"
                      placeholder="e.g. Schedule proposal review with Tony Stark."
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end gap-2 shrink-0 mt-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setCompletingMeeting(null)}
                    className="text-slate-400 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1.5 shadow-md shadow-emerald-600/20"
                  >
                    <CheckCircle2 className="size-4" />
                    <span>Save & Complete Meeting</span>
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Meetings List */}
        <div className="space-y-4">
          {filteredMeetings.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-3">
              <Calendar className="size-10 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No meetings found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No meetings match your current filter criteria. Schedule a new meeting or reset your filters.
              </p>
              <Button
                size="sm"
                onClick={() => {
                  setFilterStatus('ALL');
                  setSearchQuery('');
                }}
                className="bg-slate-800 hover:bg-slate-700 text-white text-xs"
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            filteredMeetings.map((m) => {
              const isScheduled = m.status === 'Scheduled';
              const isInProgress = m.status === 'In Progress';
              const isCompleted = m.status === 'Completed';
              const isCancelled = m.status === 'Cancelled';

              return (
                <div
                  key={m.id}
                  className={`p-6 rounded-2xl bg-[#0b0f19] border transition-all space-y-4 ${
                    isInProgress
                      ? 'border-amber-500/40 shadow-lg shadow-amber-500/5'
                      : isCompleted
                      ? 'border-slate-800 hover:border-emerald-500/30'
                      : isCancelled
                      ? 'border-slate-800/60 opacity-85'
                      : 'border-slate-800 hover:border-sky-500/30'
                  }`}
                >
                  {/* Top Bar: Title, Client, Status & Action Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">
                          {m.clientName}
                        </span>
                        {getStatusBadge(m.status)}
                      </div>
                      <h3 className="text-base font-bold text-white">{m.title}</h3>
                    </div>

                    {/* ACTION BUTTONS WORKFLOW */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Scheduled -> Start Meeting / Cancel Meeting */}
                      {isScheduled && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleStartMeeting(m)}
                            className="bg-sky-600 hover:bg-sky-500 text-white text-xs gap-1.5 shadow-md shadow-sky-600/20"
                            title="Start Meeting (Transition to In Progress)"
                          >
                            <Play className="size-3.5 fill-current" />
                            <span>Start Meeting</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCancelMeeting(m)}
                            className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs gap-1"
                            title="Cancel Meeting"
                          >
                            <Ban className="size-3.5" />
                            <span>Cancel</span>
                          </Button>
                        </>
                      )}

                      {/* In Progress -> Complete Meeting / Cancel Meeting */}
                      {isInProgress && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => openCompleteModal(m)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1.5 shadow-md shadow-emerald-600/20 animate-pulse"
                            title="Complete Meeting and add notes/outcome"
                          >
                            <CheckCircle2 className="size-4" />
                            <span>Complete Meeting</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCancelMeeting(m)}
                            className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs gap-1"
                            title="Cancel Meeting"
                          >
                            <Ban className="size-3.5" />
                            <span>Cancel</span>
                          </Button>
                        </>
                      )}

                      {/* Completed / Cancelled meetings do NOT show Start/Complete buttons */}
                    </div>
                  </div>

                  {/* Metadata Row: Date, Time, Duration, Participants */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-400 bg-[#060913] p-3 rounded-xl border border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <Calendar className="size-3.5 text-slate-500 shrink-0" />
                      <span>
                        <strong className="text-slate-300">Date & Time:</strong> {formatDate(m.date)} at {m.time} ({m.duration})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="size-3.5 text-slate-500 shrink-0" />
                      <span>
                        <strong className="text-slate-300">Participants:</strong>{' '}
                        {Array.isArray(m.participants) ? m.participants.join(', ') : m.participants}
                      </span>
                    </div>
                  </div>

                  {/* Meeting Notes Block */}
                  {m.notes && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-sky-300 flex items-center gap-1.5">
                        <FileText className="size-3.5" />
                        Meeting Notes:
                      </span>
                      <p className="text-xs text-slate-300 bg-[#060913] p-3 rounded-xl border border-slate-800 whitespace-pre-line leading-relaxed">
                        {m.notes}
                      </p>
                    </div>
                  )}

                  {/* Outcome Block (if completed) */}
                  {m.outcome && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                        <Sparkles className="size-3.5" />
                        Outcome:
                      </span>
                      <div className="text-xs text-emerald-200/90 bg-emerald-950/20 p-3 rounded-xl border border-emerald-800/40 whitespace-pre-line leading-relaxed">
                        {m.outcome}
                      </div>
                    </div>
                  )}

                  {/* Action Items Block (if completed) */}
                  {m.actionItems && m.actionItems.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                        <CheckSquare className="size-3.5" />
                        Action Items:
                      </span>
                      <ul className="space-y-1.5 text-xs text-slate-300 bg-[#060913] p-3 rounded-xl border border-slate-800">
                        {m.actionItems.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="size-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Next Steps Block (if completed and present) */}
                  {m.nextSteps && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-sky-400 flex items-center gap-1.5">
                        <ArrowRight className="size-3.5" />
                        Next Steps:
                      </span>
                      <p className="text-xs text-slate-300 bg-[#060913] p-3 rounded-xl border border-slate-800 whitespace-pre-line leading-relaxed">
                        {m.nextSteps}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </AppLayout>
  );
}
