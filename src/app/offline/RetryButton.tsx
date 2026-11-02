'use client';

import * as React from 'react';
import { RotateCcw } from 'lucide-react';

function RetryButton() {
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-bg-primary text-xs font-bold hover:bg-accent-hover transition-colors cursor-pointer"
    >
      <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> Try again
    </button>
  );
}

export { RetryButton };
