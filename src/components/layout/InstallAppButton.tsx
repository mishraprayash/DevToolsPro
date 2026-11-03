'use client';

import * as React from 'react';
import { Download, Share, X } from 'lucide-react';
import {
  getInstallUiServerSnapshot,
  getInstallUiSnapshot,
  promptInstall,
  subscribeInstallUi,
} from '@/lib/pwa/installPrompt';

interface InstallAppButtonProps {
  className?: string;
}

/**
 * "Install app" affordance. Chromium browsers get a button that opens the
 * native install dialog; iOS Safari gets a short "Add to Home Screen" hint.
 * Renders nothing when already installed or when installing isn't possible.
 */
function InstallAppButton({ className }: InstallAppButtonProps) {
  const state = React.useSyncExternalStore(subscribeInstallUi, getInstallUiSnapshot, getInstallUiServerSnapshot);
  const [hintOpen, setHintOpen] = React.useState(false);
  const hintId = React.useId();

  if (state.kind === 'hidden') return null;

  const buttonClass =
    'inline-flex items-center gap-1.5 text-[11px] text-text-muted hover:text-text-primary transition-colors cursor-pointer';

  if (state.kind === 'prompt') {
    return (
      <button type="button" onClick={() => void promptInstall()} className={`${buttonClass} ${className ?? ''}`}>
        <Download className="h-3.5 w-3.5" aria-hidden="true" />
        Install app
      </button>
    );
  }

  return (
    <div className={`relative ${className ?? ''}`}>
      <button
        type="button"
        onClick={() => setHintOpen((o) => !o)}
        aria-expanded={hintOpen}
        aria-controls={hintId}
        className={buttonClass}
      >
        <Download className="h-3.5 w-3.5" aria-hidden="true" />
        Install app
      </button>
      {hintOpen && (
        <div
          id={hintId}
          role="note"
          className="absolute bottom-full right-0 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 mb-2 w-60 p-3 rounded-lg border border-border bg-bg-tertiary text-[11px] leading-relaxed text-text-secondary shadow-xl z-20"
        >
          <button
            type="button"
            onClick={() => setHintOpen(false)}
            aria-label="Close"
            className="absolute top-1.5 right-1.5 p-0.5 rounded text-text-muted hover:text-text-primary cursor-pointer"
          >
            <X className="h-3 w-3" />
          </button>
          Tap <Share className="inline h-3.5 w-3.5 -mt-0.5 text-accent" aria-label="Share" /> in Safari, then choose{' '}
          <span className="font-semibold text-text-primary">Add to Home Screen</span> to use DevTools Pro offline.
        </div>
      )}
    </div>
  );
}

export { InstallAppButton, type InstallAppButtonProps };
