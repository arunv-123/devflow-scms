import { Schema, model } from 'mongoose';
import { ITask, TaskStatus, PriorityLevel } from '../types/project';

const VALID_TASK_STATUSES: TaskStatus[] = ['Todo', 'In Progress', 'Review', 'Completed'];
const VALID_PRIORITIES: PriorityLevel[] = ['Low', 'Medium', 'High', 'Critical'];

const subtaskSubSchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    completed: { type: Boolean, default: false },
  },
  { _id: false }
);

const assigneeSubSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, required: true },
    avatar: { type: String, default: '' },
  },
  { _id: false }
);

const taskSchema = new Schema<ITask>(
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
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    assignee: {
      type: assigneeSubSchema,
      required: [true, 'Assignee is required'],
    },
    status: {
      type: String,
      enum: {
        values: VALID_TASK_STATUSES,
        message: '{VALUE} is not a valid task status',
      },
      default: 'Todo',
    },
    priority: {
      type: String,
      enum: {
        values: VALID_PRIORITIES,
        message: '{VALUE} is not a valid priority level',
      },
      default: 'Medium',
    },
    dueDate: {
      type: String,
      required: [true, 'Due date is required'],
    },
    milestoneId: {
      type: String,
      default: '',
      index: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    subtasks: {
      type: [subtaskSubSchema],
      default: [],
    },
    commentsCount: {
      type: Number,
      default: 0,
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

export const Task = model<ITask>('Task', taskSchema);
