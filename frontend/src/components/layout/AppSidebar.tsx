'use client';

import React, { useRef, useState, useEffect, useLayoutEffect } from 'react';
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
  Clock,
  FileText,
  Bell,
  Sparkles,
  Bot,
  BrainCircuit,
  Sliders,
  UserCircle,
  ExternalLink,
  Layers,
  X,
  Sun,
  Menu,
  LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockNotifications } from '@/lib/mockData';
import { useAuth } from '@/context/AuthContext';
import { useSidebar } from '@/context/SidebarContext';
import { DevFlowLogo } from '@/components/common/DevFlowLogo';

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
      { name: 'Activity Logs', href: '/activity-logs', icon: Clock },
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
  const { user } = useAuth();
  const { isCollapsed, toggleSidebar, isMobileOpen, setMobileOpen } = useSidebar();
  const [isHovered, setIsHovered] = useState<boolean>(false);

  // Effective collapsed state: collapsed by default, expands automatically on hover or when manually pinned open
  const effectiveCollapsed = isCollapsed && !isHovered;
  const role = user?.role || 'Admin';

  const isClient = role === 'Client';
  const isDev = ['Developer', 'Designer', 'QA'].includes(role);
  const isTeamLead = role === 'Team Lead';
  const isCoordinator = role === 'Project Coordinator';
  const isPM = role === 'Project Manager';

  // Filter navigation groups based on user role (Preserving existing RBAC strictly)
  const filteredGroups = navigationGroups
    .map((group) => {
      if (isClient) {
        if (group.title === 'Core Workspace') {
          return {
            ...group,
            items: group.items.filter((i) => i.href === '/projects'),
          };
        }
        if (group.title === 'CRM & Clients') {
          return {
            ...group,
            items: group.items.filter((i) => i.href === '/crm/meetings'),
          };
        }
        if (group.title === 'AI Intelligence') return { ...group, items: [] };
        if (group.title === 'Workspace & Portal') {
          return {
            ...group,
            items: group.items.filter((i) => ['/client-portal', '/documents', '/notifications'].includes(i.href)),
          };
        }
        if (group.title === 'Settings') {
          return {
            ...group,
            items: group.items.filter((i) => i.href === '/profile'),
          };
        }
        return { ...group, items: [] };
      }

      if (isDev) {
        if (group.title === 'Core Workspace') {
          return {
            ...group,
            items: group.items.filter((i) => ['/dashboard', '/projects', '/tasks', '/milestones'].includes(i.href)),
          };
        }
        if (group.title === 'CRM & Clients') return { ...group, items: [] };
        if (group.title === 'AI Intelligence') {
          return {
            ...group,
            items: group.items.filter((i) => i.href !== '/ai/team-recommendations'),
          };
        }
        if (group.title === 'Workspace & Portal') {
          return {
            ...group,
            items: group.items.filter((i) => ['/documents', '/activity-logs', '/notifications'].includes(i.href)),
          };
        }
        if (group.title === 'Settings') {
          return {
            ...group,
            items: group.items.filter((i) => i.href === '/profile'),
          };
        }
      }

      if (isTeamLead) {
        if (group.title === 'CRM & Clients') return { ...group, items: [] };
        if (group.title === 'Workspace & Portal') {
          return {
            ...group,
            items: group.items.filter((i) => i.href !== '/client-portal'),
          };
        }
        if (group.title === 'Settings') {
          return {
            ...group,
            items: group.items.filter((i) => i.href === '/profile'),
          };
        }
      }

      if (isCoordinator) {
        if (group.title === 'CRM & Clients') {
          return {
            ...group,
            items: group.items.filter((i) => i.href === '/crm/meetings'),
          };
        }
        if (group.title === 'Workspace & Portal') {
          return {
            ...group,
            items: group.items.filter((i) => i.href !== '/client-portal'),
          };
        }
        if (group.title === 'Settings') {
          return {
            ...group,
            items: group.items.filter((i) => i.href === '/profile'),
          };
        }
      }

      if (isPM) {
        if (group.title === 'Workspace & Portal') {
          return {
            ...group,
            items: group.items.filter((i) => i.href !== '/client-portal'),
          };
        }
        if (group.title === 'Settings') {
          return {
            ...group,
            items: group.items.filter((i) => i.href === '/profile'),
          };
        }
      }

      return group;
    })
    .filter((group) => group.items.length > 0);

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

  const handleNavClick = () => {
    if (isMobileOpen) {
      setMobileOpen(false);
    }
  };

  // Common inner sidebar content (works for both desktop and mobile drawer)
  const renderSidebarContent = (collapsedState: boolean, isMobileView = false) => (
    <div className="flex flex-col h-full w-full select-none overflow-hidden">
      {/* Brand Header */}
      <div
        className={cn(
          'h-16 border-b border-slate-800/80 flex items-center transition-all duration-300 shrink-0',
          collapsedState && !isMobileView ? 'justify-center px-0' : 'justify-between px-4'
        )}
      >
        <Link
          href="/dashboard"
          onClick={handleNavClick}
          className="flex items-center gap-3 group overflow-hidden"
          title="DevFlow Workspace Dashboard"
        >
          <DevFlowLogo
            size={collapsedState && !isMobileView ? 38 : 42}
            showText={!collapsedState || isMobileView}
            subtext="SCMS Enterprise"
            collapsed={collapsedState && !isMobileView}
          />
        </Link>

        {/* Mobile Close Button */}
        {isMobileView && (
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <X className="size-5" />
          </button>
        )}
      </div>

      {/* Scrollable Navigation Area */}
      <div
        ref={navRef}
        onScroll={handleScroll}
        className={cn(
          'flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-4 transition-all duration-300',
          collapsedState && !isMobileView ? 'px-2' : 'px-4'
        )}
      >


        {filteredGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1.5">
            {!collapsedState || isMobileView ? (
              <h3 className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                {group.title}
              </h3>
            ) : (
              <div className="my-1.5 border-t border-slate-800/80 mx-2" />
            )}

            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/dashboard' && item.href !== '/crm' && pathname.startsWith(item.href + '/'));
                const Icon = item.icon;

                if (collapsedState && !isMobileView) {
                  // Collapsed Icon-Only View with Custom Accessible Tooltip
                  return (
                    <div key={item.href} className="relative group/tooltip flex justify-center">
                      <Link
                        href={item.href}
                        onClick={handleNavClick}
                        className={cn(
                          'flex items-center justify-center size-10 rounded-lg text-xs font-medium transition-all duration-150 relative mx-auto',
                          isActive
                            ? 'bg-sky-500/10 text-white border border-sky-500/30 shadow-sm'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                        )}
                        aria-label={item.name}
                      >
                        <Icon
                          className={cn(
                            'size-5 transition-colors',
                            isActive
                              ? 'text-sky-400'
                              : item.aiGlow
                              ? 'text-cyan-400 group-hover/tooltip:text-cyan-300'
                              : 'text-slate-400 group-hover/tooltip:text-slate-300'
                          )}
                        />

                        {/* Notification Badge Dot / Count */}
                        {item.badge && (
                          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-sky-500 text-[9px] font-bold text-white ring-2 ring-[#060913] shadow-md">
                            {item.badge}
                          </span>
                        )}

                        {/* AI Pulse Dot */}
                        {item.aiGlow && !item.badge && (
                          <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-cyan-400 animate-pulse ring-2 ring-[#060913] shadow-sm shadow-cyan-400/50" />
                        )}
                      </Link>

                      {/* Custom Accessible Floating Tooltip */}
                      <div className="opacity-0 scale-95 group-hover/tooltip:opacity-100 group-hover/tooltip:scale-100 group-hover/tooltip:pointer-events-auto transition-all duration-150 pointer-events-none fixed left-16 ml-3.5 -translate-y-1/2 z-[100] whitespace-nowrap rounded-lg bg-[#0b0f19] border border-slate-700/90 px-3 py-1.5 text-xs font-semibold text-white shadow-2xl flex items-center gap-2 drop-shadow-lg">
                        <div className="absolute -left-1 top-1/2 -translate-y-1/2 size-2 rotate-45 bg-[#0b0f19] border-l border-b border-slate-700/90" />
                        <span>{item.name}</span>
                        {item.badge && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-sky-500 text-white font-bold">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }

                // Expanded View
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleNavClick}
                    className={cn(
                      'group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150',
                      isActive
                        ? 'bg-sky-500/10 text-white border border-sky-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={cn(
                          'size-4 shrink-0 transition-colors',
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
                          'px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ml-1',
                          isActive
                            ? 'bg-sky-500 text-white'
                            : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700'
                        )}
                      >
                        {item.badge}
                      </span>
                    )}

                    {item.aiGlow && !item.badge && (
                      <span className="size-2 rounded-full bg-cyan-400 animate-pulse shadow-sm shadow-cyan-400/50 shrink-0 ml-1" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
        />
      )}

      {/* Mobile Drawer (Slide-over) */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-[#060913] border-r border-slate-800 flex flex-col h-full transform transition-transform duration-300 ease-in-out md:hidden shadow-2xl',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {renderSidebarContent(false, true)}
      </aside>

      {/* Desktop Sticky Sidebar with Smooth Hover-to-Expand Animation */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          'hidden md:flex flex-col h-screen sticky top-0 z-30 select-none bg-[#060913] border-r border-slate-800 shrink-0 transition-all duration-300 ease-in-out shadow-2xl',
          effectiveCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {renderSidebarContent(effectiveCollapsed, false)}
      </aside>
    </>
  );
}
