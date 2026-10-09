'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';

import { usePathname } from 'next/navigation';
import { getRedirectUrlForRole } from '@/context/AuthContext';

interface AppLayoutProps {
  children: React.ReactNode;
}

function AppLayoutInner({ children }: AppLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/signin');
      return;
    }

    if (!loading && user) {
      const role = user.role;
      const isClient = role === 'Client';
      const isDev = ['Developer', 'Designer', 'QA'].includes(role);
      const isTeamLead = role === 'Team Lead';
      const isCoordinator = role === 'Project Coordinator';
      const isPM = role === 'Project Manager';

      // Client route guard: strictly allow Projects, Meetings, Client Portal, Documents, Notifications, Profile
      if (isClient) {
        const allowedClientRoutes = ['/client-portal', '/projects', '/crm/meetings', '/documents', '/notifications', '/profile'];
        const isAllowed = allowedClientRoutes.some((r) => pathname === r || pathname.startsWith(r + '/'));
        if (!isAllowed) {
          router.push('/client-portal');
          return;
        }
      }

      // Dev / Designer / QA route guard: block CRM admin, Team Matcher, Team/Workload admin, Settings, Reports, Client Portal
      if (isDev) {
        if (
          pathname.startsWith('/crm') ||
          pathname.startsWith('/settings') ||
          pathname.startsWith('/reports') ||
          pathname.startsWith('/team') ||
          pathname.startsWith('/workload') ||
          pathname.startsWith('/ai/team-recommendations') ||
          pathname.startsWith('/client-portal')
        ) {
          router.push('/tasks');
          return;
        }
      }

      // Team Lead route guard: block CRM admin, Settings, and Client Portal
      if (isTeamLead) {
        if (
          pathname.startsWith('/crm') ||
          pathname.startsWith('/settings') ||
          pathname.startsWith('/client-portal')
        ) {
          router.push('/projects');
          return;
        }
      }

      // Project Coordinator route guard: block System Settings, Client Portal, and CRM Leads/Clients
      if (isCoordinator) {
        if (
          pathname.startsWith('/settings') ||
          pathname.startsWith('/client-portal') ||
          pathname.startsWith('/crm/leads') ||
          pathname.startsWith('/crm/clients')
        ) {
          router.push('/projects');
          return;
        }
      }

      // PM route guard: block System Settings & Client Portal
      if (isPM) {
        if (pathname.startsWith('/settings') || pathname.startsWith('/client-portal')) {
          router.push('/projects');
          return;
        }
      }
    }
  }, [loading, isAuthenticated, user, pathname, router]);

  if (loading || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-[#060913] text-slate-100 flex items-center justify-center font-sans">
        <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
          <div className="size-4 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
          <span>Verifying session security...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex font-sans antialiased selection:bg-cyan-500/20 selection:text-cyan-400">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader />
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  return <AppLayoutInner>{children}</AppLayoutInner>;
}

