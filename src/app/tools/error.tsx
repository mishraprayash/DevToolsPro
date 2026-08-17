'use client';

import * as React from 'react';
import Link from 'next/link';
import { AlertCircle, RotateCcw, ArrowLeft } from 'lucide-react';

export default function ToolErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error('Tool Error:', error);
  }, [error]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-20">
      <div className="p-8 rounded-2xl bg-bg-secondary border border-border text-center shadow-lg space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold font-outfit text-text-primary">Tool Execution Error</h2>
          <p className="text-sm text-text-secondary mt-1">
            This tool encountered an unhandled state while processing. Your browser storage remains intact.
          </p>
        </div>

        {error?.message && (
          <div className="p-3 rounded-lg bg-bg-tertiary border border-border text-left font-mono text-xs text-text-muted max-h-32 overflow-y-auto break-all">
            {error.message}
          </div>
        )}

        <div className="flex items-center justify-center gap-3 pt-3">
          <button
            onClick={() => reset()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-bg-primary text-xs font-bold hover:bg-accent-hover transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset State
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-tertiary border border-border text-xs font-semibold text-text-primary hover:bg-bg-hover transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> All Tools
          </Link>
        </div>
      </div>
    </div>
  );
}
