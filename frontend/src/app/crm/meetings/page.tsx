'use client';

import React, { useEffect, useState, useMemo } from 'react';
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
  Edit2,
  Loader2,
  Building2,
  UserCheck,
  RefreshCw,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { SearchableSelect, SelectOption } from '@/components/ui/searchable-select';
import { SearchableMultiSelect, MultiSelectOption } from '@/components/ui/searchable-multi-select';
import { mockMeetings } from '@/lib/mockData';
import { Meeting, MeetingStatus, CustomerType, Lead, Client, TeamMember } from '@/types';
import { crmApi } from '@/services/crmApi';
import { usersApi } from '@/services/usersApi';
import { formatDate, formatCurrency } from '@/lib/formatters';
import { CountUpNumber } from '@/components/common/DataAnimation';
import { useAuth } from '@/context/AuthContext';

export default function MeetingsPage() {
  const { user } = useAuth();
  const canManageMeetings = user
    ? ['Super Admin', 'Admin', 'Project Manager', 'Project Coordinator'].includes(user.role)
    : true;
  const canDeleteMeetings = user
    ? ['Super Admin', 'Admin', 'Project Manager'].includes(user.role)
    : true;

  // Master Data State
  const [meetings, setMeetings] = useState<Meeting[]>(mockMeetings);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // Loading & Error States
  const [isLoadingMeetings, setIsLoadingMeetings] = useState<boolean>(true);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState<boolean>(true);
  const [customerError, setCustomerError] = useState<string | null>(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(true);
  const [usersError, setUsersError] = useState<string | null>(null);

  // Filters & Search
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form Modal State (Unified for Create & Edit)
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Meeting Form Data
  const [formData, setFormData] = useState({
    title: '',
    customerType: 'Lead' as CustomerType,
    leadId: '',
    clientId: '',
    clientName: '',
    legacyClientName: '',
    date: new Date().toISOString().split('T')[0],
    time: '14:00 EST',
    duration: '45 mins',
    status: 'Scheduled' as MeetingStatus,
    participantIds: [] as string[],
    notes: '',
    outcome: '',
    actionItems: [''],
    nextSteps: '',
  });

  // Complete Meeting Modal state
  const [completingMeeting, setCompletingMeeting] = useState<Meeting | null>(null);
  const [completeFormData, setCompleteFormData] = useState({
    notes: '',
    outcome: '',
    actionItems: [''],
    nextSteps: '',
  });
  const [completeError, setCompleteError] = useState<string>('');

  // 1. Fetch Meetings
  const loadMeetings = async () => {
    setIsLoadingMeetings(true);
    try {
      const data = await crmApi.getMeetings();
      if (data && data.length > 0) {
        setMeetings(data);
      }
    } catch (err) {
      console.error('Failed to load meetings:', err);
    } finally {
      setIsLoadingMeetings(false);
    }
  };

  // 2. Fetch Customers (Leads & Clients)
  const loadCustomers = async () => {
    setIsLoadingCustomers(true);
    setCustomerError(null);
    try {
      const [leadsData, clientsData] = await Promise.all([
        crmApi.getLeads().catch((e) => {
          console.warn('Leads fetch warning:', e);
          return [] as Lead[];
        }),
        crmApi.getClients().catch((e) => {
          console.warn('Clients fetch warning:', e);
          return [] as Client[];
        }),
      ]);
      setLeads(leadsData);
      setClients(clientsData);
    } catch (err: any) {
      console.error('Failed to load customers:', err);
      setCustomerError('Failed to load leads and clients from CRM.');
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  // 3. Fetch Users for Participants
  const loadUsers = async () => {
    setIsLoadingUsers(true);
    setUsersError(null);
    try {
      const usersData = await usersApi.getUsers().catch((e) => {
        console.warn('Users fetch warning:', e);
        return [] as TeamMember[];
      });
      setTeamMembers(usersData);
    } catch (err: any) {
      console.error('Failed to load team members:', err);
      setUsersError('Failed to load team members directory.');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadMeetings();
    loadCustomers();
    loadUsers();
  }, []);

  // Format Lead options for SearchableSelect
  const leadOptions: SelectOption[] = useMemo(() => {
    return leads.map((l) => {
      const formattedValue = l.value ? ` · ${formatCurrency(l.value)}` : '';
      return {
        value: l.id,
        label: l.name,
        subLabel: `${l.company} · ${l.email}${formattedValue}`,
        badge: l.status,
        group: l.status !== 'Lost' ? 'Active Pipeline Leads' : 'Archived / Lost',
      };
    });
  }, [leads]);

  // Format Client options for SearchableSelect
  const clientOptions: SelectOption[] = useMemo(() => {
    return clients.map((c) => {
      return {
        value: c.id,
        label: c.company || c.name,
        subLabel: `${c.name} · ${c.email} · ${c.activeProjects || 0} active project(s)`,
        badge: c.status,
        group: 'Existing Clients',
      };
    });
  }, [clients]);

  // Format User options for SearchableMultiSelect
  const participantOptions: MultiSelectOption[] = useMemo(() => {
    return teamMembers.map((u) => {
      return {
        value: u.id,
        label: u.name,
        subLabel: `${u.role} · ${u.department || 'Engineering'} · ${u.email}`,
        badge: u.role,
        avatar: u.avatar,
      };
    });
  }, [teamMembers]);

  // Open Create Meeting Modal
  const openCreateModal = () => {
    setFormMode('create');
    setEditingMeetingId(null);
    setFormError(null);

    // Default to lead if leads exist, else client
    const defaultCustType: CustomerType = leads.length > 0 ? 'Lead' : 'Client';
    const initialLeadId = leads.length > 0 ? leads[0].id : '';
    const initialClientId = clients.length > 0 ? clients[0].id : '';

    // Automatically include logged in user as an initial participant if available
    const initialParticipantIds: string[] = [];
    if (user && teamMembers.some((t) => t.id === user.id)) {
      initialParticipantIds.push(user.id);
    } else if (teamMembers.length > 0) {
      initialParticipantIds.push(teamMembers[0].id);
    }

    setFormData({
      title: '',
      customerType: defaultCustType,
      leadId: defaultCustType === 'Lead' ? initialLeadId : '',
      clientId: defaultCustType === 'Client' ? initialClientId : '',
      clientName: '',
      legacyClientName: '',
      date: new Date().toISOString().split('T')[0],
      time: '14:00 EST',
      duration: '45 mins',
      status: 'Scheduled',
      participantIds: initialParticipantIds,
      notes: '',
      outcome: '',
      actionItems: [''],
      nextSteps: '',
    });

    setIsFormModalOpen(true);
  };

  // Open Edit Meeting Modal
  const openEditModal = (meeting: Meeting) => {
    setFormMode('edit');
    setEditingMeetingId(meeting.id);
    setFormError(null);

    let detectedCustType: CustomerType = meeting.customerType || 'Client';
    let detectedLeadId = meeting.leadId || '';
    let detectedClientId = meeting.clientId || '';
    let legacyName = '';

    // If meeting has neither leadId nor clientId (legacy record)
    if (!detectedLeadId && !detectedClientId) {
      legacyName = meeting.clientName || '';
      // Try to intelligently match with existing clients
      const matchedClient = clients.find(
        (c) =>
          c.company.toLowerCase() === legacyName.toLowerCase() ||
          c.name.toLowerCase() === legacyName.toLowerCase()
      );
      if (matchedClient) {
        detectedCustType = 'Client';
        detectedClientId = matchedClient.id;
      } else {
        // Try matching with existing leads
        const matchedLead = leads.find(
          (l) =>
            l.company.toLowerCase() === legacyName.toLowerCase() ||
            l.name.toLowerCase() === legacyName.toLowerCase()
        );
        if (matchedLead) {
          detectedCustType = 'Lead';
          detectedLeadId = matchedLead.id;
        } else {
          detectedCustType = 'Client';
        }
      }
    }

    // Resolve Participant IDs
    let resolvedParticipantIds: string[] = [];
    if (Array.isArray(meeting.participantIds) && meeting.participantIds.length > 0) {
      resolvedParticipantIds = meeting.participantIds;
    } else if (Array.isArray(meeting.participants) && meeting.participants.length > 0) {
      // Map legacy participant names to registered user IDs
      meeting.participants.forEach((name) => {
        const matchedUser = teamMembers.find(
          (u) =>
            u.name.toLowerCase().trim() === name.toLowerCase().trim() ||
            u.email.toLowerCase().trim() === name.toLowerCase().trim()
        );
        if (matchedUser && !resolvedParticipantIds.includes(matchedUser.id)) {
          resolvedParticipantIds.push(matchedUser.id);
        }
      });
    }

    setFormData({
      title: meeting.title,
      customerType: detectedCustType,
      leadId: detectedLeadId,
      clientId: detectedClientId,
      clientName: meeting.clientName || '',
      legacyClientName: legacyName,
      date: meeting.date,
      time: meeting.time,
      duration: meeting.duration || '45 mins',
      status: meeting.status,
      participantIds: resolvedParticipantIds,
      notes: meeting.notes || '',
      outcome: meeting.outcome || '',
      actionItems:
        Array.isArray(meeting.actionItems) && meeting.actionItems.length > 0
          ? meeting.actionItems
          : [''],
      nextSteps: meeting.nextSteps || '',
    });

    setIsFormModalOpen(true);
  };

  // Submit Create or Edit Meeting Form
  const handleSaveMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.title.trim()) {
      setFormError('Please enter a meeting title.');
      return;
    }
    if (!formData.date || !formData.time.trim()) {
      setFormError('Please enter meeting date and time.');
      return;
    }

    // Validate Customer Selection
    let resolvedClientName = '';
    if (formData.customerType === 'Lead') {
      if (!formData.leadId) {
        setFormError('Please select a lead from the dropdown.');
        return;
      }
      const selectedLead = leads.find((l) => l.id === formData.leadId);
      resolvedClientName = selectedLead ? (selectedLead.company || selectedLead.name) : formData.clientName;
    } else {
      // Client
      if (!formData.clientId) {
        setFormError('Please select a client from the dropdown.');
        return;
      }
      const selectedClient = clients.find((c) => c.id === formData.clientId);
      resolvedClientName = selectedClient ? (selectedClient.company || selectedClient.name) : formData.clientName;
    }

    if (formData.participantIds.length === 0) {
      setFormError('Please select at least one meeting participant.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<Meeting> = {
        title: formData.title.trim(),
        customerType: formData.customerType,
        leadId: formData.customerType === 'Lead' ? formData.leadId : undefined,
        clientId: formData.customerType === 'Client' ? formData.clientId : undefined,
        clientName: resolvedClientName,
        date: formData.date,
        time: formData.time.trim(),
        duration: formData.duration.trim() || '30 mins',
        status: formData.status,
        participantIds: formData.participantIds,
        notes: formData.notes.trim(),
      };

      if (formMode === 'create') {
        await crmApi.createMeeting({
          ...payload,
          status: 'Scheduled',
        });
      } else if (editingMeetingId) {
        const filteredActionItems = formData.actionItems.map((a) => a.trim()).filter(Boolean);
        await crmApi.updateMeeting(editingMeetingId, {
          ...payload,
          outcome: formData.outcome.trim(),
          actionItems: filteredActionItems,
          nextSteps: formData.nextSteps.trim(),
        });
      }

      setIsFormModalOpen(false);
      await loadMeetings();
    } catch (err: any) {
      console.error('Failed to save meeting:', err);
      const msg = err.response?.data?.error || err.message || 'Failed to save meeting. Please try again.';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Meeting
  const handleDeleteMeeting = async (meetingId: string) => {
    if (!confirm('Are you sure you want to delete this meeting record? This action cannot be undone.')) {
      return;
    }
    try {
      await crmApi.deleteMeeting(meetingId);
      await loadMeetings();
    } catch (err) {
      console.error('Failed to delete meeting:', err);
      alert('Failed to delete meeting. You may not have administrative permissions.');
    }
  };

  // Action: Start Meeting (Scheduled -> In Progress)
  const handleStartMeeting = async (meeting: Meeting) => {
    try {
      await crmApi.updateMeeting(meeting.id, { status: 'In Progress' });
      await loadMeetings();
    } catch (err) {
      console.error('Failed to start meeting:', err);
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

  // Complete modal action item helpers
  const handleCompleteActionItemChange = (index: number, value: string) => {
    const updated = [...completeFormData.actionItems];
    updated[index] = value;
    setCompleteFormData({ ...completeFormData, actionItems: updated });
  };

  const addCompleteActionItemField = () => {
    setCompleteFormData({
      ...completeFormData,
      actionItems: [...completeFormData.actionItems, ''],
    });
  };

  const removeCompleteActionItemField = (index: number) => {
    const updated = completeFormData.actionItems.filter((_, i) => i !== index);
    setCompleteFormData({
      ...completeFormData,
      actionItems: updated.length > 0 ? updated : [''],
    });
  };

  // Submit Complete Meeting
  const handleCompleteMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingMeeting) return;

    if (!completeFormData.notes.trim()) {
      setCompleteError('Meeting Notes are required when completing a meeting.');
      return;
    }
    if (!completeFormData.outcome.trim()) {
      setCompleteError('Meeting Outcome is required when completing a meeting.');
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
      await loadMeetings();
    } catch (err: any) {
      console.error('Failed to complete meeting:', err);
      setCompleteError(err.response?.data?.error || 'Failed to complete meeting. Please check required fields.');
    }
  };

  // Action: Cancel Meeting
  const handleCancelMeeting = async (meeting: Meeting) => {
    try {
      await crmApi.updateMeeting(meeting.id, { status: 'Cancelled' });
      await loadMeetings();
    } catch (err) {
      console.error('Failed to cancel meeting:', err);
    }
  };

  // Filtered meetings
  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) => {
      const matchesStatus = filterStatus === 'ALL' || m.status === filterStatus;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        m.title.toLowerCase().includes(q) ||
        (m.clientName && m.clientName.toLowerCase().includes(q)) ||
        (m.notes && m.notes.toLowerCase().includes(q)) ||
        (m.outcome && m.outcome.toLowerCase().includes(q)) ||
        (Array.isArray(m.participants) && m.participants.some((p) => p.toLowerCase().includes(q)));
      return matchesStatus && matchesSearch;
    });
  }, [meetings, filterStatus, searchQuery]);

  // Overview Counters
  const scheduledCount = meetings.filter((m) => m.status === 'Scheduled').length;
  const inProgressCount = meetings.filter((m) => m.status === 'In Progress').length;
  const completedCount = meetings.filter((m) => m.status === 'Completed').length;
  const cancelledCount = meetings.filter((m) => m.status === 'Cancelled').length;

  const getStatusBadge = (status: MeetingStatus) => {
    switch (status) {
      case 'Scheduled':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 font-semibold border border-sky-500/20 text-[11px] flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-sky-400"></span>
            Scheduled
          </span>
        );
      case 'In Progress':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/20 text-[11px] flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            In Progress
          </span>
        );
      case 'Completed':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20 text-[11px] flex items-center gap-1.5">
            <CheckCircle2 className="size-3 text-emerald-400" />
            Completed
          </span>
        );
      case 'Cancelled':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 font-semibold border border-rose-500/20 text-[11px] flex items-center gap-1.5">
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
          {canManageMeetings && (
            <Button
              size="sm"
              onClick={openCreateModal}
              className="bg-sky-600 hover:bg-sky-500 text-white text-xs gap-1.5 shadow-md shadow-sky-600/20"
            >
              <Plus className="size-4" />
              <span>Schedule Meeting</span>
            </Button>
          )}
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
              placeholder="Search meetings, customers, participants..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#060913] border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Schedule / Edit Meeting Modal */}
        {isFormModalOpen && (
          <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-screen z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
            <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl bg-[#0b0f19] border border-slate-800 p-6 text-white shadow-2xl z-10">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Calendar className="size-4 text-sky-400" />
                    <span>{formMode === 'create' ? 'Schedule New Meeting' : 'Edit Meeting Details'}</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {formMode === 'create'
                      ? 'Select an active lead or existing client and assign participants from the team.'
                      : 'Update meeting schedule, associated customer, or assigned team participants.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="size-5" />
                </button>
              </div>

              {formError && (
                <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center gap-2 shrink-0 animate-fadeIn">
                  <AlertCircle className="size-4 shrink-0 text-rose-400" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Form Body */}
              <form onSubmit={handleSaveMeeting} className="flex flex-col min-h-0 overflow-hidden mt-3">
                <div className="overflow-y-auto pr-1 space-y-4 text-xs">
                  {/* Meeting Title */}
                  <div>
                    <label className="block text-slate-300 mb-1 font-medium">
                      Meeting Title <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                      placeholder="e.g. Enterprise Platform Architecture Review"
                    />
                  </div>

                  {/* Customer Type Selector & Dynamic Dropdown */}
                  <div className="space-y-2 p-3 rounded-xl bg-[#060913]/70 border border-slate-800/80">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-300 font-medium flex items-center gap-1.5">
                        <Building2 className="size-3.5 text-sky-400" />
                        <span>Customer Association <span className="text-rose-400">*</span></span>
                      </label>
                      {/* Customer Type Selector (Lead vs Client) */}
                      <div className="flex items-center bg-[#0b0f19] p-0.5 rounded-lg border border-slate-800">
                        <button
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              customerType: 'Lead',
                              leadId: prev.leadId || (leads[0]?.id || ''),
                            }));
                          }}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                            formData.customerType === 'Lead'
                              ? 'bg-purple-600 text-white shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Lead (Pipeline)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              customerType: 'Client',
                              clientId: prev.clientId || (clients[0]?.id || ''),
                            }));
                          }}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                            formData.customerType === 'Client'
                              ? 'bg-sky-600 text-white shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Client (Existing)
                        </button>
                      </div>
                    </div>

                    {/* Legacy record hint if present */}
                    {formData.legacyClientName && !formData.leadId && !formData.clientId && (
                      <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-center gap-2">
                        <AlertCircle className="size-3.5 shrink-0" />
                        <span>
                          Legacy meeting record was stored as name: <strong className="text-white">{formData.legacyClientName}</strong>. Select a matching CRM record below to link permanently.
                        </span>
                      </div>
                    )}

                    {/* Dynamic Dropdown for Lead */}
                    {formData.customerType === 'Lead' ? (
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                          <span>Select Eligible Lead</span>
                          {customerError && (
                            <button
                              type="button"
                              onClick={loadCustomers}
                              className="text-rose-400 hover:underline flex items-center gap-1"
                            >
                              <RefreshCw className="size-3" /> Retry
                            </button>
                          )}
                        </div>
                        <SearchableSelect
                          options={leadOptions}
                          value={formData.leadId}
                          onChange={(val) => setFormData({ ...formData, leadId: val })}
                          placeholder="Search and select lead by name or company..."
                          loading={isLoadingCustomers}
                          error={customerError || undefined}
                          emptyMessage="No leads found in CRM. Create a lead first."
                        />
                      </div>
                    ) : (
                      /* Dynamic Dropdown for Client */
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                          <span>Select Existing Client</span>
                          {customerError && (
                            <button
                              type="button"
                              onClick={loadCustomers}
                              className="text-rose-400 hover:underline flex items-center gap-1"
                            >
                              <RefreshCw className="size-3" /> Retry
                            </button>
                          )}
                        </div>
                        <SearchableSelect
                          options={clientOptions}
                          value={formData.clientId}
                          onChange={(val) => setFormData({ ...formData, clientId: val })}
                          placeholder="Search and select client by company or contact..."
                          loading={isLoadingCustomers}
                          error={customerError || undefined}
                          emptyMessage="No clients found in CRM. Convert a lead or create a client first."
                        />
                      </div>
                    )}
                  </div>

                  {/* Date, Time, Duration Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-slate-300 mb-1 font-medium">Date <span className="text-rose-400">*</span></label>
                      <input
                        type="date"
                        required
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full px-2.5 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500 text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 mb-1 font-medium">Time <span className="text-rose-400">*</span></label>
                      <input
                        type="text"
                        required
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        className="w-full px-2.5 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500 text-[11px]"
                        placeholder="14:00 EST"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 mb-1 font-medium">Duration</label>
                      <input
                        type="text"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        className="w-full px-2.5 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500 text-[11px]"
                        placeholder="45 mins"
                      />
                    </div>
                  </div>

                  {/* Dynamic Multi-Select Dropdown for Participants */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-300 font-medium flex items-center gap-1.5">
                        <Users className="size-3.5 text-sky-400" />
                        <span>Meeting Participants <span className="text-rose-400">*</span></span>
                      </label>
                      {usersError && (
                        <button
                          type="button"
                          onClick={loadUsers}
                          className="text-rose-400 hover:underline text-[11px] flex items-center gap-1"
                        >
                          <RefreshCw className="size-3" /> Retry
                        </button>
                      )}
                    </div>
                    <SearchableMultiSelect
                      options={participantOptions}
                      selectedValues={formData.participantIds}
                      onChange={(newSelected) => setFormData({ ...formData, participantIds: newSelected })}
                      placeholder="Search and select team members..."
                      loading={isLoadingUsers}
                      error={usersError || undefined}
                      emptyMessage="No team members found in directory."
                    />
                  </div>

                  {/* Meeting Status Selector (Available in Edit Mode) */}
                  {formMode === 'edit' && (
                    <div>
                      <label className="block text-slate-300 mb-1 font-medium">Meeting Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as MeetingStatus })}
                        className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500 text-xs"
                      >
                        <option value="Scheduled">Scheduled</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  )}

                  {/* Agenda & Notes */}
                  <div>
                    <label className="block text-slate-300 mb-1 font-medium flex items-center gap-1.5">
                      <FileText className="size-3.5 text-sky-400" />
                      <span>{formMode === 'create' ? 'Initial Agenda & Notes' : 'Meeting Notes'}</span>
                    </label>
                    <textarea
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500 placeholder-slate-500"
                      placeholder="Key topics, agenda, or discussion points..."
                    />
                  </div>

                  {/* Outcome and Action Items (Shown in edit mode or when completed) */}
                  {formMode === 'edit' && formData.status === 'Completed' && (
                    <div className="space-y-3 pt-2 border-t border-slate-800/80">
                      <div>
                        <label className="block text-slate-300 mb-1 font-medium flex items-center gap-1.5">
                          <Sparkles className="size-3.5 text-purple-400" />
                          <span>Meeting Outcome <span className="text-rose-400">*</span></span>
                        </label>
                        <textarea
                          rows={2}
                          value={formData.outcome}
                          onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500 placeholder-slate-500"
                          placeholder="Summary of meeting conclusions, approved scope, or client feedback..."
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1 font-medium flex items-center gap-1.5">
                          <ArrowRight className="size-3.5 text-sky-400" />
                          <span>Next Steps</span>
                        </label>
                        <textarea
                          rows={2}
                          value={formData.nextSteps}
                          onChange={(e) => setFormData({ ...formData, nextSteps: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500 placeholder-slate-500"
                          placeholder="Actionable follow-ups..."
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Form Footer */}
                <div className="pt-3 border-t border-slate-800 flex justify-end gap-2 shrink-0 mt-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsFormModalOpen(false)}
                    className="text-slate-400 text-xs"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-sky-600 hover:bg-sky-500 text-white text-xs gap-1.5 shadow-md shadow-sky-600/20"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="size-4" />
                        <span>{formMode === 'create' ? 'Save & Schedule' : 'Save Changes'}</span>
                      </>
                    )}
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
                <button
                  type="button"
                  onClick={() => setCompletingMeeting(null)}
                  className="text-slate-400 hover:text-white"
                >
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
                  {/* Meeting Notes */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                      <FileText className="size-3.5 text-sky-400" />
                      <span>Meeting Notes <span className="text-rose-400">*</span></span>
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={completeFormData.notes}
                      onChange={(e) => setCompleteFormData({ ...completeFormData, notes: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-emerald-500 placeholder-slate-500"
                      placeholder="e.g. Discussed requirements for real-time transaction monitoring and scheduled beta rollout."
                    />
                  </div>

                  {/* Outcome */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                      <Sparkles className="size-3.5 text-purple-400" />
                      <span>Outcome <span className="text-rose-400">*</span></span>
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={completeFormData.outcome}
                      onChange={(e) => setCompleteFormData({ ...completeFormData, outcome: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-emerald-500 placeholder-slate-500"
                      placeholder="e.g. Scope approved by client stakeholder. Authorized sprint kickoff."
                    />
                  </div>

                  {/* Action Items */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                        <CheckSquare className="size-3.5 text-amber-400" />
                        <span>Action Items</span>
                      </label>
                      <button
                        type="button"
                        onClick={addCompleteActionItemField}
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
                            onChange={(e) => handleCompleteActionItemChange(idx, e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-emerald-500 text-xs placeholder-slate-500"
                            placeholder={`Action item ${idx + 1}...`}
                          />
                          {completeFormData.actionItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeCompleteActionItemField(idx)}
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

                  {/* Next Steps */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                      <ArrowRight className="size-3.5 text-sky-400" />
                      <span>Next Steps <span className="text-slate-500 font-normal">(optional)</span></span>
                    </label>
                    <textarea
                      rows={2}
                      value={completeFormData.nextSteps}
                      onChange={(e) => setCompleteFormData({ ...completeFormData, nextSteps: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-emerald-500 placeholder-slate-500"
                      placeholder="e.g. Schedule follow-up proposal presentation."
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
              const custType = m.customerType || (m.leadId ? 'Lead' : 'Client');

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
                  {/* Top Bar: Title, Customer, Customer Type Badge, Status & Action Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold text-white tracking-wide flex items-center gap-1">
                          <Building2 className="size-3 text-sky-400" />
                          <span>{m.clientName}</span>
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${
                            custType === 'Lead'
                              ? 'bg-purple-500/10 text-purple-300 border border-purple-500/25'
                              : 'bg-sky-500/10 text-sky-300 border border-sky-500/25'
                          }`}
                        >
                          {custType}
                        </span>
                        {getStatusBadge(m.status)}
                      </div>
                      <h3 className="text-base font-bold text-white">{m.title}</h3>
                    </div>

                    {/* ACTION BUTTONS WORKFLOW */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      {/* Edit Button (Authorized users can edit meeting details) */}
                      {canManageMeetings && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditModal(m)}
                          className="text-slate-300 hover:text-white hover:bg-slate-800 text-xs gap-1.5 border border-slate-800 hover:border-slate-700"
                          title="Edit Meeting Details"
                        >
                          <Edit2 className="size-3.5 text-sky-400" />
                          <span>Edit</span>
                        </Button>
                      )}

                      {/* Scheduled -> Start Meeting / Cancel Meeting */}
                      {isScheduled && canManageMeetings && (
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
                      {isInProgress && canManageMeetings && (
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

                      {/* Delete Meeting (PM / Admin) */}
                      {canDeleteMeetings && (
                        <button
                          type="button"
                          onClick={() => handleDeleteMeeting(m.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete Meeting"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
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

                    <div className="flex items-center gap-2 min-w-0">
                      <Users className="size-3.5 text-sky-400 shrink-0" />
                      <div className="truncate">
                        <strong className="text-slate-300">Participants:</strong>{' '}
                        {Array.isArray(m.participants) && m.participants.length > 0 ? (
                          <span className="text-slate-200">
                            {m.participants.join(', ')}
                          </span>
                        ) : (
                          <span className="italic text-slate-500">None assigned</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Meeting Notes Block */}
                  {m.notes && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-sky-300 flex items-center gap-1.5">
                        <FileText className="size-3.5" />
                        <span>Meeting Notes:</span>
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
                        <span>Meeting Outcome:</span>
                      </span>
                      <p className="text-xs text-emerald-300/90 bg-emerald-950/20 p-3 rounded-xl border border-emerald-900/40 whitespace-pre-line leading-relaxed">
                        {m.outcome}
                      </p>
                    </div>
                  )}

                  {/* Action Items Block */}
                  {Array.isArray(m.actionItems) && m.actionItems.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                        <CheckSquare className="size-3.5" />
                        <span>Action Items ({m.actionItems.length}):</span>
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {m.actionItems.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2 p-2 rounded-lg bg-[#060913] border border-slate-800 text-xs text-slate-300"
                          >
                            <span className="size-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5"></span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Next Steps Block */}
                  {m.nextSteps && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#060913] border border-slate-800 text-xs text-slate-300">
                      <ArrowRight className="size-3.5 text-sky-400 shrink-0" />
                      <div>
                        <strong className="text-sky-300">Next Steps:</strong> {m.nextSteps}
                      </div>
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
