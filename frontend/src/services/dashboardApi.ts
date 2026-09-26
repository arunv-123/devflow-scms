import { api } from './api';

export interface DashboardMetrics {
  totalProjects: number;
  activeProjectsCount: number;
  completedProjectsCount: number;
  totalTasks: number;
  pendingTasksCount: number;
  completedTasksCount: number;
  overdueTasksCount: number;
  totalClientsCount: number;
  totalTeamMembersCount: number;
  overallHealth: number;
  avgCapacity: number;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  activeProjects: any[];
  upcomingMilestones: any[];
  recentActivity: any[];
}

export const dashboardApi = {
  async getDashboardData(): Promise<DashboardData> {
    const res = await api.get<{ success: boolean; data: DashboardData }>('/dashboard');
    return res.data.data;
  },
};
