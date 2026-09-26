import { api } from './api';
import { TeamMember } from '@/types';

export const usersApi = {
  async getUsers(params?: { search?: string; role?: string }): Promise<TeamMember[]> {
    const res = await api.get<{ success: boolean; users: TeamMember[] }>('/users', { params });
    return res.data.users;
  },

  async getUserById(id: string): Promise<TeamMember> {
    const res = await api.get<{ success: boolean; user: TeamMember }>(`/users/${id}`);
    return res.data.user;
  },

  async createUser(data: Partial<TeamMember> & { password?: string }): Promise<TeamMember> {
    const res = await api.post<{ success: boolean; user: TeamMember }>('/users', data);
    return res.data.user;
  },

  async updateUser(id: string, data: Partial<TeamMember>): Promise<TeamMember> {
    const res = await api.put<{ success: boolean; user: TeamMember }>(`/users/${id}`, data);
    return res.data.user;
  },

  async deleteUser(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },
};
