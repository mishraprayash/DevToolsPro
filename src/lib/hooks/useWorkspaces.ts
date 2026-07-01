import { useState, useCallback } from 'react';

export interface Workspace<T> {
  id: string;
  name: string;
  state: T;
}

export function useWorkspaces<T>(defaultState: T, defaultNamePrefix = 'Tab') {
  const createNewWorkspace = useCallback((id: string, name: string): Workspace<T> => ({
    id,
    name,
    state: { ...defaultState }
  }), [defaultState]);

  const [workspaces, setWorkspaces] = useState<Workspace<T>[]>([
    createNewWorkspace(crypto.randomUUID(), `${defaultNamePrefix} 1`)
  ]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(workspaces[0].id);

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

  // Helper to update the currently active workspace directly
  const updateActiveWorkspace = useCallback((partialState: Partial<T>) => {
    updateWorkspaceState(activeWorkspaceId, partialState);
  }, [activeWorkspaceId, updateWorkspaceState]);

  return {
    workspaces,
    activeWorkspaceId,
    activeWorkspace,
    setActiveWorkspaceId,
    addWorkspace,
    removeWorkspace,
    updateWorkspaceState,
    updateActiveWorkspace
  };
}
