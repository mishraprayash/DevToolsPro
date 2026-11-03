'use client';

import * as React from 'react';
import { createWorkerRunner, type WorkerRunOutcome, type WorkerRunner } from '@/lib/workers/runInWorker';
import {
  runHeavyTask,
  type HeavyTaskName,
  type HeavyTaskPayload,
  type HeavyTaskRequest,
  type HeavyTaskResult,
} from '@/lib/workers/heavyTasks';

/** Spawns a dedicated module worker for heavy tasks, or null on the server / without Worker support. */
export function createHeavyTaskWorker(): Worker | null {
  if (typeof window === 'undefined' || typeof Worker === 'undefined') return null;
  try {
    return new Worker(new URL('./heavyTasks.worker.ts', import.meta.url), { type: 'module', name: 'devtools-heavy-task' });
  } catch {
    return null;
  }
}

function clearTimerRef(ref: React.RefObject<ReturnType<typeof setTimeout> | null>) {
  if (ref.current !== null) {
    clearTimeout(ref.current);
    ref.current = null;
  }
}

export interface UseHeavyTaskOptions {
  timeoutMs?: number;
  timeoutMessage?: string;
  /** Only report `pending` once a run has lasted this long, to avoid flicker on fast runs. Default 120ms. */
  pendingDelayMs?: number;
}

/**
 * Runs `task` in a dedicated background worker owned by the calling component.
 * Latest-wins: each `run` supersedes (and resolves as `cancelled`) any earlier pending run.
 * On timeout the worker is terminated and a fresh one is spawned on the next run.
 * Falls back to the main thread when Workers are unavailable.
 */
export function useHeavyTask<K extends HeavyTaskName>(task: K, options: UseHeavyTaskOptions = {}) {
  const { timeoutMs, timeoutMessage, pendingDelayMs = 120 } = options;
  const runnerRef = React.useRef<WorkerRunner<HeavyTaskPayload<K>, HeavyTaskResult<K>> | null>(null);
  const latestRef = React.useRef(0);
  const pendingTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pending, setPending] = React.useState(false);

  const getRunner = React.useCallback(() => {
    if (!runnerRef.current) {
      runnerRef.current = createWorkerRunner<HeavyTaskPayload<K>, HeavyTaskResult<K>>({
        createWorker: createHeavyTaskWorker,
        timeoutMs,
        timeoutMessage,
        fallback: (payload) => runHeavyTask(payload.task, payload.req),
      });
    }
    return runnerRef.current;
  }, [timeoutMs, timeoutMessage]);

  React.useEffect(() => {
    return () => {
      clearTimerRef(pendingTimerRef);
      runnerRef.current?.dispose();
      runnerRef.current = null;
    };
  }, [getRunner]);

  const run = React.useCallback(
    async (req: HeavyTaskRequest<K>): Promise<WorkerRunOutcome<HeavyTaskResult<K>>> => {
      const ticket = ++latestRef.current;
      clearTimerRef(pendingTimerRef);
      pendingTimerRef.current = setTimeout(() => {
        if (ticket === latestRef.current) setPending(true);
      }, pendingDelayMs);
      const outcome = await getRunner().run({ task, req });
      if (ticket === latestRef.current) {
        clearTimerRef(pendingTimerRef);
        setPending(false);
      }
      return outcome;
    },
    [getRunner, task, pendingDelayMs]
  );

  const cancel = React.useCallback(() => {
    latestRef.current++;
    clearTimerRef(pendingTimerRef);
    runnerRef.current?.cancel();
    setPending(false);
  }, []);

  return { run, cancel, pending };
}
