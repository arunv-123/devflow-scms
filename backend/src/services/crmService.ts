import { Lead } from '../models/leadModel';
import { Client } from '../models/clientModel';
import { Meeting } from '../models/meetingModel';
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
            company: 'Sterling Global Logistics',
            email: 'r.sterling@sterlinglogistics.com',
            status: 'Proposal',
            source: 'Inbound Web Contact',
            value: 145000,
            estimatedClose: '2026-10-20',
            assignedTo: 'Sarah Chen',
          },
          {
            name: 'Samantha Wright',
            company: 'Quantum Health Tech',
            email: 'swright@quantumhealth.io',
            status: 'Contacted',
            source: 'LinkedIn Outreach',
            value: 90000,
            estimatedClose: '2026-11-10',
            assignedTo: 'Sarah Chen',
          },
          {
            name: 'Jonathan Vance',
            company: 'NextGen Financials',
            email: 'j.vance@nextgenfin.com',
            status: 'New',
            source: 'Partner Referral',
            value: 220000,
            estimatedClose: '2026-12-01',
            assignedTo: 'Alex Morgan',
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
            name: 'Vanguard Systems',
            company: 'Vanguard Systems',
            email: 'info@vanguardsys.com',
            phone: '+1 (555) 876-5432',
            activeProjects: 1,
            totalValue: 120000,
            status: 'Active',
            avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
          },
          {
            name: 'BioHealth Innovations',
            company: 'BioHealth Innovations',
            email: 'partners@biohealth.org',
            phone: '+1 (555) 345-6789',
            activeProjects: 1,
            totalValue: 95000,
            status: 'Active',
            avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
          },
        ]);
      }

      const meetingCount = await Meeting.countDocuments();
      if (meetingCount === 0) {
        await Meeting.insertMany([
          {
            title: 'FinTech Nexus Architecture & Security Sprint Review',
            clientName: 'Apex Capital Corp',
            date: '2026-09-28',
            time: '14:00 EST',
            duration: '45 mins',
            status: 'Scheduled',
            participants: ['Alex Morgan', 'Sarah Chen', 'Marcus Vance', 'Apex CTO'],
            notes: 'Review OAuth2 implementation progress, load testing metrics, and Q4 delivery timeline.',
          },
          {
            title: 'AI Knowledge Engine Milestone Sign-off',
            clientName: 'Vanguard Systems',
            date: '2026-09-30',
            time: '11:00 EST',
            duration: '30 mins',
            status: 'Scheduled',
            participants: ['Alex Morgan', 'Elena Rostova', 'Vanguard Product Director'],
            notes: 'Demonstrate semantic document extraction accuracy and review Pinecone API latency report.',
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
    const client = await Client.findByIdAndDelete(id);
    if (!client) throw new ApiError('Client not found', 404);
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
    if (!data.title || !data.clientName || !data.date || !data.time) {
      throw new ApiError('Please provide meeting title, client name, date, and time', 400);
    }
    const meeting = await Meeting.create({
      ...data,
      ...(userId && { createdBy: userId }),
    });
    return meeting;
  }

  static async updateMeeting(id: string, data: Partial<IMeeting>): Promise<IMeeting> {
    const meeting = await Meeting.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!meeting) throw new ApiError('Meeting not found', 404);
    return meeting;
  }

  static async deleteMeeting(id: string): Promise<void> {
    const meeting = await Meeting.findByIdAndDelete(id);
    if (!meeting) throw new ApiError('Meeting not found', 404);
  }
}
