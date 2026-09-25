'use client';

import React, { useRef, useEffect, useLayoutEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Flag,
  Users,
  BarChart2,
  PhoneCall,
  UserCheck,
  Calendar,
  FileText,
  Bell,
  Sparkles,
  Bot,
  BrainCircuit,
  Sliders,
  UserCircle,
  ExternalLink,
  Layers,
  LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockNotifications } from '@/lib/mockData';

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  aiGlow?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navigationGroups: NavGroup[] = [
  {
    title: 'Core Workspace',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Projects', href: '/projects', icon: FolderKanban, badge: '4' },
      { name: 'Tasks & Subtasks', href: '/tasks', icon: CheckSquare, badge: '4' },
      { name: 'Milestones', href: '/milestones', icon: Flag },
      { name: 'Team Directory', href: '/team', icon: Users },
      { name: 'Workload & Capacity', href: '/workload', icon: BarChart2 },
    ],
  },
  {
    title: 'CRM & Clients',
    items: [
      { name: 'CRM Pipeline', href: '/crm', icon: Layers },
      { name: 'Leads', href: '/crm/leads', icon: PhoneCall, badge: '3' },
      { name: 'Clients', href: '/crm/clients', icon: UserCheck },
      { name: 'Meetings', href: '/crm/meetings', icon: Calendar },
    ],
  },
  {
    title: 'AI Intelligence',
    items: [
      { name: 'Project Intelligence', href: '/ai/project-intelligence', icon: BrainCircuit, aiGlow: true },
      { name: 'Smart Team Matcher', href: '/ai/team-recommendations', icon: Sparkles, aiGlow: true },
      { name: 'AI Copilot Assistant', href: '/ai/assistant', icon: Bot, aiGlow: true },
    ],
  },
  {
    title: 'Workspace & Portal',
    items: [
      { name: 'Documents', href: '/documents', icon: FileText },
      { name: 'Notifications', href: '/notifications', icon: Bell, badge: mockNotifications.filter(n => !n.read).length.toString() },
      { name: 'Reports & Analytics', href: '/reports', icon: BarChart2 },
      { name: 'Client Portal', href: '/client-portal', icon: ExternalLink },
    ],
  },
  {
    title: 'Settings',
    items: [
      { name: 'System Settings', href: '/settings', icon: Sliders },
      { name: 'My Profile', href: '/profile', icon: UserCircle },
    ],
  },
];

// Persistent module-level scroll position memory
let globalSidebarScrollTop = 0;

export function AppSidebar() {
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement>(null);

  // Helper to restore scroll position to the nav container
  const restoreScroll = () => {
    if (navRef.current) {
      try {
        const saved = sessionStorage.getItem('devflow_sidebar_scroll');
        const scrollTop = saved !== null ? parseInt(saved, 10) : globalSidebarScrollTop;
        if (!isNaN(scrollTop)) {
          navRef.current.scrollTop = scrollTop;
        }
      } catch (err) {
        if (navRef.current) {
          navRef.current.scrollTop = globalSidebarScrollTop;
        }
      }
    }
  };

  // Synchronously restore scroll before paint on route change
  useLayoutEffect(() => {
    restoreScroll();
  }, [pathname]);

  // Secondary restore frame to ensure preservation after Next.js page transition settles
  useEffect(() => {
    restoreScroll();
    const timer = setTimeout(restoreScroll, 15);
    return () => clearTimeout(timer);
  }, [pathname]);

  // Track scroll position changes
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    globalSidebarScrollTop = scrollTop;
    try {
      sessionStorage.setItem('devflow_sidebar_scroll', String(scrollTop));
    } catch (err) {
      // Ignore session storage errors
    }
  };

  return (
    <aside className="w-64 shrink-0 border-r border-slate-800 bg-[#060913] flex flex-col h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800/80">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="size-9 rounded-xl bg-gradient-to-tr from-sky-400 via-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#060913] rounded-[10px] flex items-center justify-center">
              <Sparkles className="size-5 text-sky-400" />
            </div>
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              DevFlow
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-sky-400 block -mt-1">
              SCMS Enterprise
            </span>
          </div>
        </Link>
      </div>

      {/* Scrollable Navigation */}
      <div
        ref={navRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-6"
      >
        {navigationGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1.5">
            <h3 className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              {group.title}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150',
                      isActive
                        ? 'bg-sky-500/10 text-white border border-sky-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={cn(
                          'size-4 transition-colors',
                          isActive
                            ? 'text-sky-400'
                            : item.aiGlow
                            ? 'text-cyan-400 group-hover:text-cyan-300'
                            : 'text-slate-400 group-hover:text-slate-300'
                        )}
                      />
                      <span className="truncate">{item.name}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-semibold',
                          isActive
                            ? 'bg-sky-500 text-white'
                            : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700'
                        )}
                      >
                        {item.badge}
                      </span>
                    )}

                    {item.aiGlow && !item.badge && (
                      <span className="size-2 rounded-full bg-cyan-400 animate-pulse shadow-sm shadow-cyan-400/50" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Quick AI Pro Banner */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="p-3 rounded-xl bg-[#0e1424] border border-sky-500/20 space-y-2">
          <div className="flex items-center gap-2 text-sky-300 font-semibold text-xs">
            <BrainCircuit className="size-4 text-sky-400" />
            <span>AI Copilot Active</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Real-time project health & workload optimizations enabled.
          </p>
        </div>
      </div>
    </aside>
  );
}
