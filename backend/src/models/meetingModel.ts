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
