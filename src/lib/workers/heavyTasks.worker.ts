/**
 * Module Web Worker that runs real tool utils off the main thread.
 * Bundled by Next.js (Turbopack/webpack) via
 * `new Worker(new URL('./heavyTasks.worker.ts', import.meta.url), { type: 'module' })`.
 */
import { isHeavyTaskName, runHeavyTask, type HeavyTaskPayload } from '@/lib/workers/heavyTasks';
import type { WorkerRequestEnvelope, WorkerResponseEnvelope } from '@/lib/workers/runInWorker';

interface WorkerScope {
  onmessage: ((event: MessageEvent<WorkerRequestEnvelope<HeavyTaskPayload>>) => void) | null;
  postMessage: (message: WorkerResponseEnvelope<unknown>) => void;
}

const scope = self as unknown as WorkerScope;

scope.onmessage = (event) => {
  const { id, payload } = event.data;
  try {
    if (!payload || !isHeavyTaskName(payload.task)) {
      scope.postMessage({ id, error: 'Unknown background task' });
      return;
    }
    scope.postMessage({ id, data: runHeavyTask(payload.task, payload.req) });
  } catch (e) {
    scope.postMessage({ id, error: e instanceof Error ? e.message : 'Background task failed' });
  }
};
