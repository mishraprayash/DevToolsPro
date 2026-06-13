'use client';

import { useLayoutEffect } from 'react';
import { useAppStore } from '@/lib/store/useStore';

function readPersistedTheme(): 'dark' | 'light' {
  try {
    const stored = localStorage.getItem('devtools-storage');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.state?.theme === 'light' || parsed.state?.theme === 'dark') {
        return parsed.state.theme;
      }
    }
  } catch {}
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeSync() {
  const setTheme = useAppStore((state) => state.setTheme);
  const hasHydrated = useAppStore.persist?.hasHydrated?.() ?? false;

  useLayoutEffect(() => {
    const target = readPersistedTheme();

    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(target);

    if (hasHydrated) {
      setTheme(target);
    } else {
      useAppStore.persist?.onFinishHydration?.(() => {
        setTheme(target);
      });
    }
  }, [setTheme, hasHydrated]);

  return null;
}
