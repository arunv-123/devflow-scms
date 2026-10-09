import { Document, Types } from 'mongoose';

export type LeadStatus = 'New' | 'Contacted' | 'Proposal' | 'Converted' | 'Lost';
export type ClientStatus = 'Active' | 'Inactive';
export type MeetingStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';

export interface ILead extends Document {
  _id: Types.ObjectId;
  name: string;
  company: string;
  email: string;
  status: LeadStatus;
  source: string;
  value: number;
  estimatedClose: string;
  assignedTo: string;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IClient extends Document {
  _id: Types.ObjectId;
  name: string;
  company: string;
  email: string;
  phone: string;
  activeProjects: number;
  totalValue: number;
  status: ClientStatus;
  avatar: string;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type CustomerType = 'Lead' | 'Client';

export interface IMeeting extends Document {
  _id: Types.ObjectId;
  title: string;
  customerType?: CustomerType;
  leadId?: Types.ObjectId | string | null;
  clientId?: Types.ObjectId | string | null;
  clientName: string;
  date: string;
  time: string;
  duration: string;
  status: MeetingStatus;
  participantIds?: (Types.ObjectId | string)[];
  participants: string[];
  notes?: string;
  outcome?: string;
  actionItems?: string[];
  nextSteps?: string;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface CRMOverviewStats {
  pipelineValue: number;
  activeOpportunities: number;
  activeClients: number;
  scheduledMeetings: number;
}
