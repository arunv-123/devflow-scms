'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search,
  Bell,
  Plus,
  Sparkles,
  User,
  LogOut,
  ChevronDown,
  Globe,
  ExternalLink,
  Sliders,
  CheckCheck,
  CheckCircle2,
  Trash2,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  FolderKanban,
  CheckSquare,
  PhoneCall,
  UserCheck,
  Flag,
  Calendar,
  Users,
  Loader2,
  X,
  Sun,
  Moon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { useSidebar } from '@/context/SidebarContext';
import { useTheme } from '@/context/ThemeContext';
import { LiveSyncStatus } from '@/components/common/LiveSyncStatus';
import { NotificationItem } from '@/types';
import { searchApi, SearchResultsGrouped } from '@/services/searchApi';
import { cn } from '@/lib/utils';
import { getAvatarUrl } from '@/lib/avatar';

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const { toggleMobileSidebar } = useSidebar();
  const { resolvedTheme, setTheme } = useTheme();

  const handleToggleTheme = () => {
    const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };
  
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  // Global Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultsGrouped | null>(null);
  const [totalSearchCount, setTotalSearchCount] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const notifContainerRef = useRef<HTMLDivElement>(null);
  const profileContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const toggleNotifMenu = () => {
    setShowNotifMenu((prev) => !prev);
    setShowProfileMenu(false);
    setShowSearchDropdown(false);
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu((prev) => !prev);
    setShowNotifMenu(false);
    setShowSearchDropdown(false);
  };

  // Debounced Search API Query Effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setTotalSearchCount(0);
      setIsSearching(false);
      setSearchError(null);
      setShowSearchDropdown(false);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    const timer = setTimeout(async () => {
      try {
        const res = await searchApi.globalSearch(searchQuery);
        setSearchResults(res.results);
        setTotalSearchCount(res.total);
        setShowSearchDropdown(true);
      } catch (err: any) {
        console.error('Global search error:', err);
        setSearchError('Search failed to execute. Please try again.');
        setShowSearchDropdown(true);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Keyboard Shortcuts (Ctrl+K) & Global Pointer Down Click-Outside Listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        if (searchQuery.trim()) {
          setShowSearchDropdown(true);
        }
      }
      if (e.key === 'Escape') {
        setShowSearchDropdown(false);
        setShowNotifMenu(false);
        setShowProfileMenu(false);
        searchInputRef.current?.blur();
      }
    };

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (
        notifContainerRef.current &&
        !notifContainerRef.current.contains(target)
      ) {
        setShowNotifMenu(false);
      }
      if (
        profileContainerRef.current &&
        !profileContainerRef.current.contains(target)
      ) {
        setShowProfileMenu(false);
      }
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(target)
      ) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [searchQuery]);

  const handleSearchResultClick = (url: string) => {
    setShowSearchDropdown(false);
    router.push(url);
  };
  
  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.read) {
      try {
        await markAsRead(notif.id);
      } catch (e) {
        console.error('Failed to mark notification read:', e);
      }
    }

    setShowNotifMenu(false);

    // Clickable notification navigation with actionUrl / entity metadata & role protection
    const uRole = user?.role || '';
    const type = notif.entityType || notif.type;
    const isDevOrLead = ['Developer', 'Designer', 'QA', 'Team Lead'].includes(uRole);
    const isClient = uRole === 'Client';

    let targetUrl = notif.actionUrl || '';

    // Sanitize destination based on user RBAC permissions
    if (type === 'meeting' || targetUrl.startsWith('/crm')) {
      if (isDevOrLead) {
        targetUrl = '/notifications';
      } else if (isClient) {
        targetUrl = notif.entityId ? `/crm/meetings?meetingId=${notif.entityId}` : '/crm/meetings';
      } else {
        targetUrl = targetUrl || (notif.entityId ? `/crm/meetings?meetingId=${notif.entityId}` : '/crm/meetings');
      }
    } else if (type === 'task' || targetUrl.startsWith('/tasks')) {
      targetUrl = targetUrl || (notif.entityId ? `/tasks?taskId=${notif.entityId}` : '/tasks');
    } else if (type === 'milestone' || targetUrl.startsWith('/milestones')) {
      targetUrl = targetUrl || (notif.entityId ? `/milestones?milestoneId=${notif.entityId}` : '/milestones');
    } else if (type === 'project' || targetUrl.startsWith('/projects')) {
      targetUrl = targetUrl || (notif.entityId ? `/projects?projectId=${notif.entityId}` : '/projects');
    } else if (type === 'ai' || targetUrl.startsWith('/ai')) {
      targetUrl = '/ai-assistant';
    } else if (!targetUrl) {
      targetUrl = '/notifications';
    }

    if (isDevOrLead && (targetUrl.startsWith('/crm') || targetUrl.startsWith('/settings') || targetUrl.startsWith('/reports') || targetUrl.startsWith('/team') || targetUrl.startsWith('/workload'))) {
      targetUrl = '/notifications';
    }

    router.push(targetUrl);
  };

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markAllAsRead();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleDeleteItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

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

  const displayBadgeText = unreadCount > 99 ? '99+' : unreadCount.toString();

  return (
    <header className="h-16 border-b border-slate-800 bg-[#060913]/90 backdrop-blur-md sticky top-0 z-20 px-4 md:px-6 flex items-center justify-between">
      {/* Title & Path & Toggle Triggers */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Mobile Menu Drawer Toggle Button */}
        <button
          onClick={toggleMobileSidebar}
          aria-label="Open mobile navigation menu"
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 md:hidden transition-colors"
        >
          <Menu className="size-5" />
        </button>

        <h1 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
          {formatTitle(pathname)}
        </h1>
        <LiveSyncStatus />
      </div>

      {/* Center Global Search Trigger */}
      <div ref={searchContainerRef} className="hidden lg:flex items-center w-80 relative">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (searchQuery.trim()) setShowSearchDropdown(true);
            }}
            placeholder="Search projects, tasks, leads... (Ctrl+K)"
            className="w-full h-9 pl-9 pr-8 text-xs bg-[#0b0f19] border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setShowSearchDropdown(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Global Search Results Dropdown */}
        {showSearchDropdown && (
          <div className="absolute top-full left-0 mt-2 w-[440px] rounded-xl bg-[#0b0f19]/95 backdrop-blur-xl border border-slate-800 shadow-2xl z-50 max-h-[75vh] overflow-y-auto p-2 text-xs space-y-2 animate-fadeIn">
            {isSearching ? (
              <div className="p-4 text-center text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="size-4 animate-spin text-sky-400" />
                <span>Searching workspace...</span>
              </div>
            ) : searchError ? (
              <div className="p-3 text-center text-rose-400 font-medium">
                {searchError}
              </div>
            ) : totalSearchCount === 0 ? (
              <div className="p-4 text-center text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300">No results found</p>
                <p className="text-[11px] text-slate-500">No records matching "{searchQuery}"</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Projects */}
                {searchResults?.projects && searchResults.projects.length > 0 && (
                  <div className="space-y-1">
                    <div className="px-2 py-1 text-[10px] font-bold text-sky-400 uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <FolderKanban className="size-3.5" />
                        <span>Projects</span>
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-400">
                        {searchResults.projects.length}
                      </span>
                    </div>
                    {searchResults.projects.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSearchResultClick(item.url)}
                        className="p-2 rounded-lg hover:bg-slate-800/60 cursor-pointer transition-colors flex flex-col space-y-0.5"
                      >
                        <span className="font-bold text-white leading-tight">{item.title}</span>
                        <span className="text-[11px] text-slate-400 truncate">{item.subtitle}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tasks */}
                {searchResults?.tasks && searchResults.tasks.length > 0 && (
                  <div className="space-y-1 border-t border-slate-800/60 pt-2">
                    <div className="px-2 py-1 text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <CheckSquare className="size-3.5" />
                        <span>Tasks & Subtasks</span>
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400">
                        {searchResults.tasks.length}
                      </span>
                    </div>
                    {searchResults.tasks.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSearchResultClick(item.url)}
                        className="p-2 rounded-lg hover:bg-slate-800/60 cursor-pointer transition-colors flex flex-col space-y-0.5"
                      >
                        <span className="font-bold text-white leading-tight">{item.title}</span>
                        <span className="text-[11px] text-slate-400 truncate">{item.subtitle}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Leads */}
                {searchResults?.leads && searchResults.leads.length > 0 && (
                  <div className="space-y-1 border-t border-slate-800/60 pt-2">
                    <div className="px-2 py-1 text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <PhoneCall className="size-3.5" />
                        <span>Leads Pipeline</span>
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-400">
                        {searchResults.leads.length}
                      </span>
                    </div>
                    {searchResults.leads.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSearchResultClick(item.url)}
                        className="p-2 rounded-lg hover:bg-slate-800/60 cursor-pointer transition-colors flex flex-col space-y-0.5"
                      >
                        <span className="font-bold text-white leading-tight">{item.title}</span>
                        <span className="text-[11px] text-slate-400 truncate">{item.subtitle}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Clients */}
                {searchResults?.clients && searchResults.clients.length > 0 && (
                  <div className="space-y-1 border-t border-slate-800/60 pt-2">
                    <div className="px-2 py-1 text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <UserCheck className="size-3.5" />
                        <span>Clients</span>
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400">
                        {searchResults.clients.length}
                      </span>
                    </div>
                    {searchResults.clients.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSearchResultClick(item.url)}
                        className="p-2 rounded-lg hover:bg-slate-800/60 cursor-pointer transition-colors flex flex-col space-y-0.5"
                      >
                        <span className="font-bold text-white leading-tight">{item.title}</span>
                        <span className="text-[11px] text-slate-400 truncate">{item.subtitle}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Milestones */}
                {searchResults?.milestones && searchResults.milestones.length > 0 && (
                  <div className="space-y-1 border-t border-slate-800/60 pt-2">
                    <div className="px-2 py-1 text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Flag className="size-3.5" />
                        <span>Milestones</span>
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400">
                        {searchResults.milestones.length}
                      </span>
                    </div>
                    {searchResults.milestones.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSearchResultClick(item.url)}
                        className="p-2 rounded-lg hover:bg-slate-800/60 cursor-pointer transition-colors flex flex-col space-y-0.5"
                      >
                        <span className="font-bold text-white leading-tight">{item.title}</span>
                        <span className="text-[11px] text-slate-400 truncate">{item.subtitle}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Meetings */}
                {searchResults?.meetings && searchResults.meetings.length > 0 && (
                  <div className="space-y-1 border-t border-slate-800/60 pt-2">
                    <div className="px-2 py-1 text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="size-3.5" />
                        <span>Meetings</span>
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400">
                        {searchResults.meetings.length}
                      </span>
                    </div>
                    {searchResults.meetings.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSearchResultClick(item.url)}
                        className="p-2 rounded-lg hover:bg-slate-800/60 cursor-pointer transition-colors flex flex-col space-y-0.5"
                      >
                        <span className="font-bold text-white leading-tight">{item.title}</span>
                        <span className="text-[11px] text-slate-400 truncate">{item.subtitle}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Team Members */}
                {searchResults?.team && searchResults.team.length > 0 && (
                  <div className="space-y-1 border-t border-slate-800/60 pt-2">
                    <div className="px-2 py-1 text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Users className="size-3.5" />
                        <span>Team Members</span>
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400">
                        {searchResults.team.length}
                      </span>
                    </div>
                    {searchResults.team.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSearchResultClick(item.url)}
                        className="p-2 rounded-lg hover:bg-slate-800/60 cursor-pointer transition-colors flex items-center gap-2.5"
                      >
                        <div className="size-7 rounded-full bg-slate-800 overflow-hidden shrink-0 font-bold text-[10px] text-white flex items-center justify-center">
                          {item.avatar ? (
                            <img src={item.avatar} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            item.title.charAt(0)
                          )}
                        </div>
                        <div className="flex flex-col truncate">
                          <span className="font-bold text-white leading-tight">{item.title}</span>
                          <span className="text-[11px] text-slate-400 truncate">{item.subtitle}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Landing Page Link */}
        <Link
          href="/"
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900/60 transition-colors shrink-0"
          title="Landing Page"
          aria-label="Landing Page"
        >
          <Globe className="size-4" />
        </Link>

        {/* Simple Icon-Only Navbar Theme Button */}
        <button
          type="button"
          onClick={handleToggleTheme}
          title={resolvedTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={resolvedTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="navbar-theme-btn group/themebtn p-2 rounded-lg text-slate-400 dark:hover:text-amber-300 hover:bg-slate-800/60 dark:hover:bg-slate-800/60 border border-slate-800/80 dark:border-slate-800/80 transition-colors shrink-0 flex items-center justify-center size-9"
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="size-4 text-amber-400 transition-colors" />
          ) : (
            <Moon className="size-4 text-sky-600 transition-colors" />
          )}
        </button>


        {/* AI Assistant Quick Launcher */}
        <Link href="/ai/assistant">
          <Button
            size="sm"
            variant="outline"
            className="border-sky-500/40 dark:border-sky-500/30 bg-sky-50 dark:bg-sky-950/20 hover:bg-sky-100 dark:hover:bg-sky-900/40 text-sky-700 dark:text-sky-300 text-xs gap-1.5 font-semibold"
          >
            <Sparkles className="size-3.5 text-sky-500 dark:text-sky-400 animate-pulse" />
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
        <div ref={notifContainerRef} className="relative">
          <button
            onClick={toggleNotifMenu}
            className="navbar-notif-btn group/notif relative size-9 rounded-lg text-slate-600 dark:text-slate-400 hover:text-white dark:hover:bg-slate-900/60 transition-colors flex items-center justify-center shrink-0"
            aria-label="Notifications"
          >
            <Bell className="navbar-notif-icon size-4 text-slate-600 dark:text-slate-400 group-hover/notif:text-white transition-colors" />
            {unreadCount > 0 && (
              <span className="navbar-notif-count absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-sky-500 text-white font-extrabold text-[10px] flex items-center justify-center ring-2 ring-white dark:ring-[#060913] shadow-md shadow-sky-500/30 z-10">
                {displayBadgeText}
              </span>
            )}
          </button>


          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-[#0b0f19] border border-slate-800 rounded-xl shadow-2xl p-3 space-y-2 z-50">
              <div className="flex items-center justify-between px-2 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-semibold bg-sky-500/20 text-sky-400 px-1.5 py-0.5 rounded-full">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-slate-400 hover:text-sky-400 flex items-center gap-1 transition-colors"
                      title="Mark all as read"
                    >
                      <CheckCheck className="size-3" />
                      <span>Read All</span>
                    </button>
                  )}
                  <Link
                    href="/notifications"
                    onClick={() => setShowNotifMenu(false)}
                    className="text-[11px] text-sky-400 hover:underline"
                  >
                    View All
                  </Link>
                </div>
              </div>

              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {loading && notifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500">Loading notifications...</div>
                ) : notifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    <CheckCircle2 className="size-6 text-slate-600 mx-auto mb-1.5" />
                    No notifications right now
                  </div>
                ) : (
                  notifications.slice(0, 5).map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-2.5 rounded-lg text-left cursor-pointer transition-colors border group relative ${
                        notif.read
                          ? 'bg-[#060913]/60 border-slate-800/40 opacity-75 hover:opacity-100 hover:bg-slate-800/40'
                          : 'bg-sky-950/20 border-sky-500/30 hover:bg-sky-900/30'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                        <span className="truncate pr-5">{notif.title}</span>
                        {!notif.read && (
                          <span className="size-1.5 rounded-full bg-sky-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug mt-1 line-clamp-2 pr-4">
                        {notif.message}
                      </p>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                        <span>
                          {typeof notif.timestamp === 'string'
                            ? notif.timestamp.includes('T')
                              ? new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : notif.timestamp
                            : 'Just now'}
                        </span>
                        <button
                          onClick={(e) => handleDeleteItem(e, notif.id)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-500 hover:text-red-400 transition-opacity"
                          title="Delete notification"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar Menu */}
        <div ref={profileContainerRef} className="relative">
          <button
            onClick={toggleProfileMenu}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            <img
              src={getAvatarUrl(user?.avatar, user)}
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
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <User className="size-3.5 text-slate-400" />
                <span>My Profile</span>
              </Link>
              <Link
                href="/settings"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Sliders className="size-3.5 text-slate-400" />
                <span>Settings</span>
              </Link>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  logout();
                }}
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
