'use client';

import * as React from 'react';

export function ServiceWorkerRegister() {
  React.useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => {
          // Service worker registered
        })
        .catch((error) => {
          console.debug('SW registration skipped:', error);
        });
    }
  }, []);

  return null;
}
