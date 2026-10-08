'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

interface SmoothScrollContextType {
  lenis: Lenis | null;
}

const SmoothScrollContext = createContext<SmoothScrollContextType>({ lenis: null });

export const useSmoothScroll = () => useContext(SmoothScrollContext);

interface SmoothScrollProviderProps {
  children: React.ReactNode;
}

export function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  const [lenisInstance, setLenisInstance] = useState<Lenis | null>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    // Check user preference for reduced motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Professional, subtle configuration for enterprise SaaS
    const lenis = new Lenis({
      duration: prefersReducedMotion ? 0 : 0.9,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: !prefersReducedMotion,
      syncTouch: false, // Preserve native touch scrolling on mobile and touchscreens
      touchMultiplier: 1,
      wheelMultiplier: 1,
      anchors: true,
      stopInertiaOnNavigate: true,
      respectReducedMotion: true,
      prevent: (node: HTMLElement) => {
        if (!node || !(node instanceof HTMLElement)) return false;

        // 1. Explicit opt-out attributes
        if (
          node.hasAttribute('data-lenis-prevent') ||
          node.hasAttribute('data-lenis-prevent-wheel') ||
          node.hasAttribute('data-lenis-prevent-touch')
        ) {
          return true;
        }

        // 2. Native form controls that handle scrolling/text
        const tagName = node.tagName;
        if (tagName === 'TEXTAREA' || tagName === 'SELECT') {
          return true;
        }

        // 3. Modals, dialogs, dropdown menus, popovers, drawers
        if (
          node.closest(
            '[role="dialog"], [role="menu"], [role="listbox"], [data-radix-portal], .devflow-modal-enter, .devflow-backdrop-enter, [data-state="open"]'
          )
        ) {
          return true;
        }

        // 4. Fixed full-screen modal overlays
        if (node.closest('div[class*="fixed"][class*="inset-0"][class*="z-50"]')) {
          return true;
        }

        // 5. Internal scrollable containers (task lists, tables, dropdowns, code blocks)
        const scrollableContainer = node.closest(
          '.overflow-y-auto, .overflow-y-scroll, .overflow-x-auto, .overflow-x-scroll, .overflow-auto'
        ) as HTMLElement | null;

        if (scrollableContainer) {
          const isScrollableY =
            scrollableContainer.scrollHeight > scrollableContainer.clientHeight;
          const isScrollableX =
            scrollableContainer.scrollWidth > scrollableContainer.clientWidth;
          if (isScrollableY || isScrollableX) {
            return true;
          }
        }

        return false;
      },
    });

    lenisRef.current = lenis;
    setLenisInstance(lenis);

    // Animation frame loop
    let rafId: number;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    // Listen for reduced motion preference changes
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        lenis.stop();
      } else {
        lenis.start();
      }
    };
    mediaQuery.addEventListener('change', handleReducedMotionChange);

    return () => {
      cancelAnimationFrame(rafId);
      mediaQuery.removeEventListener('change', handleReducedMotionChange);
      lenis.destroy();
      lenisRef.current = null;
      setLenisInstance(null);
    };
  }, []);

  // Handle route change: scroll to top immediately unless navigating to a hash
  useEffect(() => {
    if (lenisRef.current && typeof window !== 'undefined' && !window.location.hash) {
      lenisRef.current.scrollTo(0, { immediate: true });
    }
  }, [pathname]);

  return (
    <SmoothScrollContext.Provider value={{ lenis: lenisInstance }}>
      {children}
    </SmoothScrollContext.Provider>
  );
}
