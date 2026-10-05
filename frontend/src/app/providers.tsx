'use client';

import React from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <SidebarProvider>
            {children}
          </SidebarProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

