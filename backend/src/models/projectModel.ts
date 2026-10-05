import { Schema, model } from 'mongoose';
import { IProject, ProjectStatus, PriorityLevel } from '../types/project';

const VALID_PROJECT_STATUSES: ProjectStatus[] = [
  'Planning',
  'In Progress',
  'Review',
  'Completed',
  'On Hold',
];

const VALID_PRIORITIES: PriorityLevel[] = ['Low', 'Medium', 'High', 'Critical'];

const memberSubSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, required: true },
    avatar: { type: String, required: true },
    workloadPercent: { type: Number, default: 50 },
  },
  { _id: false }
);

const projectSchema = new Schema<IProject>(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
    },
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
    },
    clientName: {
      type: String,
      required: [true, 'Client name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    manager: {
      type: memberSubSchema,
      required: [true, 'Project manager is required'],
    },
    members: {
      type: [memberSubSchema],
      default: [],
    },
    startDate: {
      type: String,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: String,
      required: [true, 'End date is required'],
    },
    status: {
      type: String,
      enum: {
        values: VALID_PROJECT_STATUSES,
        message: '{VALUE} is not a valid project status',
      },
      default: 'Planning',
    },
    priority: {
      type: String,
      enum: {
        values: VALID_PRIORITIES,
        message: '{VALUE} is not a valid priority level',
      },
      default: 'Medium',
    },
    budget: {
      type: Number,
      default: 0,
      min: [0, 'Budget cannot be negative'],
    },
    spent: {
      type: Number,
      default: 0,
      min: [0, 'Spent amount cannot be negative'],
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    techStack: {
      type: [String],
      default: [],
    },
    healthScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    riskLevel: {
      type: String,
      enum: ['Low', 'Moderate', 'High'],
      default: 'Low',
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

export const Project = model<IProject>('Project', projectSchema);
