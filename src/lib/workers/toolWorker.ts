/**
 * Tool Web Worker Manager
 * Spawns an off-main-thread Web Worker dynamically using Blob URLs so no extra bundler
 * configuration is required while maintaining full background concurrency.
 */

export type WorkerTaskType = 'json_process' | 'csv_process' | 'diff_compute' | 'generic';

export interface WorkerTaskPayload {
  type: WorkerTaskType;
  input: string;
  options?: Record<string, unknown>;
}

export interface WorkerTaskResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Inline worker script code
const WORKER_SCRIPT = `
self.onmessage = function(e) {
  var id = e.data.id;
  var type = e.data.type;
  var input = e.data.input;
  var options = e.data.options || {};

  try {
    if (type === 'json_process') {
      var action = options.action || 'beautify';
      var indent = options.indent || 2;
      var parsed = JSON.parse(input);

      if (action === 'minify') {
        self.postMessage({ id: id, success: true, data: JSON.stringify(parsed) });
      } else if (action === 'sort') {
        function sortObject(obj) {
          if (Array.isArray(obj)) return obj.map(sortObject);
          if (obj !== null && typeof obj === 'object') {
            var sorted = {};
            var keys = Object.keys(obj).sort();
            for (var i = 0; i < keys.length; i++) {
              sorted[keys[i]] = sortObject(obj[keys[i]]);
            }
            return sorted;
          }
          return obj;
        }
        self.postMessage({ id: id, success: true, data: JSON.stringify(sortObject(parsed), null, indent) });
      } else {
        self.postMessage({ id: id, success: true, data: JSON.stringify(parsed, null, indent) });
      }
    } else {
      self.postMessage({ id: id, success: true, data: input });
    }
  } catch (err) {
    self.postMessage({ id: id, success: false, error: err.message || 'Worker processing failed' });
  }
};
`;

class ToolWorkerPool {
  private worker: Worker | null = null;
  private callbacks = new Map<string, (res: WorkerTaskResponse) => void>();
  private taskId = 0;

  private initWorker() {
    if (typeof window === 'undefined') return;
    if (!this.worker) {
      try {
        const blob = new Blob([WORKER_SCRIPT], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        this.worker = new Worker(url);

        this.worker.onmessage = (event: MessageEvent<{ id: string; success: boolean; data?: unknown; error?: string }>) => {
          const { id, success, data, error } = event.data;
          const cb = this.callbacks.get(id);
          if (cb) {
            cb({ success, data, error });
            this.callbacks.delete(id);
          }
        };

        this.worker.onerror = (err) => {
          console.error('ToolWorker error:', err);
        };
      } catch (e) {
        console.warn('Worker creation fallback:', e);
      }
    }
  }

  public run<T = unknown>(payload: WorkerTaskPayload): Promise<WorkerTaskResponse<T>> {
    this.initWorker();

    return new Promise((resolve) => {
      const id = `task_${++this.taskId}_${Date.now()}`;

      if (!this.worker) {
        // Fallback to synchronous execution if workers aren't supported
        try {
          if (payload.type === 'json_process') {
            const parsed = JSON.parse(payload.input);
            const indent = (payload.options?.indent as number) || 2;
            const res = payload.options?.action === 'minify'
              ? JSON.stringify(parsed)
              : JSON.stringify(parsed, null, indent);
            resolve({ success: true, data: res as T });
            return;
          }
        } catch (err: unknown) {
          resolve({ success: false, error: (err as Error).message });
          return;
        }
        resolve({ success: true, data: payload.input as T });
        return;
      }

      this.callbacks.set(id, (res) => resolve(res as WorkerTaskResponse<T>));
      this.worker.postMessage({ id, ...payload });
    });
  }

  public terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.callbacks.clear();
    }
  }
}

export const toolWorkerPool = new ToolWorkerPool();
