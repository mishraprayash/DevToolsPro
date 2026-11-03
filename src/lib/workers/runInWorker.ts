/**
 * Latest-wins, timeout-guarded runner for a single dedicated Web Worker.
 *
 * Semantics:
 * - One task in flight at a time. Starting a new run while another is pending
 *   resolves the old one as `cancelled` and terminates the busy worker, so the
 *   new task never queues behind stale (possibly runaway) work.
 * - If the worker does not answer within `timeoutMs`, it is terminated (the only
 *   way to stop synchronous JS such as a catastrophically backtracking regex)
 *   and the run resolves as `timeout`. The next run lazily spawns a fresh worker.
 * - When Workers are unavailable (SSR, old browsers, or the worker script fails to
 *   load), `fallback` runs the same logic synchronously on the main thread.
 * - Never rejects: every run resolves to a `WorkerRunOutcome`.
 *
 * Pure TypeScript (no React) so it can be unit tested with a fake Worker.
 */

export type WorkerRunOutcome<T> =
  | { status: 'ok'; data: T; via: 'worker' | 'main' }
  | { status: 'timeout'; error: string }
  | { status: 'error'; error: string }
  | { status: 'cancelled' };

/** Message envelope posted to the worker. */
export interface WorkerRequestEnvelope<Req> {
  id: number;
  payload: Req;
}

/** Message envelope the worker posts back. */
export interface WorkerResponseEnvelope<Res> {
  id: number;
  data?: Res;
  error?: string;
}

export interface WorkerRunnerOptions<Req, Res> {
  /** Returns a new Worker, or null when Workers are not available. */
  createWorker: () => Worker | null;
  /** Hard timeout per run in ms. Defaults to 10s. */
  timeoutMs?: number;
  /** Error message used when a run times out. */
  timeoutMessage?: string;
  /** Main-thread implementation used when no worker can be created. */
  fallback?: (req: Req) => Res;
}

export interface WorkerRunner<Req, Res> {
  run: (req: Req) => Promise<WorkerRunOutcome<Res>>;
  /** Cancel the pending run (if any) and stop its worker. */
  cancel: () => void;
  /** Cancel and release the worker for good (runner may still be reused; it respawns lazily). */
  dispose: () => void;
  isBusy: () => boolean;
}

export const DEFAULT_WORKER_TIMEOUT_MS = 10_000;

function errorMessage(e: unknown, fallback: string): string {
  if (e instanceof Error && e.message) return e.message;
  if (e && typeof e === 'object' && 'message' in e && typeof (e as { message: unknown }).message === 'string') {
    return (e as { message: string }).message || fallback;
  }
  return fallback;
}

export function createWorkerRunner<Req, Res>(options: WorkerRunnerOptions<Req, Res>): WorkerRunner<Req, Res> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_WORKER_TIMEOUT_MS;
  const timeoutMessage = options.timeoutMessage ?? `Task took longer than ${timeoutMs}ms and was stopped`;

  let worker: Worker | null = null;
  let workerUnavailable = false;
  let workerHasResponded = false;
  let seq = 0;
  let pending: {
    id: number;
    req: Req;
    resolve: (o: WorkerRunOutcome<Res>) => void;
    timer: ReturnType<typeof setTimeout>;
  } | null = null;

  const settle = (outcome: WorkerRunOutcome<Res>) => {
    if (!pending) return;
    const p = pending;
    pending = null;
    clearTimeout(p.timer);
    p.resolve(outcome);
  };

  const killWorker = () => {
    if (!worker) return;
    const w = worker;
    worker = null;
    w.onmessage = null;
    w.onerror = null;
    try {
      w.terminate();
    } catch {
      // ignore
    }
  };

  const runFallback = (req: Req): WorkerRunOutcome<Res> => {
    if (!options.fallback) return { status: 'error', error: 'Background workers are not available in this environment' };
    try {
      return { status: 'ok', data: options.fallback(req), via: 'main' };
    } catch (e) {
      return { status: 'error', error: errorMessage(e, 'Processing failed') };
    }
  };

  const ensureWorker = (): Worker | null => {
    if (worker) return worker;
    if (workerUnavailable) return null;
    let w: Worker | null = null;
    try {
      w = options.createWorker();
    } catch {
      w = null;
    }
    if (!w) {
      workerUnavailable = true;
      return null;
    }

    w.onmessage = (event: MessageEvent) => {
      workerHasResponded = true;
      const msg = event.data as WorkerResponseEnvelope<Res> | null;
      if (!msg || !pending || msg.id !== pending.id) return; // stale
      if (typeof msg.error === 'string') settle({ status: 'error', error: msg.error });
      else settle({ status: 'ok', data: msg.data as Res, via: 'worker' });
    };

    w.onerror = (event: ErrorEvent | Event) => {
      if (typeof (event as Event).preventDefault === 'function') (event as Event).preventDefault();
      killWorker();
      const p = pending;
      // A worker that errors before ever replying most likely failed to load:
      // stop trying workers and serve this (and future) runs from the main thread.
      if (!workerHasResponded && options.fallback) {
        workerUnavailable = true;
        if (p) settle(runFallback(p.req));
        return;
      }
      settle({ status: 'error', error: errorMessage(event, 'Background worker crashed') });
    };

    worker = w;
    return w;
  };

  const cancel = () => {
    if (!pending) return;
    // The worker may be mid-computation on the cancelled task; kill it so the
    // next task does not queue behind it.
    killWorker();
    settle({ status: 'cancelled' });
  };

  const run = (req: Req): Promise<WorkerRunOutcome<Res>> => {
    cancel();
    const id = ++seq;
    const w = ensureWorker();
    if (!w) return Promise.resolve(runFallback(req));

    return new Promise<WorkerRunOutcome<Res>>((resolve) => {
      const timer = setTimeout(() => {
        if (!pending || pending.id !== id) return;
        killWorker();
        settle({ status: 'timeout', error: timeoutMessage });
      }, timeoutMs);

      pending = { id, req, resolve, timer };

      try {
        const envelope: WorkerRequestEnvelope<Req> = { id, payload: req };
        w.postMessage(envelope);
      } catch (e) {
        killWorker();
        settle({ status: 'error', error: errorMessage(e, 'Failed to send task to background worker') });
      }
    });
  };

  return {
    run,
    cancel,
    dispose: () => {
      cancel();
      killWorker();
    },
    isBusy: () => pending !== null,
  };
}
