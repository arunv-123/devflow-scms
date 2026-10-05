import { api } from './api';
import { ActivityLogItem } from '@/types';

export interface ActivityLogFilters {
  projectId?: string;
  action?: string;
  userName?: string;
  search?: string;
}

export const activityLogsApi = {
  async getActivityLogs(filters?: ActivityLogFilters): Promise<ActivityLogItem[]> {
    const params = new URLSearchParams();
    if (filters?.projectId) params.append('projectId', filters.projectId);
    if (filters?.action) params.append('action', filters.action);
    if (filters?.userName) params.append('userName', filters.userName);
    if (filters?.search) params.append('search', filters.search);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await api.get<{ success: boolean; logs: ActivityLogItem[] }>(`/activity-logs${queryString}`);
    return res.data.logs;
  },
};
