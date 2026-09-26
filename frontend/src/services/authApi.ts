import { api } from './api';
import { User } from '@/types';

export const authApi = {
  async login(email: string, password: string): Promise<{ user: User; token?: string }> {
    const res = await api.post<{ success: boolean; user: any; token?: string }>('/auth/login', {
      email,
      password,
    });
    return {
      user: res.data.user,
      token: res.data.token,
    };
  },

  async register(name: string, email: string, password: string, role: string = 'Super Admin'): Promise<{ user: User; token?: string }> {
    const res = await api.post<{ success: boolean; user: any; token?: string }>('/auth/register', {
      name,
      email,
      password,
      role,
    });
    return {
      user: res.data.user,
      token: res.data.token,
    };
  },

  async getMe(): Promise<User> {
    const res = await api.get<{ success: boolean; user: any }>('/auth/me');
    return res.data.user;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },
};
