'use client';

import * as React from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error('App Error:', error);
  }, [error]);

  return (
    <main className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full p-6 rounded-2xl bg-bg-secondary border border-border text-center shadow-xl space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold font-outfit text-text-primary">Something went wrong</h2>
          <p className="text-xs text-text-secondary mt-1">
            An unexpected error occurred while rendering this tool.
          </p>
        </div>

        {error.message && (
          <div className="p-3 rounded-lg bg-bg-tertiary border border-border text-left font-mono text-xs text-red-400 max-h-32 overflow-y-auto break-words">
            {error.message}
          </div>
        )}

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-bg-primary text-xs font-bold hover:bg-accent-hover transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Retry
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-tertiary border border-border text-xs font-semibold text-text-primary hover:bg-bg-hover transition-colors"
          >
            <Home className="w-3.5 h-3.5" /> Back Home
          </Link>
        </div>
      </div>
    </main>
  );
}
