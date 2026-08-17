/**
 * Cooperative Task Scheduling Utilities
 * Helps break up long-running tasks on the main thread so the browser
 * can interleave user input, layout, and rendering frames without dropping FPS.
 */

/**
 * Yield execution to the browser's event loop to allow pending user interactions,
 * input events, and paint cycles to execute immediately.
 */
export async function yieldToMainThread(): Promise<void> {
  // Use modern scheduler.yield() if available (Chrome 129+)
  if (typeof window !== 'undefined' && 'scheduler' in window && typeof (window as unknown as { scheduler: { yield: () => Promise<void> } }).scheduler?.yield === 'function') {
    return (window as unknown as { scheduler: { yield: () => Promise<void> } }).scheduler.yield();
  }

  // High-priority MessageChannel micro-task yielding fallback
  if (typeof MessageChannel !== 'undefined') {
    return new Promise((resolve) => {
      const channel = new MessageChannel();
      channel.port1.onmessage = () => resolve();
      channel.port2.postMessage(null);
    });
  }

  // Standard fallback
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Process a large array in chunks, yielding to the main thread between chunks.
 * @param items Array of items to process
 * @param chunkSize Number of items to process per slice
 * @param processor Function to execute on each item
 */
export async function chunkedProcess<T, R>(
  items: T[],
  processor: (item: T, index: number) => R,
  chunkSize: number = 200
): Promise<R[]> {
  const results: R[] = [];
  const total = items.length;

  for (let i = 0; i < total; i += chunkSize) {
    const end = Math.min(i + chunkSize, total);
    for (let j = i; j < end; j++) {
      results.push(processor(items[j], j));
    }

    // Yield control back to browser between chunks
    if (end < total) {
      await yieldToMainThread();
    }
  }

  return results;
}
