'use client';

import * as React from 'react';
import { toolWorkerPool, type WorkerTaskPayload, type WorkerTaskResponse } from './toolWorker';

export function useToolWorker() {
  const [isPending, startTransition] = React.useTransition();
  const [isWorking, setIsWorking] = React.useState(false);

  const execute = React.useCallback(
    async <T = unknown>(payload: WorkerTaskPayload): Promise<WorkerTaskResponse<T>> => {
      setIsWorking(true);
      try {
        const response = await toolWorkerPool.run<T>(payload);
        return response;
      } finally {
        startTransition(() => {
          setIsWorking(false);
        });
      }
    },
    [startTransition]
  );

  return {
    execute,
    isWorking: isWorking || isPending,
  };
}
