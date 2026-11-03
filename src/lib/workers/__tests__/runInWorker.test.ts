import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createWorkerRunner } from '@/lib/workers/runInWorker';

type Handler = (req: number) => number;

/** Minimal fake Worker: answers each message after `delayMs` (or never when `hang`). */
class FakeWorker {
  onmessage: ((e: { data: unknown }) => void) | null = null;
  onerror: ((e: unknown) => void) | null = null;
  terminated = false;
  received: unknown[] = [];
  constructor(private handler: Handler, private delayMs: number, private hang = false) {}
  postMessage(msg: { id: number; payload: number }) {
    this.received.push(msg);
    if (this.hang) return;
    setTimeout(() => {
      if (this.terminated) return;
      this.onmessage?.({ data: { id: msg.id, data: this.handler(msg.payload) } });
    }, this.delayMs);
  }
  terminate() {
    this.terminated = true;
  }
}

describe('createWorkerRunner', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('resolves with worker result', async () => {
    const workers: FakeWorker[] = [];
    const runner = createWorkerRunner<number, number>({
      createWorker: () => {
        const w = new FakeWorker((n) => n * 2, 10);
        workers.push(w);
        return w as unknown as Worker;
      },
    });
    const p = runner.run(21);
    expect(runner.isBusy()).toBe(true);
    await vi.advanceTimersByTimeAsync(10);
    await expect(p).resolves.toEqual({ status: 'ok', data: 42, via: 'worker' });
    expect(runner.isBusy()).toBe(false);
    expect(workers).toHaveLength(1);
  });

  it('latest wins: superseded run is cancelled and its busy worker terminated', async () => {
    const workers: FakeWorker[] = [];
    const runner = createWorkerRunner<number, number>({
      createWorker: () => {
        const w = new FakeWorker((n) => n + 1, 50);
        workers.push(w);
        return w as unknown as Worker;
      },
    });
    const first = runner.run(1);
    const second = runner.run(2);
    await expect(first).resolves.toEqual({ status: 'cancelled' });
    expect(workers[0].terminated).toBe(true);
    await vi.advanceTimersByTimeAsync(50);
    await expect(second).resolves.toEqual({ status: 'ok', data: 3, via: 'worker' });
    expect(workers).toHaveLength(2);
  });

  it('reuses an idle worker for sequential runs', async () => {
    let created = 0;
    const runner = createWorkerRunner<number, number>({
      createWorker: () => {
        created++;
        return new FakeWorker((n) => n, 5) as unknown as Worker;
      },
    });
    const a = runner.run(1);
    await vi.advanceTimersByTimeAsync(5);
    await a;
    const b = runner.run(2);
    await vi.advanceTimersByTimeAsync(5);
    await expect(b).resolves.toMatchObject({ status: 'ok', data: 2 });
    expect(created).toBe(1);
  });

  it('times out, terminates the hung worker and respawns on next run', async () => {
    const workers: FakeWorker[] = [];
    let hang = true;
    const runner = createWorkerRunner<number, number>({
      timeoutMs: 1500,
      timeoutMessage: 'too slow',
      createWorker: () => {
        const w = new FakeWorker((n) => n, 1, hang);
        workers.push(w);
        return w as unknown as Worker;
      },
    });
    const p = runner.run(1);
    await vi.advanceTimersByTimeAsync(1499);
    expect(runner.isBusy()).toBe(true);
    await vi.advanceTimersByTimeAsync(1);
    await expect(p).resolves.toEqual({ status: 'timeout', error: 'too slow' });
    expect(workers[0].terminated).toBe(true);

    hang = false;
    const next = runner.run(7);
    await vi.advanceTimersByTimeAsync(1);
    await expect(next).resolves.toEqual({ status: 'ok', data: 7, via: 'worker' });
    expect(workers).toHaveLength(2);
  });

  it('ignores responses carrying a stale id', async () => {
    const fake = new FakeWorker((n) => n, 0, true);
    const runner = createWorkerRunner<number, number>({ createWorker: () => fake as unknown as Worker });
    const p = runner.run(5);
    fake.onmessage?.({ data: { id: 999, data: 0 } });
    expect(runner.isBusy()).toBe(true);
    fake.onmessage?.({ data: { id: 1, data: 5 } });
    await expect(p).resolves.toEqual({ status: 'ok', data: 5, via: 'worker' });
  });

  it('maps worker-reported errors to error outcomes', async () => {
    const fake = new FakeWorker((n) => n, 0, true);
    const runner = createWorkerRunner<number, number>({ createWorker: () => fake as unknown as Worker });
    const p = runner.run(1);
    fake.onmessage?.({ data: { id: 1, error: 'boom' } });
    await expect(p).resolves.toEqual({ status: 'error', error: 'boom' });
  });

  it('falls back to the main thread when no worker can be created', async () => {
    const runner = createWorkerRunner<number, number>({ createWorker: () => null, fallback: (n) => n * 3 });
    await expect(runner.run(3)).resolves.toEqual({ status: 'ok', data: 9, via: 'main' });
  });

  it('returns an error (never throws) when no worker and no fallback', async () => {
    const runner = createWorkerRunner<number, number>({ createWorker: () => { throw new Error('nope'); } });
    await expect(runner.run(1)).resolves.toMatchObject({ status: 'error' });
  });

  it('falls back when the worker fails to load before ever responding', async () => {
    const fake = new FakeWorker((n) => n, 0, true);
    const runner = createWorkerRunner<number, number>({ createWorker: () => fake as unknown as Worker, fallback: (n) => n + 100 });
    const p = runner.run(1);
    fake.onerror?.({ message: 'failed to load module' });
    await expect(p).resolves.toEqual({ status: 'ok', data: 101, via: 'main' });
    expect(fake.terminated).toBe(true);
  });

  it('cancel() resolves the pending run as cancelled', async () => {
    const fake = new FakeWorker((n) => n, 0, true);
    const runner = createWorkerRunner<number, number>({ createWorker: () => fake as unknown as Worker });
    const p = runner.run(1);
    runner.cancel();
    await expect(p).resolves.toEqual({ status: 'cancelled' });
    expect(runner.isBusy()).toBe(false);
  });
});
