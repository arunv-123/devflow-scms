'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search,
  Bell,
  Plus,
  Sparkles,
  Bot,
  User,
  LogOut,
  ChevronDown,
  Globe,
  Sliders,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mockNotifications } from '@/lib/mockData';
import { useAuth } from '@/context/AuthContext';

export function AppHeader() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const unreadCount = mockNotifications.filter((n) => !n.read).length;

  const formatTitle = (path: string) => {
    if (path === '/dashboard') return 'Dashboard Overview';
    if (path.startsWith('/projects')) return 'Project Management';
    if (path.startsWith('/tasks')) return 'Tasks & Subtasks';
    if (path.startsWith('/milestones')) return 'Milestone Roadmap';
    if (path.startsWith('/team')) return 'Team Directory & Skills';
    if (path.startsWith('/workload')) return 'Workload & Capacity Engine';
    if (path.startsWith('/crm/leads')) return 'CRM Leads Pipeline';
    if (path.startsWith('/crm/clients')) return 'Client Management';
    if (path.startsWith('/crm/meetings')) return 'Meeting Schedules & Notes';
    if (path.startsWith('/crm')) return 'CRM Overview';
    if (path.startsWith('/ai/project-intelligence')) return 'AI Project Intelligence';
    if (path.startsWith('/ai/team-recommendations')) return 'Smart Team Matcher';
    if (path.startsWith('/ai/assistant')) return 'AI Project Copilot';
    if (path.startsWith('/documents')) return 'Document Repository';
    if (path.startsWith('/notifications')) return 'System Notifications';
    if (path.startsWith('/reports')) return 'Reports & Analytics';
    if (path.startsWith('/client-portal')) return 'Client Portal Workspace';
    if (path.startsWith('/settings')) return 'System Settings';
    if (path.startsWith('/profile')) return 'User Profile';
    return 'DevFlow Workspace';
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-[#060913]/90 backdrop-blur-md sticky top-0 z-20 px-6 flex items-center justify-between">
      {/* Title & Path */}
      <div className="flex items-center gap-3">
        <h1 className="text-base font-bold text-white tracking-tight">
          {formatTitle(pathname)}
        </h1>
        <span className="hidden md:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
          Live Sync
        </span>
      </div>

      {/* Center Global Search Trigger */}
      <div className="hidden lg:flex items-center w-72">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects, tasks, leads... (Ctrl+K)"
            className="w-full h-9 pl-9 pr-4 text-xs bg-[#0b0f19] border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Landing Page Link */}
        <Link
          href="/"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-[#0b0f19] border border-slate-800 hover:border-slate-700 rounded-lg transition-colors"
          title="View Landing Page"
        >
          <Globe className="size-3.5 text-sky-400" />
          <span>Landing Page</span>
        </Link>

        {/* AI Assistant Quick Launcher */}
        <Link href="/ai/assistant">
          <Button
            size="sm"
            variant="outline"
            className="border-sky-500/30 bg-sky-950/20 hover:bg-sky-900/40 text-sky-300 text-xs gap-1.5"
          >
            <Sparkles className="size-3.5 text-sky-400 animate-pulse" />
            <span className="hidden sm:inline">Ask AI</span>
          </Button>
        </Link>

        {/* Create Quick Task / Project */}
        <Link href="/tasks">
          <Button size="sm" className="bg-sky-600 hover:bg-sky-500 text-white text-xs gap-1.5 shadow-md shadow-sky-600/20">
            <Plus className="size-4" />
            <span className="hidden sm:inline">New Task</span>
          </Button>
        </Link>

        {/* Notification Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900/60 transition-colors"
          >
            <Bell className="size-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-sky-400 ring-2 ring-[#060913]" />
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-[#0b0f19] border border-slate-800 rounded-xl shadow-2xl p-3 space-y-2 z-50">
              <div className="flex items-center justify-between px-2 pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-white">Notifications</span>
                <Link href="/notifications" className="text-[11px] text-sky-400 hover:underline">
                  View All
                </Link>
              </div>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {mockNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="p-2 rounded-lg bg-[#060913] hover:bg-slate-800/50 border border-slate-800/60 transition-colors space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                      <span>{notif.title}</span>
                      <span className="text-[10px] text-slate-500">{notif.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">{notif.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar Menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={user?.name || 'User'}
              className="size-7 rounded-full object-cover ring-2 ring-sky-500/40"
            />
            <ChevronDown className="size-3.5 text-slate-400 hidden sm:inline" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-[#0b0f19] border border-slate-800 rounded-xl shadow-2xl p-2 space-y-1 z-50">
              <div className="px-3 py-2 border-b border-slate-800">
                <p className="text-xs font-bold text-white">{user?.name || 'Authenticated User'}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email || ''}</p>
                <span className="mt-1 inline-block text-[10px] font-semibold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                  {user?.role || 'Member'}
                </span>
              </div>
              <Link
                href="/profile"
                className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <User className="size-3.5 text-slate-400" />
                <span>My Profile</span>
              </Link>
              <Link
                href="/settings"
                className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Sliders className="size-3.5 text-slate-400" />
                <span>Settings</span>
              </Link>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-950/30 rounded-lg transition-colors text-left"
              >
                <LogOut className="size-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
