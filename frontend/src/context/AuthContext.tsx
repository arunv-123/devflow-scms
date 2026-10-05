'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UserRole } from '@/types';
import { authApi } from '@/services/authApi';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  refreshUser: () => Promise<User | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  login: async () => {
    throw new Error('AuthContext not initialized');
  },
  refreshUser: async () => null,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string): Promise<User> => {
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      setUser(res.user);
      return res.user;
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async (): Promise<User | null> => {
    try {
      const u = await authApi.getMe();
      setUser(u);
      return u;
    } catch (error: any) {
      // Only clear user session if HTTP status is 401 Unauthorized (invalid/expired token)
      if (error.response?.status === 401) {
        setUser(null);
        return null;
      }
      return user;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      console.error('Logout error', e);
    } finally {
      setUser(null);
      if (typeof window !== 'undefined') {
        window.location.replace('/auth/signin');
      }
    }
  };

  useEffect(() => {
    let isMounted = true;
    authApi
      .getMe()
      .then((u) => {
        if (isMounted) setUser(u);
      })
      .catch((error: any) => {
        // Only clear user session if HTTP status is 401 Unauthorized (invalid/expired token)
        if (isMounted && error.response?.status === 401) {
          setUser(null);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function getRedirectUrlForRole(role?: UserRole | string): string {
  switch (role) {
    case 'Super Admin':
    case 'Admin':
      return '/dashboard';
    case 'Project Manager':
    case 'Team Lead':
      return '/projects';
    case 'Developer':
    case 'Designer':
    case 'QA':
      return '/tasks';
    case 'Client':
      return '/client-portal';
    default:
      return '/dashboard';
  }
}
