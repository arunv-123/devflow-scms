import { Schema, model } from 'mongoose';
import { IClient, ClientStatus } from '../types/crm';

const VALID_CLIENT_STATUSES: ClientStatus[] = ['Active', 'Inactive'];

const clientSchema = new Schema<IClient>(
  {
    name: {
      type: String,
      required: [true, 'Client contact name is required'],
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
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    activeProjects: {
      type: Number,
      default: 0,
      min: [0, 'Active projects count cannot be negative'],
    },
    totalValue: {
      type: Number,
      default: 0,
      min: [0, 'Total contract value cannot be negative'],
    },
    status: {
      type: String,
      enum: {
        values: VALID_CLIENT_STATUSES,
        message: '{VALUE} is not a valid client status',
      },
      default: 'Active',
    },
    avatar: {
      type: String,
      default: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
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

export const Client = model<IClient>('Client', clientSchema);
