'use client';

import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme, ThemeMode } from '@/context/ThemeContext';

interface ThemeSwitcherProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeSwitcher({ className = '', showLabel = true }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();

  const options: Array<{ id: ThemeMode; label: string; icon: React.ElementType }> = [
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div className={`space-y-2 ${className}`}>
      {showLabel && (
        <label className="text-xs font-semibold text-slate-400 dark:text-slate-400 block">
          Appearance Theme
        </label>
      )}

      {/* Segmented Control Container */}
      <div className="inline-flex items-center p-1 rounded-xl bg-[#060913] border border-slate-800 dark:bg-[#060913] dark:border-slate-800 light-theme-switcher-bg transition-colors">
        {options.map((opt) => {
          const Icon = opt.icon;
          const isActive = theme === opt.id;

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setTheme(opt.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm shadow-sky-500/10 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30 light-active-theme-btn'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent dark:text-slate-400 dark:hover:text-white light-theme-btn-hover'
              }`}
              title={`Switch to ${opt.label} theme`}
            >
              <Icon className={`size-3.5 ${isActive ? 'text-sky-400 animate-pulse' : 'text-slate-400'}`} />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
