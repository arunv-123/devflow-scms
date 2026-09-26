import { api } from './api';
import { ActivityLogItem } from '@/types';

export const activityLogsApi = {
  async getActivityLogs(): Promise<ActivityLogItem[]> {
    const res = await api.get<{ success: boolean; logs: ActivityLogItem[] }>('/activity-logs');
    return res.data.logs;
  },
};
