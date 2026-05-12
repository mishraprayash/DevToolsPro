'use client';

import { useLayoutEffect } from 'react';
import { useAppStore } from '@/lib/store/useStore';

export function ThemeSync() {
  const setTheme = useAppStore((state) => state.setTheme);

  useLayoutEffect(() => {
    const saved = localStorage.getItem('devtools-theme') as 'dark' | 'light' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');

    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(theme);

    setTheme(theme);
  }, [setTheme]);

  return null;
}
