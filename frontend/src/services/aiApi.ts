import { api } from './api';

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

export interface SmartTeamMatcherResult {
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

export interface AutoLinkMilestoneResult {
  summary: AutoLinkSummary;
  recommendations: AutoLinkMilestoneItem[];
}

export const aiApi = {
  async getProjectHealth(projectId?: string): Promise<OverallHealthSummary> {
    const res = await api.get<{ success: boolean; data: OverallHealthSummary }>('/ai/project-intelligence', {
      params: { projectId },
    });
    return res.data.data;
  },

  async runProjectHealthScan(projectId?: string): Promise<OverallHealthSummary> {
    const res = await api.post<{ success: boolean; data: OverallHealthSummary }>('/ai/project-intelligence/scan', {
      projectId,
    });
    return res.data.data;
  },

  async getTeamRecommendations(
    projectId?: string,
    skills?: string
  ): Promise<SmartTeamMatcherResult> {
    const res = await api.get<{
      success: boolean;
      data?: SmartTeamMatcherResult;
      totalRequiredCount?: number;
      totalCurrentCount?: number;
      roleCoverage?: ProjectRoleCoverage[];
      roleGroupedRecommendations?: RoleRecommendationGroup[];
      primaryRecommendations?: TeamMemberRecommendation[];
      alternativeCandidates?: TeamMemberRecommendation[];
      existingMembers?: Array<{ id: string; name: string; role: string; avatar: string }>;
      requirements?: ProjectRequirementItem[];
      recommendations?: TeamMemberRecommendation[];
      existingMembersCount?: number;
    }>('/ai/team-recommendations', {
      params: { projectId, skills },
    });

    const d = res.data.data;
    const primaryRecs = d?.primaryRecommendations || res.data.primaryRecommendations || res.data.recommendations || [];
    const altRecs = d?.alternativeCandidates || res.data.alternativeCandidates || [];
    const coverage = d?.roleCoverage || res.data.roleCoverage || [];
    const grouped = d?.roleGroupedRecommendations || res.data.roleGroupedRecommendations || [];

    return {
      totalRequiredCount: d?.totalRequiredCount ?? res.data.totalRequiredCount ?? 4,
      totalCurrentCount: d?.totalCurrentCount ?? res.data.totalCurrentCount ?? res.data.existingMembersCount ?? 0,
      roleCoverage: coverage,
      roleGroupedRecommendations: grouped,
      primaryRecommendations: primaryRecs,
      alternativeCandidates: altRecs,
      existingMembers: d?.existingMembers || res.data.existingMembers || [],
      requirements: d?.requirements || res.data.requirements || [],
      recommendations: primaryRecs,
      existingMembersCount: d?.totalCurrentCount ?? res.data.totalCurrentCount ?? res.data.existingMembersCount ?? 0,
    };
  },

  async getTaskAssigneeRecommendations(
    projectId: string,
    skills?: string
  ): Promise<TeamMemberRecommendation[]> {
    const res = await api.get<{
      success: boolean;
      data?: TeamMemberRecommendation[];
      recommendations?: TeamMemberRecommendation[];
    }>('/ai/task-recommendations', {
      params: { projectId, skills },
    });
    return res.data.data || res.data.recommendations || [];
  },

  async askAssistant(
    prompt: string,
    projectId?: string,
    action?: string,
    taskId?: string,
    messages?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
  ): Promise<AssistantChatResponse> {
    const res = await api.post<{ success: boolean; data: AssistantChatResponse }>('/ai/assistant', {
      prompt,
      projectId,
      action,
      taskId,
      messages,
    });
    return res.data.data;
  },

  async confirmSubtasks(taskId: string, subtasks: Array<{ id?: string; title: string; completed?: boolean }>): Promise<any> {
    const res = await api.post<{ success: boolean; data: any }>('/ai/confirm-subtasks', {
      taskId,
      subtasks,
    });
    return res.data.data;
  },

  async autoLinkMilestones(projectId?: string): Promise<AutoLinkMilestoneResult> {
    const res = await api.post<{ success: boolean; data: AutoLinkMilestoneResult }>('/ai/auto-link-milestones', {
      projectId,
    });
    return res.data.data;
  },

  async confirmMilestoneLinks(
    updates: Array<{ taskId: string; milestoneId: string; approved: boolean }>
  ): Promise<{ updatedCount: number }> {
    const res = await api.post<{ success: boolean; data: { updatedCount: number } }>('/ai/confirm-milestone-links', {
      updates,
    });
    return res.data.data;
  },
};

