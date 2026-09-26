export type UserRole = 
  | 'Super Admin' 
  | 'Admin' 
  | 'Project Manager' 
  | 'Team Lead' 
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

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  department?: string;
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
  performanceRating: number; // out of 5
  joinedDate: string;
}

export interface Project {
  id: string;
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
  status: TaskStatus;
  priority: PriorityLevel;
  dueDate: string;
  tags: string[];
  subtasks: Subtask[];
  commentsCount: number;
  createdAt: string;
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

export interface Meeting {
  id: string;
  title: string;
  clientName: string;
  date: string;
  time: string;
  duration: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  participants: string[];
  notes?: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  category: 'Requirement' | 'Architecture' | 'Contract' | 'Design' | 'Report';
  size: string;
  uploadedBy: string;
  uploadDate: string;
  projectName: string;
  fileType: string;
}

export interface NotificationItem {
  id: string;
  type: 'task' | 'project' | 'milestone' | 'ai' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
}

export interface ActivityLogItem {
  id: string;
  userName: string;
  userAvatar: string;
  action: string;
  entity: string;
  timestamp: string;
  description: string;
}
