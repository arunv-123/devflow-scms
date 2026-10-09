import { Schema, model } from 'mongoose';
import { IMeeting, MeetingStatus } from '../types/crm';

const VALID_MEETING_STATUSES: MeetingStatus[] = ['Scheduled', 'In Progress', 'Completed', 'Cancelled'];

const meetingSchema = new Schema<IMeeting>(
  {
    title: {
      type: String,
      required: [true, 'Meeting title is required'],
      trim: true,
    },
    customerType: {
      type: String,
      enum: {
        values: ['Lead', 'Client'],
        message: '{VALUE} is not a valid customer type',
      },
      default: 'Client',
    },
    leadId: {
      type: Schema.Types.ObjectId,
      ref: 'Lead',
      default: null,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      default: null,
    },
    clientName: {
      type: String,
      required: [true, 'Client name is required'],
      trim: true,
    },
    date: {
      type: String,
      required: [true, 'Meeting date is required'],
      trim: true,
    },
    time: {
      type: String,
      required: [true, 'Meeting time is required'],
      trim: true,
    },
    duration: {
      type: String,
      default: '30 mins',
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: VALID_MEETING_STATUSES,
        message: '{VALUE} is not a valid meeting status',
      },
      default: 'Scheduled',
    },
    participantIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    participants: {
      type: [String],
      default: [],
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    outcome: {
      type: String,
      trim: true,
      default: '',
    },
    actionItems: {
      type: [String],
      default: [],
    },
    nextSteps: {
      type: String,
      trim: true,
      default: '',
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

export const Meeting = model<IMeeting>('Meeting', meetingSchema);
