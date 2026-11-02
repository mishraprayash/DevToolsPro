import * as React from 'react';
import { useState, useCallback, useEffect } from 'react';
import { toast } from '@/components/ui/Toast';

export interface Workspace<T> {
  id: string;
  name: string;
  state: T;
}

function deepClone<T>(v: T): T {
  try {
    if (typeof structuredClone === 'function') return structuredClone(v);
  } catch {}
  return JSON.parse(JSON.stringify(v));
}

export function useWorkspaces<T>(defaultState: T, defaultNamePrefix = 'Tab', storageKey?: string) {
  const [mounted, setMounted] = useState(false);

  const createNewWorkspace = useCallback((id: string, name: string): Workspace<T> => ({
    id,
    name,
    state: deepClone(defaultState)
  }), [defaultState]);

  const [workspaces, setWorkspaces] = useState<Workspace<T>[]>([
    createNewWorkspace('default-ssr-id', `${defaultNamePrefix} 1`)
  ]);

  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('default-ssr-id');

  // Hydrate from localStorage and URL Hash once on client (with IndexedDB fallback)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let hydratedWorkspaces = [createNewWorkspace(crypto.randomUUID(), `${defaultNamePrefix} 1`)];
      let hydratedActiveId = hydratedWorkspaces[0].id;

      let hasSharedState = false;

      // Check for shared URL hash
      try {
        const hash = window.location.hash;
        if (hash.startsWith('#share=')) {
          const encoded = hash.replace('#share=', '');
          const decoded = JSON.parse(decodeURIComponent(atob(encoded)));
          if (decoded) {
            const newId = crypto.randomUUID();
            hydratedWorkspaces = [{ id: newId, name: 'Shared Tab', state: { ...deepClone(defaultState), ...decoded } }];
            hydratedActiveId = newId;
            hasSharedState = true;
            // Clear hash so it doesn't persist on reload
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
          }
        }
      } catch (e) {
        if (process.env.NODE_ENV !== 'production') console.warn('Failed to parse shared state from URL hash', e);
      }

      if (storageKey && !hasSharedState) {
        try {
          const stored = localStorage.getItem(`devtools-workspaces-${storageKey}`);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
              hydratedWorkspaces = parsed;
              hydratedActiveId = parsed[0].id;
            }
          } else {
            // Fallback: try IndexedDB if localStorage was empty (quota-fallback path)
            try {
              const { idbGet } = await import('@/lib/storage/idbStorage');
              const idbData = await idbGet<Workspace<T>[]>(`devtools-workspaces-${storageKey}`);
              if (Array.isArray(idbData) && idbData.length > 0) {
                hydratedWorkspaces = idbData;
                hydratedActiveId = idbData[0].id;
              }
            } catch {}
          }
          const storedActive = localStorage.getItem(`devtools-active-workspace-${storageKey}`);
          if (storedActive && hydratedWorkspaces.find(w => w.id === storedActive)) {
            hydratedActiveId = storedActive;
          }
        } catch (e) {
          if (process.env.NODE_ENV !== 'production') console.warn(`Failed to parse workspaces for ${storageKey}`, e);
        }
      }

      if (!cancelled) {
        setWorkspaces(hydratedWorkspaces);
        setActiveWorkspaceId(hydratedActiveId);
        setMounted(true);
      }
    })();
    return () => { cancelled = true; };
  }, [storageKey, createNewWorkspace, defaultNamePrefix, defaultState]);

  // Persist workspaces — debounced + IndexedDB fallback when localStorage quota exceeded
  const persistTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!mounted || !storageKey) return;
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(async () => {
      const payload = JSON.stringify(workspaces);
      try {
        localStorage.setItem(`devtools-workspaces-${storageKey}`, payload);
      } catch (e) {
        if (process.env.NODE_ENV !== 'production') console.warn(`Failed to save workspaces for ${storageKey}. Trying IndexedDB fallback.`, e);
        try {
          const { idbSet } = await import('@/lib/storage/idbStorage');
          await idbSet(`devtools-workspaces-${storageKey}`, workspaces);
        } catch (err) {
          if (process.env.NODE_ENV !== 'production') console.warn('IndexedDB fallback also failed', err);
        }
      }
    }, 300);
    return () => { if (persistTimer.current) clearTimeout(persistTimer.current); };
  }, [workspaces, mounted, storageKey]);

  // Persist active id
  useEffect(() => {
    if (!mounted || !storageKey) return;
    try {
      localStorage.setItem(`devtools-active-workspace-${storageKey}`, activeWorkspaceId);
    } catch {
      // ignore — active id is tiny, quota unlikely
    }
  }, [activeWorkspaceId, mounted, storageKey]);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  const addWorkspace = useCallback(() => {
    setWorkspaces((prev) => {
      const newId = crypto.randomUUID();
      const newName = `${defaultNamePrefix} ${prev.length + 1}`;
      const newW = createNewWorkspace(newId, newName);
      setActiveWorkspaceId(newId);
      return [...prev, newW];
    });
  }, [createNewWorkspace, defaultNamePrefix]);

  const removeWorkspace = useCallback((id: string) => {
    setWorkspaces((prev) => {
      if (prev.length === 1) {
        // If it's the last workspace, create a new clean one instead of leaving it empty
        const newId = crypto.randomUUID();
        const newW = createNewWorkspace(newId, `${defaultNamePrefix} 1`);
        setActiveWorkspaceId(newId);
        return [newW];
      }
      
      const idx = prev.findIndex((w) => w.id === id);
      const filtered = prev.filter((w) => w.id !== id);
      
      if (id === activeWorkspaceId) {
        const nextActive = filtered[Math.min(idx, filtered.length - 1)];
        setActiveWorkspaceId(nextActive.id);
      }
      
      return filtered;
    });
  }, [activeWorkspaceId, createNewWorkspace, defaultNamePrefix]);

  const updateWorkspaceState = useCallback((id: string, partialState: Partial<T>) => {
    setWorkspaces((prev) => 
      prev.map((w) => 
        w.id === id ? { ...w, state: { ...w.state, ...partialState } } : w
      )
    );
  }, []);

  const updateActiveWorkspace = useCallback((partialState: Partial<T>) => {
    updateWorkspaceState(activeWorkspaceId, partialState);
  }, [activeWorkspaceId, updateWorkspaceState]);

  const copyShareLink = useCallback(() => {
    try {
      // Strip potentially massive generated outputs to save URL length if needed,
      // but for simplicity, we share the whole state.
      const encoded = btoa(encodeURIComponent(JSON.stringify(activeWorkspace.state)));
      const url = new URL(window.location.href);
      url.hash = `share=${encoded}`;
      
      if (url.toString().length > 2000) {
        toast({ type: 'error', message: 'State is too large to share via URL.' });
        return;
      }
      
      navigator.clipboard.writeText(url.toString());
      toast({ type: 'success', message: 'Shareable link copied to clipboard!' });
    } catch {
      toast({ type: 'error', message: 'Failed to generate share link.' });
    }
  }, [activeWorkspace.state]);

  return {
    workspaces,
    activeWorkspaceId,
    activeWorkspace,
    setActiveWorkspaceId,
    addWorkspace,
    removeWorkspace,
    updateWorkspaceState,
    updateActiveWorkspace,
    copyShareLink
  };
}
