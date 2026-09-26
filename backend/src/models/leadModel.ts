import { Schema, model } from 'mongoose';
import { ILead, LeadStatus } from '../types/crm';

const VALID_LEAD_STATUSES: LeadStatus[] = ['New', 'Contacted', 'Proposal', 'Converted', 'Lost'];

const leadSchema = new Schema<ILead>(
  {
    name: {
      type: String,
      required: [true, 'Lead contact name is required'],
      trim: true,
    },
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    status: {
      type: String,
      enum: {
        values: VALID_LEAD_STATUSES,
        message: '{VALUE} is not a valid lead status',
      },
      default: 'New',
    },
    source: {
      type: String,
      default: 'Inbound Web Contact',
      trim: true,
    },
    value: {
      type: Number,
      default: 0,
      min: [0, 'Lead value cannot be negative'],
    },
    estimatedClose: {
      type: String,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
    assignedTo: {
      type: String,
      default: 'Unassigned',
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export const Lead = model<ILead>('Lead', leadSchema);
