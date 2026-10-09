import { Lead } from '../models/leadModel';
import { Client } from '../models/clientModel';
import { Meeting } from '../models/meetingModel';
import { Project } from '../models/projectModel';
import { User } from '../models/userModel';
import { ILead, IClient, IMeeting, CRMOverviewStats } from '../types/crm';
import { ApiError } from '../utils/errors';

export class CRMService {
  // Seed initial mock data if database collections are empty
  static async seedInitialData(): Promise<void> {
    try {
      const leadCount = await Lead.countDocuments();
      if (leadCount === 0) {
        await Lead.insertMany([
          {
            name: 'Robert Sterling',
            company: 'CloudScale Dynamics',
            email: 'r.sterling@cloudscale.io',
            status: 'Proposal',
            source: 'Inbound Web Contact',
            value: 145000,
            estimatedClose: '2026-10-20',
            assignedTo: 'Sarah Chen',
          },
          {
            name: 'Samantha Wright',
            company: 'Starlight Retail Tech',
            email: 'swright@starlightretail.com',
            status: 'Contacted',
            source: 'LinkedIn Outreach',
            value: 90000,
            estimatedClose: '2026-11-10',
            assignedTo: 'Sarah Chen',
          },
          {
            name: 'Jonathan Vance',
            company: 'Nexus Global Logistics',
            email: 'j.vance@nexuslogistics.com',
            status: 'New',
            source: 'Partner Referral',
            value: 220000,
            estimatedClose: '2026-12-01',
            assignedTo: 'Alex Morgan',
          },
          {
            name: 'Victor Vance',
            company: 'Apex Capital Corp',
            email: 'contact@apexcapital.com',
            status: 'Converted',
            source: 'Enterprise RFP',
            value: 180000,
            estimatedClose: '2026-01-10',
            assignedTo: 'Sarah Chen',
          },
        ]);
      }

      const clientCount = await Client.countDocuments();
      if (clientCount === 0) {
        await Client.insertMany([
          {
            name: 'Apex Capital Corp',
            company: 'Apex Capital Corp',
            email: 'contact@apexcapital.com',
            phone: '+1 (555) 234-5678',
            activeProjects: 1,
            totalValue: 180000,
            status: 'Active',
            avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
          },
          {
            name: 'Vanguard Health Systems',
            company: 'Vanguard Health Systems',
            email: 'info@vanguardsys.com',
            phone: '+1 (555) 876-5432',
            activeProjects: 1,
            totalValue: 120000,
            status: 'Active',
            avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
          },
        ]);
      }

      const meetingCount = await Meeting.countDocuments();
      if (meetingCount === 0) {
        await Meeting.insertMany([
          {
            title: 'Apex Capital Project Kickoff & Requirements Review',
            clientName: 'Apex Capital Corp',
            date: '2026-01-15',
            time: '10:00 EST',
            duration: '60 mins',
            status: 'Completed',
            participants: ['Alex Morgan', 'Sarah Chen', 'Marcus Vance', 'Apex CTO'],
            notes: 'Confirmed project scope, budget ($180,000), milestone timeline, and core security requirements.',
            outcome: 'Approved master scope and authorized sprint planning.',
          },
          {
            title: 'Architecture & OAuth2 Security Review',
            clientName: 'Apex Capital Corp',
            date: '2026-05-12',
            time: '14:00 EST',
            duration: '45 mins',
            status: 'Completed',
            participants: ['Marcus Vance', 'Elena Rostova', 'Apex Security Lead'],
            notes: 'Reviewed JWT refresh token rotation, HttpOnly cookie security, and multi-factor auth pipeline.',
            outcome: 'Architecture approved for production beta deployment.',
          },
          {
            title: 'Sprint 4 Review & Client Alignment Meeting',
            clientName: 'Apex Capital Corp',
            date: '2026-10-10',
            time: '11:00 EST',
            duration: '45 mins',
            status: 'Scheduled',
            participants: ['Alex Morgan', 'Sarah Chen', 'David Kim', 'Apex Product Director'],
            notes: 'Demonstrate responsive UI dark/light theme, client dashboard analytics, and preview real-time transaction streaming.',
          },
        ]);
      }
    } catch (error) {
      console.warn('CRM Seeding notice:', (error as Error).message);
    }
  }

  // --- Overview ---
  static async getOverview(): Promise<CRMOverviewStats> {
    await this.seedInitialData();

    const leads = await Lead.find();
    const clients = await Client.find({ status: 'Active' });
    const meetings = await Meeting.find({ status: 'Scheduled' });

    const pipelineValue = leads.reduce((acc, l) => acc + (l.value || 0), 0);

    return {
      pipelineValue,
      activeOpportunities: leads.length,
      activeClients: clients.length,
      scheduledMeetings: meetings.length,
    };
  }

