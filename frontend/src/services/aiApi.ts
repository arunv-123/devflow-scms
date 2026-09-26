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
}

export interface AssistantChatResponse {
  answer: string;
  generatedItems?: {
    summary?: string;
    techStack?: string[];
    tasks?: Array<{
      title: string;
      description?: string;
      priority: 'Low' | 'Medium' | 'High' | 'Critical';
      dueDate?: string;
    }>;
    milestones?: Array<{
      title: string;
      description?: string;
      dueDate?: string;
    }>;
  };
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

  async getTeamRecommendations(projectId?: string, skills?: string): Promise<TeamMemberRecommendation[]> {
    const res = await api.get<{ success: boolean; recommendations: TeamMemberRecommendation[] }>(
      '/ai/team-recommendations',
      {
        params: { projectId, skills },
      }
    );
    return res.data.recommendations;
  },

  async askAssistant(prompt: string, projectId?: string): Promise<AssistantChatResponse> {
    const res = await api.post<{ success: boolean; data: AssistantChatResponse }>('/ai/assistant', {
      prompt,
      projectId,
    });
    return res.data.data;
  },
};
