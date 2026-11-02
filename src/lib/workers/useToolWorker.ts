'use client';

import * as React from 'react';
import { toolWorkerPool, type WorkerTaskPayload, type WorkerTaskResponse } from './toolWorker';

export function useToolWorker() {
  const [isWorking, setIsWorking] = React.useState(false);

  const execute = React.useCallback(
    async <T = unknown>(payload: WorkerTaskPayload): Promise<WorkerTaskResponse<T>> => {
      setIsWorking(true);
      try {
        const response = await toolWorkerPool.run<T>(payload);
        return response;
      } finally {
        setIsWorking(false);
      }
    },
    []
  );

  React.useEffect(() => {
    return () => {
      // Do not terminate the shared pool on unmount — other consumers may still be active.
      // Pool is terminated globally on beforeunload/HMR (see toolWorker.ts).
    };
  }, []);

  return {
    execute,
    isWorking,
  };
}
