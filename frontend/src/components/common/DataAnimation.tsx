'use client';

import React, { useState, useEffect } from 'react';

// Count-up helper component that animates numeric values on initial mount
export function CountUpNumber({
  value,
  duration = 800,
  decimals = 0,
  prefix = '',
  suffix = '',
  formatter,
  className = '',
}: {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  formatter?: (value: number) => string;
  className?: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayValue(value);
      return;
    }

    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);

      setDisplayValue(easeOut * value);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  const formattedContent = formatter
    ? formatter(Math.round(displayValue))
    : `${prefix}${displayValue.toFixed(decimals)}${suffix}`;

  return (
    <span className={className}>
      {formattedContent}
    </span>
  );
}

// Progress/workload bar helper component that fills from 0% on initial mount
export function AnimatedProgressBar({
  percentage,
  className = 'h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400',
  trackClassName = 'w-full bg-[#0b0f19] rounded-full h-1.5 overflow-hidden border border-slate-800',
}: {
  percentage: number;
  className?: string;
  trackClassName?: string;
}) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setWidth(percentage);
      return;
    }

    const timer = setTimeout(() => {
      setWidth(percentage);
    }, 40);

    return () => clearTimeout(timer);
  }, [percentage]);

  return (
    <div className={trackClassName}>
      <div
        className={`${className} transition-all duration-700 ease-out`}
        style={{ width: `${Math.min(Math.max(width, 0), 100)}%` }}
      />
    </div>
  );
}

// Circular Donut/Radial Health Score animation helper component
export function AnimatedDonutScore({
  score = 87,
  size = 140,
  strokeWidth = 10,
  colorClass = 'text-sky-400',
  showCenterText = true,
  centerIcon,
}: {
  score?: number;
  size?: number;
  strokeWidth?: number;
  colorClass?: string;
  showCenterText?: boolean;
  centerIcon?: React.ReactNode;
}) {
  const [dash, setDash] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDash(score);
      return;
    }

    const timer = setTimeout(() => {
      setDash(score);
    }, 50);

    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg className="size-full transform -rotate-90" viewBox="0 0 36 36">
        <path
          className="text-slate-800"
          strokeWidth={strokeWidth / 2.5}
          stroke="currentColor"
          fill="none"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        />
        <path
          className={`${colorClass} transition-all duration-1000 ease-out`}
          strokeDasharray={`${dash}, 100`}
          strokeWidth={strokeWidth / 2.5}
          strokeLinecap="round"
          stroke="currentColor"
          fill="none"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        />
      </svg>
      {showCenterText ? (
        <div className="absolute text-center flex flex-col items-center justify-center">
          <CountUpNumber value={score} className="text-xl font-extrabold text-white block" />
          <span className="text-[8px] font-bold text-sky-400 uppercase tracking-widest block">Health</span>
        </div>
      ) : centerIcon ? (
        <div className="absolute flex items-center justify-center pointer-events-none">
          {centerIcon}
        </div>
      ) : null}
    </div>
  );
}
