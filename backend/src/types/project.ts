import { Document, Types } from 'mongoose';
import { UserRole } from './auth';

export type ProjectStatus = 'Planning' | 'In Progress' | 'Review' | 'Completed' | 'On Hold';
export type PriorityLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type TaskStatus = 'Todo' | 'In Progress' | 'Review' | 'Completed';
export type MilestoneStatus = 'Upcoming' | 'In Progress' | 'Achieved' | 'Overdue';

export interface ITeamMemberRef {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  workloadPercent?: number;
}

export interface IProject extends Document {
  _id: Types.ObjectId;
  clientId?: Types.ObjectId | string;
  name: string;
  clientName: string;
  description: string;
  manager: ITeamMemberRef;
  members: ITeamMemberRef[];
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  priority: PriorityLevel;
  budget: number;
  spent: number;
  progress: number;
  techStack: string[];
  healthScore: number;
  riskLevel: 'Low' | 'Moderate' | 'High';
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubtask {
  _id?: Types.ObjectId;
  id: string;
  title: string;
  completed: boolean;
}

export interface ITask extends Document {
  _id: Types.ObjectId;
  projectId: string;
  projectName: string;
  title: string;
  description: string;
  assignee: ITeamMemberRef;
  status: TaskStatus;
  priority: PriorityLevel;
  dueDate: string;
  milestoneId?: string;
  tags: string[];
  subtasks: ISubtask[];
  commentsCount: number;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMilestone extends Document {
  _id: Types.ObjectId;
  projectId: string;
  projectName: string;
  title: string;
  description: string;
  status: MilestoneStatus;
  startDate: string;
  dueDate: string;
  progress: number;
  relatedTasksCount: number;
  owner: ITeamMemberRef;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
