import { Schema, model } from 'mongoose';
import { IMilestone, MilestoneStatus } from '../types/project';

const VALID_MILESTONE_STATUSES: MilestoneStatus[] = ['Upcoming', 'In Progress', 'Achieved', 'Overdue'];

const ownerSubSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, required: true },
    avatar: { type: String, required: true },
  },
  { _id: false }
);

const milestoneSchema = new Schema<IMilestone>(
  {
    projectId: {
      type: String,
      required: [true, 'Project ID is required'],
      index: true,
    },
    projectName: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Milestone title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: VALID_MILESTONE_STATUSES,
        message: '{VALUE} is not a valid milestone status',
      },
      default: 'Upcoming',
    },
    startDate: {
      type: String,
      default: () => new Date().toISOString().split('T')[0],
    },
    dueDate: {
      type: String,
      required: [true, 'Due date is required'],
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    relatedTasksCount: {
      type: Number,
      default: 0,
    },
    owner: {
      type: ownerSubSchema,
      required: [true, 'Milestone owner is required'],
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

export const Milestone = model<IMilestone>('Milestone', milestoneSchema);
