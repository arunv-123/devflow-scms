'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface DevFlowLogoProps {
  /** Size of the logo icon in pixels (e.g. 36 for sidebar/header, 40 for login) */
  size?: number;
  /** Custom className for the container */
  className?: string;
  /** Custom className for the image */
  imageClassName?: string;
  /** Whether to show the text next to the logo icon */
  showText?: boolean;
  /** Subtext underneath DevFlow title */
  subtext?: string;
  /** Whether the sidebar is collapsed */
  collapsed?: boolean;
}

export function DevFlowLogo({
  size = 36,
  className,
  imageClassName,
  showText = false,
  subtext = 'SCMS Enterprise',
  collapsed = false,
}: DevFlowLogoProps) {
  return (
    <div className={cn('flex items-center gap-3 shrink-0', className)}>
      <div
        className="relative shrink-0 flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        <Image
          src="/devflow-logo.png"
          alt="DevFlow Logo"
          width={size * 2}
          height={size * 2}
          priority
          className={cn('w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(56,189,248,0.25)]', imageClassName)}
        />
      </div>

      {showText && !collapsed && (
        <div className="truncate text-left">
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-100 dark:to-slate-300 bg-clip-text text-transparent block leading-tight">
            DevFlow
          </span>
          {subtext && (
            <span className="text-[10px] uppercase font-bold tracking-wider text-sky-600 dark:text-sky-400 block -mt-0.5 truncate">
              {subtext}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

