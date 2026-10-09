export type UserRole = 
  | 'Super Admin' 
  | 'Admin' 
  | 'Project Manager' 
  | 'Team Lead' 
  | 'Project Coordinator'
  | 'Developer' 
  | 'Designer' 
  | 'QA' 
  | 'Client';

export type ProjectStatus = 'Planning' | 'In Progress' | 'Review' | 'Completed' | 'On Hold';
export type PriorityLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type TaskStatus = 'Todo' | 'In Progress' | 'Review' | 'Completed';
export type MilestoneStatus = 'Upcoming' | 'In Progress' | 'Achieved' | 'Overdue';
export type LeadStatus = 'New' | 'Contacted' | 'Proposal' | 'Converted' | 'Lost';
export type AvailabilityStatus = 'Available' | 'Busy' | 'On Leave';
export type UserAccountStatus = 'invited' | 'active' | 'disabled';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  department?: string;
  status?: UserAccountStatus;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  department?: string;
  skills: string[];
  assignedProjects: string[];
  workloadPercent: number;
  availability: AvailabilityStatus;
  status?: UserAccountStatus;
  performanceRating: number; // out of 5
  joinedDate: string;
}

export interface Project {
  id: string;
  clientId?: string;
  name: string;
  clientName: string;
  description: string;
  manager: User;
  members: TeamMember[];
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  priority: PriorityLevel;
  budget: number;
  spent: number;
  progress: number;
  techStack: string[];
  healthScore: number; // 0 - 100
  riskLevel: 'Low' | 'Moderate' | 'High';
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  description: string;
  assignee: TeamMember;
  createdBy?: string; // userId of the authenticated user who created the task
  status: TaskStatus;
  priority: PriorityLevel;
  dueDate: string;
  milestoneId?: string;
  tags: string[];
  subtasks: Subtask[];
  commentsCount: number;
  createdAt: string;
}

/** Lightweight reference used when building the assignee payload for task creation */
export interface AssigneeRef {
  id: string;
  name: string;
  email: string;
  role: UserRole | string;
  avatar: string;
  workloadPercent?: number;
}

export interface Milestone {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  description: string;
  status: MilestoneStatus;
  startDate: string;
  dueDate: string;
  progress: number;
  relatedTasksCount: number;
  owner: TeamMember;
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  status: LeadStatus;
  source: string;
  value: number;
  estimatedClose: string;
  assignedTo: string;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  activeProjects: number;
  totalValue: number;
  status: 'Active' | 'Inactive';
  avatar: string;
}

export type MeetingStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
export type CustomerType = 'Lead' | 'Client';

export interface Meeting {
  id: string;
  title: string;
  customerType?: CustomerType;
  leadId?: string;
  clientId?: string;
  clientName: string;
  date: string;
  time: string;
  duration: string;
  status: MeetingStatus;
  participantIds?: string[];
  participants: string[];
  notes?: string;
  outcome?: string;
  actionItems?: string[];
  nextSteps?: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  category: 'Requirement' | 'Architecture' | 'Contract' | 'Design' | 'Report';
  size: string;
  sizeBytes?: number;
  uploadedBy: string;
  uploadDate: string;
  projectName: string;
  projectId?: string;
  fileType: string;
  originalFilename?: string;
  url?: string;
}

export interface NotificationItem {
  id: string;
  userId?: string;
  type: 'task' | 'project' | 'milestone' | 'meeting' | 'ai' | 'system' | string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  entityId?: string;
  entityType?: 'task' | 'milestone' | 'project' | 'meeting' | 'ai' | 'system';
  projectId?: string;
  actionUrl?: string;
}

export interface ActivityLogItem {
  id: string;
  userName: string;
  userAvatar: string;
  userRole?: string;
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  projectId?: string;
  projectName?: string;
  timestamp: string;
  description: string;
  metadata?: {
    previousTechStack?: string[];
    newTechStack?: string[];
    additions?: string[];
    removals?: string[];
    reason?: string;
    [key: string]: any;
  };
  createdAt?: string;
}
