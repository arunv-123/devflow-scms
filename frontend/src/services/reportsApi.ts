import { api } from './api';

export interface ReportsData {
  executiveMetrics: {
    totalRevenue: number;
    sprintVelocity: string;
    taskCompletionRate: string;
    clientRetentionRate: string;
  };
  velocityData: { sprint: string; planned: number; completed: number }[];
  resourceMatrix: any[];
}

export const reportsApi = {
  async getReportsData(): Promise<ReportsData> {
    const res = await api.get<{ success: boolean; data: ReportsData }>('/reports');
    return res.data.data;
  },
};
