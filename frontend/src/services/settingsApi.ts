import { api } from './api';

export interface SystemSettings {
  id?: string;
  organizationName: string;
  organizationEmail?: string;
  defaultCurrency: string;
  strictRBAC: boolean;
  emailNotifications?: boolean;
  aiAssistantEnabled?: boolean;
}

export const settingsApi = {
  async getSettings(): Promise<SystemSettings> {
    const res = await api.get<{ success: boolean; settings: SystemSettings }>('/settings');
    return res.data.settings;
  },

  async updateSettings(data: Partial<SystemSettings>): Promise<SystemSettings> {
    const res = await api.put<{ success: boolean; settings: SystemSettings }>('/settings', data);
    return res.data.settings;
  },
};
