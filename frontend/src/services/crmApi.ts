import { api } from './api';
import { Lead, Client, Meeting } from '@/types';

export interface CRMOverviewStats {
  pipelineValue: number;
  activeOpportunities: number;
  activeClients: number;
  scheduledMeetings: number;
}

export const crmApi = {
  // Overview
  async getOverview(): Promise<CRMOverviewStats> {
    const res = await api.get<{ success: boolean; stats: CRMOverviewStats }>('/crm/overview');
    return res.data.stats;
  },

  // Leads
  async getLeads(): Promise<Lead[]> {
    const res = await api.get<{ success: boolean; leads: any[] }>('/crm/leads');
    return res.data.leads.map((l) => ({
      id: l._id || l.id,
      name: l.name,
      company: l.company,
      email: l.email,
      status: l.status,
      source: l.source,
      value: l.value,
      estimatedClose: l.estimatedClose,
      assignedTo: l.assignedTo,
    }));
  },

  async createLead(data: Partial<Lead>): Promise<Lead> {
    const res = await api.post<{ success: boolean; lead: any }>('/crm/leads', data);
    const l = res.data.lead;
    return {
      id: l._id || l.id,
      name: l.name,
      company: l.company,
      email: l.email,
      status: l.status,
      source: l.source,
      value: l.value,
      estimatedClose: l.estimatedClose,
      assignedTo: l.assignedTo,
    };
  },

  async updateLead(id: string, data: Partial<Lead>): Promise<Lead> {
    const res = await api.put<{ success: boolean; lead: any }>(`/crm/leads/${id}`, data);
    const l = res.data.lead;
    return {
      id: l._id || l.id,
      name: l.name,
      company: l.company,
      email: l.email,
      status: l.status,
      source: l.source,
      value: l.value,
      estimatedClose: l.estimatedClose,
      assignedTo: l.assignedTo,
    };
  },

  async convertLead(id: string): Promise<void> {
    await api.post(`/crm/leads/${id}/convert`);
  },

  async deleteLead(id: string): Promise<void> {
    await api.delete(`/crm/leads/${id}`);
  },

  // Clients
  async getClients(): Promise<Client[]> {
    const res = await api.get<{ success: boolean; clients: any[] }>('/crm/clients');
    return res.data.clients.map((c) => ({
      id: c._id || c.id,
      name: c.name,
      company: c.company,
      email: c.email,
      phone: c.phone,
      activeProjects: c.activeProjects,
      totalValue: c.totalValue,
      status: c.status,
      avatar: c.avatar,
    }));
  },

  async createClient(data: Partial<Client>): Promise<Client> {
    const res = await api.post<{ success: boolean; client: any }>('/crm/clients', data);
    const c = res.data.client;
    return {
      id: c._id || c.id,
      name: c.name,
      company: c.company,
      email: c.email,
      phone: c.phone,
      activeProjects: c.activeProjects,
      totalValue: c.totalValue,
      status: c.status,
      avatar: c.avatar,
    };
  },

  async updateClient(id: string, data: Partial<Client>): Promise<Client> {
    const res = await api.put<{ success: boolean; client: any }>(`/crm/clients/${id}`, data);
    const c = res.data.client;
    return {
      id: c._id || c.id,
      name: c.name,
      company: c.company,
      email: c.email,
      phone: c.phone,
      activeProjects: c.activeProjects,
      totalValue: c.totalValue,
      status: c.status,
      avatar: c.avatar,
    };
  },

  async deleteClient(id: string): Promise<void> {
    await api.delete(`/crm/clients/${id}`);
  },

  // Meetings
  async getMeetings(): Promise<Meeting[]> {
    const res = await api.get<{ success: boolean; meetings: any[] }>('/crm/meetings');
    return res.data.meetings.map((m) => ({
      id: m._id || m.id,
      title: m.title,
      clientName: m.clientName,
      date: m.date,
      time: m.time,
      duration: m.duration,
      status: m.status,
      participants: m.participants,
      notes: m.notes,
      outcome: m.outcome,
      actionItems: m.actionItems,
      nextSteps: m.nextSteps,
    }));
  },

  async createMeeting(data: Partial<Meeting>): Promise<Meeting> {
    const res = await api.post<{ success: boolean; meeting: any }>('/crm/meetings', data);
    const m = res.data.meeting;
    return {
      id: m._id || m.id,
      title: m.title,
      clientName: m.clientName,
      date: m.date,
      time: m.time,
      duration: m.duration,
      status: m.status,
      participants: m.participants,
      notes: m.notes,
      outcome: m.outcome,
      actionItems: m.actionItems,
      nextSteps: m.nextSteps,
    };
  },

  async updateMeeting(id: string, data: Partial<Meeting>): Promise<Meeting> {
    const res = await api.put<{ success: boolean; meeting: any }>(`/crm/meetings/${id}`, data);
    const m = res.data.meeting;
    return {
      id: m._id || m.id,
      title: m.title,
      clientName: m.clientName,
      date: m.date,
      time: m.time,
      duration: m.duration,
      status: m.status,
      participants: m.participants,
      notes: m.notes,
      outcome: m.outcome,
      actionItems: m.actionItems,
      nextSteps: m.nextSteps,
    };
  },

  async deleteMeeting(id: string): Promise<void> {
    await api.delete(`/crm/meetings/${id}`);
  },
};
