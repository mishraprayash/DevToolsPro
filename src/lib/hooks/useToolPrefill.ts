'use client';

import * as React from 'react';
import {
  readToolHandoff,
  clearToolHandoff,
  prefillFromState,
  prefillFromSearch,
  scheduleStripPrefillParam,
  type ToolPrefill,
} from '@/lib/utils/toolHandoff';

/**
 * Reads (without consuming) the pending prefill for a tool: a cross-tool handoff
 * first, then the `?input=` deep-link param. Client-only; returns null on the server.
 */
function readToolPrefill(toolId: string): ToolPrefill | null {
  try {
    if (typeof window === 'undefined') return null;
    return prefillFromState(readToolHandoff(toolId)?.state) ?? prefillFromSearch(window.location.search);
  } catch {
    return null;
  }
}

/**
 * Opens a tool pre-filled: on mount, applies a handoff payload (sendToTool) or a
 * `?input=` deep link, then consumes both on the next tick. Reading synchronously and
 * clearing on the next tick means a StrictMode double-run of the effect sees the data
 * on both passes (apply may run twice with the same data), so it is never lost.
 * `apply` is kept in a ref, so callers can pass an inline function.
 */
function useToolPrefill(toolId: string, apply: (data: ToolPrefill) => void): void {
  const applyRef = React.useRef(apply);
  React.useLayoutEffect(() => {
    applyRef.current = apply;
  });

  React.useEffect(() => {
    let data: ToolPrefill | null = null;
    try {
      const handoff = readToolHandoff(toolId);
      if (handoff) setTimeout(() => clearToolHandoff(toolId), 0);
      data = prefillFromState(handoff?.state) ?? prefillFromSearch(window.location.search);
      scheduleStripPrefillParam();
    } catch {
      data = null;
    }
    if (!data) return;
    try {
      applyRef.current(data);
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') console.warn(`Failed to apply prefill for ${toolId}`, e);
    }
  }, [toolId]);
}

export { useToolPrefill, readToolPrefill };