  // --- Leads ---
  static async getLeads(): Promise<ILead[]> {
    await this.seedInitialData();
    return await Lead.find().sort({ createdAt: -1 });
  }

  static async getLeadById(id: string): Promise<ILead> {
    const lead = await Lead.findById(id);
    if (!lead) throw new ApiError('Lead not found', 404);
    return lead;
  }

  static async createLead(data: Partial<ILead>, userId?: string): Promise<ILead> {
    if (!data.name || !data.company || !data.email) {
      throw new ApiError('Please provide lead name, company, and email', 400);
    }
    const lead = await Lead.create({
      ...data,
      ...(userId && { createdBy: userId }),
    });
    return lead;
  }

  static async updateLead(id: string, data: Partial<ILead>): Promise<ILead> {
    if (data.status === 'Converted') {
      const result = await this.convertLeadToClient(id);
      const remainingData = { ...data };
      delete remainingData.status;
      if (Object.keys(remainingData).length > 0) {
        return (await Lead.findByIdAndUpdate(id, remainingData, { new: true, runValidators: true })) || result.lead;
      }
      return result.lead;
    }
    const lead = await Lead.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!lead) throw new ApiError('Lead not found', 404);
    return lead;
  }

  static async deleteLead(id: string): Promise<void> {
    const lead = await Lead.findByIdAndDelete(id);
    if (!lead) throw new ApiError('Lead not found', 404);
  }

  static async convertLeadToClient(id: string): Promise<{ lead: ILead; client: IClient }> {
    const lead = await Lead.findById(id);
    if (!lead) throw new ApiError('Lead not found', 404);

    if (lead.status !== 'Converted') {
      lead.status = 'Converted';
      await lead.save();

      // Check if client with email exists
      let client = await Client.findOne({ email: lead.email });
      if (!client) {
        client = await Client.create({
          name: lead.name,
          company: lead.company,
          email: lead.email,
          phone: '+1 (555) 000-0000',
          activeProjects: 0,
          totalValue: lead.value || 0,
          status: 'Active',
        });
      } else {
        client.totalValue += lead.value || 0;
        await client.save();
      }

      return { lead, client };
    }

    let client = await Client.findOne({ email: lead.email });
    if (!client) {
      client = await Client.create({
        name: lead.name,
        company: lead.company,
        email: lead.email,
        phone: '+1 (555) 000-0000',
        activeProjects: 0,
        totalValue: lead.value || 0,
        status: 'Active',
      });
    }

    return { lead, client };
  }

  // --- Clients ---
  static async getClients(): Promise<IClient[]> {
    await this.seedInitialData();
    return await Client.find().sort({ createdAt: -1 });
  }

  static async getClientById(id: string): Promise<IClient> {
    const client = await Client.findById(id);
    if (!client) throw new ApiError('Client not found', 404);
    return client;
  }

  static async createClient(data: Partial<IClient>, userId?: string): Promise<IClient> {
    if (!data.name || !data.company || !data.email || !data.phone) {
      throw new ApiError('Please provide client name, company, email, and phone', 400);
    }
    const client = await Client.create({
      ...data,
      ...(userId && { createdBy: userId }),
    });
    return client;
  }

  static async updateClient(id: string, data: Partial<IClient>): Promise<IClient> {
    const client = await Client.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!client) throw new ApiError('Client not found', 404);
    return client;
  }

  static async deleteClient(id: string): Promise<void> {
    const client = await Client.findById(id);
    if (!client) throw new ApiError('Client not found', 404);

    // Update associated projects so they don't leave broken references
    await Project.updateMany(
      { clientName: { $in: [client.company, client.name] } },
      { $set: { clientName: `${client.company} (Archived)` } }
    );

    await Client.findByIdAndDelete(id);
  }

  // --- Meetings ---
  static async getMeetings(): Promise<IMeeting[]> {
    await this.seedInitialData();
    return await Meeting.find().sort({ createdAt: -1 });
  }

  static async getMeetingById(id: string): Promise<IMeeting> {
    const meeting = await Meeting.findById(id);
    if (!meeting) throw new ApiError('Meeting not found', 404);
    return meeting;
  }

  static async createMeeting(data: Partial<IMeeting>, userId?: string): Promise<IMeeting> {
    if (!data.title || !data.date || !data.time) {
      throw new ApiError('Please provide meeting title, date, and time', 400);
    }

    const customerType = data.customerType || (data.leadId ? 'Lead' : 'Client');
    let resolvedClientName = (data.clientName || '').trim();
    let leadId = data.leadId || null;
    let clientId = data.clientId || null;

    if (customerType === 'Lead') {
      if (leadId) {
        const lead = await Lead.findById(leadId);
        if (!lead) {
          throw new ApiError('Selected Lead not found', 400);
        }
        resolvedClientName = lead.company || lead.name;
        clientId = null;
      } else if (!resolvedClientName) {
        throw new ApiError('Please select a Lead or provide client name', 400);
      }
    } else {
      // Default / Client
      if (clientId) {
        const client = await Client.findById(clientId);
        if (!client) {
          throw new ApiError('Selected Client not found', 400);
        }
        resolvedClientName = client.company || client.name;
        leadId = null;
      } else if (!resolvedClientName) {
        throw new ApiError('Please select a Client or provide client name', 400);
      }
    }

    let resolvedParticipantIds: any[] = [];
    let resolvedParticipants: string[] = Array.isArray(data.participants) ? [...data.participants] : [];

    if (Array.isArray(data.participantIds) && data.participantIds.length > 0) {
      const users = await User.find({ _id: { $in: data.participantIds } });
      if (users.length !== data.participantIds.length) {
        throw new ApiError('One or more selected participants do not exist', 400);
      }
      resolvedParticipantIds = users.map((u) => u._id);
      const userNames = users.map((u) => u.name);
      resolvedParticipants = Array.from(new Set([...userNames, ...resolvedParticipants]));
    }

    const meeting = await Meeting.create({
      ...data,
      customerType,
      leadId,
      clientId,
      clientName: resolvedClientName,
      participantIds: resolvedParticipantIds,
      participants: resolvedParticipants,
      ...(userId && { createdBy: userId }),
    });
    return meeting;
  }

  static async updateMeeting(id: string, data: Partial<IMeeting>): Promise<IMeeting> {
    const existingMeeting = await Meeting.findById(id);
    if (!existingMeeting) throw new ApiError('Meeting not found', 404);

    if (data.status === 'Completed') {
      const finalNotes = data.notes !== undefined ? data.notes : existingMeeting.notes;
      const finalOutcome = data.outcome !== undefined ? data.outcome : existingMeeting.outcome;

      if (!finalNotes || !finalNotes.trim()) {
        throw new ApiError('Meeting Notes are required when completing a meeting', 400);
      }
      if (!finalOutcome || !finalOutcome.trim()) {
        throw new ApiError('Meeting Outcome is required when completing a meeting', 400);
      }
    }

    const customerType = data.customerType || existingMeeting.customerType || (data.leadId ? 'Lead' : 'Client');
    let resolvedClientName = data.clientName !== undefined ? data.clientName.trim() : existingMeeting.clientName;
    let leadId = data.leadId !== undefined ? data.leadId : existingMeeting.leadId;
    let clientId = data.clientId !== undefined ? data.clientId : existingMeeting.clientId;

    if (data.customerType || data.leadId !== undefined || data.clientId !== undefined) {
      if (customerType === 'Lead') {
        if (leadId) {
          const lead = await Lead.findById(leadId);
          if (!lead) throw new ApiError('Selected Lead not found', 400);
          resolvedClientName = lead.company || lead.name;
          clientId = null;
        } else if (!resolvedClientName) {
          throw new ApiError('Please select a Lead or provide client name', 400);
        }
      } else {
        if (clientId) {
          const client = await Client.findById(clientId);
          if (!client) throw new ApiError('Selected Client not found', 400);
          resolvedClientName = client.company || client.name;
          leadId = null;
        } else if (!resolvedClientName) {
          throw new ApiError('Please select a Client or provide client name', 400);
        }
      }
      data.customerType = customerType;
      data.leadId = leadId;
      data.clientId = clientId;
      data.clientName = resolvedClientName;
    }

    if (data.participantIds !== undefined) {
      if (Array.isArray(data.participantIds) && data.participantIds.length > 0) {
        const users = await User.find({ _id: { $in: data.participantIds } });
        if (users.length !== data.participantIds.length) {
          throw new ApiError('One or more selected participants do not exist', 400);
        }
        data.participantIds = users.map((u) => u._id as any);
        data.participants = users.map((u) => u.name);
      } else {
        data.participantIds = [];
        data.participants = [];
      }
    }

    const meeting = await Meeting.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!meeting) throw new ApiError('Meeting not found', 404);
    return meeting;
  }

  static async deleteMeeting(id: string): Promise<void> {
    const meeting = await Meeting.findByIdAndDelete(id);
    if (!meeting) throw new ApiError('Meeting not found', 404);
  }
}
