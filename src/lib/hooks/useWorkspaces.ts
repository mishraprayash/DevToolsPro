import * as React from 'react';
import { useState, useCallback, useEffect } from 'react';
import { toast } from '@/components/ui/Toast';
import { readToolHandoff, clearToolHandoff, prefillFromSearch, scheduleStripPrefillParam } from '@/lib/utils/toolHandoff';
import { normalizeTabName, nextTabName } from '@/lib/utils/workspaceNames';
import { encodeShareState, decodeShareState } from '@/lib/utils/shareCodec';

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

const SHARE_HASH_PREFIX = '#share=';
/** Longest share URL we'll hand out; modern browsers cope well beyond this. */
const MAX_SHARE_URL_LENGTH = 16_000;
/**
 * Derived/generated fields every tool recomputes from its inputs on load. They are
 * dropped from share links (hydration merges over defaultState, so they come back as defaults).
 */
const DEFAULT_SHARE_OMIT_KEYS: readonly string[] = [
  'output', 'parsedData', 'error', 'validation',
  'splitRows', 'unifiedLines', 'diffLineIndices', 'splitRowIndices',
  'signatureStatus', 'signatureMessage',
];

/** Synchronously grab the raw `#share=` payload (decoding is async and happens later). */
function readSharedHashRaw(): string | null {
  try {
    const hash = window.location.hash;
    return hash.startsWith(SHARE_HASH_PREFIX) ? hash.slice(SHARE_HASH_PREFIX.length) : null;
  } catch {
    return null;
  }
}

async function decodeSharedHash<T>(raw: string): Promise<Partial<T> | null> {
  const res = await decodeShareState(raw);
  if (!res.success) {
    if (process.env.NODE_ENV !== 'production') console.warn('Failed to parse shared state from URL hash', res.error);
    return null;
  }
  const decoded = res.data;
  return decoded && typeof decoded === 'object' && !Array.isArray(decoded) ? (decoded as Partial<T>) : null;
}

function omitTopLevelKeys(state: unknown, keys: readonly string[]): unknown {
  if (!state || typeof state !== 'object' || Array.isArray(state) || keys.length === 0) return state;
  const omit = new Set(keys);
  return Object.fromEntries(Object.entries(state).filter(([k]) => !omit.has(k)));
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
    // Incoming state (a #share= link or a cross-tool handoff) is read synchronously and
    // cleared on the next tick, so a StrictMode double-run of this effect sees it on both passes.
    const incoming: { name: string; state: Partial<T> }[] = [];

    // #share= payloads may be compressed (async decode), so only the raw string is read here.
    const sharedRaw = readSharedHashRaw();
    if (sharedRaw !== null) {
      // Clear hash so it doesn't persist on reload
      setTimeout(() => window.history.replaceState(null, '', window.location.pathname + window.location.search), 0);
    }

    const handoff = storageKey ? readToolHandoff<T>(storageKey) : null;
    if (handoff && storageKey) {
      incoming.push(handoff);
      setTimeout(() => clearToolHandoff(storageKey), 0);
    }

    // `?input=` deep link — only for tools whose state has an `input` string field
    const linked = !handoff && typeof (defaultState as Record<string, unknown> | null)?.input === 'string'
      ? prefillFromSearch(window.location.search)
      : null;
    if (linked) {
      incoming.push({ name: 'From link', state: { input: linked.input } as unknown as Partial<T> });
      scheduleStripPrefillParam();
    }

    (async () => {
      let hydratedWorkspaces = [createNewWorkspace(crypto.randomUUID(), `${defaultNamePrefix} 1`)];
      let hydratedActiveId = hydratedWorkspaces[0].id;

      if (storageKey) {
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

      const shared = sharedRaw !== null ? await decodeSharedHash<T>(sharedRaw) : null;
      if (shared) incoming.unshift({ name: 'Shared Tab', state: shared });

      // Incoming state opens as new active tab(s), keeping the user's existing tabs
      for (const item of incoming) {
        const newId = crypto.randomUUID();
        hydratedWorkspaces = [...hydratedWorkspaces, { id: newId, name: item.name, state: { ...deepClone(defaultState), ...item.state } }];
        hydratedActiveId = newId;
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
      const newName = nextTabName(defaultNamePrefix, prev.map((w) => w.name));
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

  const renameWorkspace = useCallback((id: string, name: string) => {
    setWorkspaces((prev) =>
      prev.map((w) => (w.id === id ? { ...w, name: normalizeTabName(name, w.name) } : w))
    );
  }, []);

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

  const copyShareLink = useCallback(async (omitKeys?: readonly string[]) => {
    // Also used directly as an onClick handler, so ignore a non-array (event) argument.
    const keys = Array.isArray(omitKeys) ? omitKeys : DEFAULT_SHARE_OMIT_KEYS;
    try {
      const encoded = await encodeShareState(omitTopLevelKeys(activeWorkspace.state, keys));
      if (!encoded.success) {
        toast({ type: 'error', message: 'Failed to generate share link.' });
        return;
      }
      const url = new URL(window.location.href);
      url.hash = `share=${encoded.data}`;
      const link = url.toString();

      if (link.length > MAX_SHARE_URL_LENGTH) {
        toast({ type: 'error', message: 'Too large to share as a link — try Download instead.' });
        return;
      }

      await navigator.clipboard.writeText(link);
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
    renameWorkspace,
    updateWorkspaceState,
    updateActiveWorkspace,
    copyShareLink
  };
}
