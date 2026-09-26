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
