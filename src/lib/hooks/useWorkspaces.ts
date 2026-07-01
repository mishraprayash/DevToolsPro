import { useState, useCallback, useEffect } from 'react';
import { toast } from '@/components/ui/Toast';

export interface Workspace<T> {
  id: string;
  name: string;
  state: T;
}

export function useWorkspaces<T>(defaultState: T, defaultNamePrefix = 'Tab', storageKey?: string) {
  const [mounted, setMounted] = useState(false);

  const createNewWorkspace = useCallback((id: string, name: string): Workspace<T> => ({
    id,
    name,
    state: { ...defaultState }
  }), [defaultState]);

  const [workspaces, setWorkspaces] = useState<Workspace<T>[]>([
    createNewWorkspace('default-ssr-id', `${defaultNamePrefix} 1`)
  ]);

  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('default-ssr-id');

  // Hydrate from localStorage and URL Hash once on client
  useEffect(() => {
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
          hydratedWorkspaces = [{ id: newId, name: 'Shared Tab', state: { ...defaultState, ...decoded } }];
          hydratedActiveId = newId;
          hasSharedState = true;
          // Clear hash so it doesn't persist on reload
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }
    } catch (e) {
      console.warn('Failed to parse shared state from URL hash', e);
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
        }
        const storedActive = localStorage.getItem(`devtools-active-workspace-${storageKey}`);
        if (storedActive && hydratedWorkspaces.find(w => w.id === storedActive)) {
          hydratedActiveId = storedActive;
        }
      } catch (e) {
        console.warn(`Failed to parse workspaces for ${storageKey}`, e);
      }
    }

    setWorkspaces(hydratedWorkspaces);
    setActiveWorkspaceId(hydratedActiveId);
    setMounted(true);
  }, [storageKey, createNewWorkspace, defaultNamePrefix, defaultState]);

  // Persist workspaces
  useEffect(() => {
    if (!mounted || !storageKey) return;
    try {
      localStorage.setItem(`devtools-workspaces-${storageKey}`, JSON.stringify(workspaces));
    } catch (e) {
      console.warn(`Failed to save workspaces for ${storageKey}. Quota exceeded?`, e);
    }
  }, [workspaces, mounted, storageKey]);

  // Persist active id
  useEffect(() => {
    if (!mounted || !storageKey) return;
    try {
      localStorage.setItem(`devtools-active-workspace-${storageKey}`, activeWorkspaceId);
    } catch (e) {
      // ignore
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
    } catch (e) {
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
