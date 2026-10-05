import { api } from './api';
import { NotificationItem } from '@/types';

export const notificationsApi = {
  async getNotifications(): Promise<{ notifications: NotificationItem[]; unreadCount: number }> {
    const res = await api.get<{ success: boolean; notifications: NotificationItem[]; unreadCount: number }>(
      '/notifications'
    );
    return {
      notifications: res.data.notifications || [],
      unreadCount: res.data.unreadCount || 0,
    };
  },

  async markAsRead(id: string): Promise<void> {
    await api.put(`/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await api.put('/notifications/read-all');
  },

  async deleteNotification(id: string): Promise<void> {
    await api.delete(`/notifications/${id}`);
  },

  async clearAllNotifications(): Promise<void> {
    await api.delete('/notifications/clear-all');
  },
};
