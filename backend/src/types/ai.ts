export interface ProjectHealthReport {
  projectId: string;
  projectName: string;
  clientName: string;
  healthScore: number;
  riskLevel: 'Low' | 'Moderate' | 'High';
  completionRate: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  insights: string[];
  recommendedActions: string[];
}

export interface OverallHealthSummary {
  overallHealthScore: number;
  overallStatus: 'Optimal' | 'Attention Required' | 'Critical Risk';
  deliveryProbability: number;
  totalActiveProjects: number;
  totalTasksAnalyzed: number;
  projectHealthList: ProjectHealthReport[];
}

export interface MatchBreakdown {
  roleScore: number;
  skillScore: number;
  techStackScore: number;
  workloadScore: number;
  availabilityScore: number;
}

export interface ProjectRequirementItem {
  role: string;
  count: number;
  skills: string[];
}

export interface ProjectRoleCoverage {
  role: string;
  requiredCount: number;
  currentCount: number;
  isFilled: boolean;
  skills: string[];
}

export interface TeamMemberRecommendation {
  memberId: string;
  name: string;
  role: string;
  email: string;
  avatar: string;
  skills: string[];
  matchScore: number;
  workloadPercent: number;
  availability: 'Available' | 'Busy' | 'On Leave';
  matchReason: string;
  matchingSkills: string[];
  isExistingMember?: boolean;
  breakdown?: MatchBreakdown;
}

export interface RoleRecommendationGroup {
  role: string;
  requiredCount: number;
  currentCount: number;
  candidates: TeamMemberRecommendation[];
}

export interface SmartTeamMatcherResponse {
  totalRequiredCount: number;
  totalCurrentCount: number;
  roleCoverage: ProjectRoleCoverage[];
  roleGroupedRecommendations: RoleRecommendationGroup[];
  primaryRecommendations: TeamMemberRecommendation[];
  alternativeCandidates: TeamMemberRecommendation[];
  existingMembers: Array<{ id: string; name: string; role: string; avatar: string }>;
  requirements: ProjectRequirementItem[];
  recommendations: TeamMemberRecommendation[];
  existingMembersCount: number;
}

export interface GeneratedTaskSpec {
  title: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  dueDate?: string;
  milestoneTitle?: string;
  milestoneId?: string;
}

export interface GeneratedMilestoneSpec {
  title: string;
  description?: string;
  dueDate?: string;
  suggestedTasks?: GeneratedTaskSpec[];
}

export interface ChatMessageHistoryItem {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AssistantChatResponse {
  answer: string;
  action?: string;
  taskId?: string;
  taskTitle?: string;
  suggestedSubtasks?: Array<{ id: string; title: string; completed?: boolean }>;
  generatedItems?: {
    summary?: string;
    techStack?: string[];
    tasks?: GeneratedTaskSpec[];
    milestones?: GeneratedMilestoneSpec[];
  };
}

export interface AutoLinkMilestoneItem {
  taskId: string;
  taskTitle: string;
  taskDescription?: string;
  taskTags?: string[];
  currentMilestoneId?: string;
  recommendedMilestoneId: string;
  recommendedMilestoneTitle: string;
  confidenceScore: number;
  status: 'auto_assigned' | 'requires_approval' | 'unassigned';
  matchReason: string;
  approved?: boolean;
}

export interface AutoLinkSummary {
  totalAnalyzed: number;
  autoLinkedCount: number;
  requiresApprovalCount: number;
  unassignedCount: number;
}

export interface AutoLinkMilestoneResponse {
  summary: AutoLinkSummary;
  recommendations: AutoLinkMilestoneItem[];
}

