'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RefreshCw, X } from 'lucide-react';

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

/**
 * Registers /sw.js in production builds only (a caching worker in `next dev`
 * would serve stale code). When a new worker has installed and is waiting, an
 * "Update available" prompt appears; Reload tells the worker to take over via
 * postMessage and the page reloads once it controls the page.
 *
 * Test locally with `npm run build && npm run start`.
 */
function ServiceWorkerRegister() {
  const [waiting, setWaiting] = React.useState<ServiceWorker | null>(null);
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;

    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | undefined;
    let registration: ServiceWorkerRegistration | undefined;
    const sw = navigator.serviceWorker;

    const offerUpdate = (worker: ServiceWorker | null) => {
      // Only an *update* needs a prompt; the first install has no controller.
      if (!cancelled && worker && sw.controller) {
        setWaiting(worker);
        setDismissed(false);
      }
    };

    const onUpdateFound = () => {
      const installing = registration?.installing;
      if (!installing) return;
      installing.addEventListener('statechange', () => {
        if (installing.state === 'installed') offerUpdate(registration?.waiting ?? installing);
      });
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') registration?.update().catch(() => {});
    };

    sw.register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .then((reg) => {
        if (cancelled) return;
        registration = reg;
        offerUpdate(reg.waiting);
        reg.addEventListener('updatefound', onUpdateFound);
        document.addEventListener('visibilitychange', onVisible);
        interval = setInterval(() => reg.update().catch(() => {}), UPDATE_CHECK_INTERVAL_MS);
      })
      .catch((error: unknown) => {
        console.debug('SW registration skipped:', error);
      });

    // When the waiting worker takes over (after the user clicked Reload in this
    // or another tab), reload once so the page runs the new build.
    let reloading = false;
    const hadController = !!sw.controller;
    const onControllerChange = () => {
      if (!hadController || reloading) return; // first install: clients.claim() needs no reload
      reloading = true;
      window.location.reload();
    };
    sw.addEventListener('controllerchange', onControllerChange);

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      registration?.removeEventListener('updatefound', onUpdateFound);
      document.removeEventListener('visibilitychange', onVisible);
      sw.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);

  const applyUpdate = React.useCallback(() => {
    if (!waiting) return;
    waiting.postMessage({ type: 'SKIP_WAITING' });
    setDismissed(true);
  }, [waiting]);

  const visible = !!waiting && !dismissed;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          className="fixed bottom-4 left-4 right-4 sm:right-auto sm:max-w-sm z-50 flex items-center gap-3 px-4 py-3 rounded-lg border border-accent/30 bg-bg-secondary/95 backdrop-blur-xl shadow-xl"
        >
          <RefreshCw className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
          <p className="flex-1 text-sm text-text-primary">Update available</p>
          <button
            type="button"
            onClick={applyUpdate}
            className="px-3 py-1.5 rounded-md bg-accent text-bg-primary text-xs font-semibold hover:bg-accent-hover transition-colors cursor-pointer"
          >
            Reload
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss update notice"
            className="p-1 rounded text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { ServiceWorkerRegister };
