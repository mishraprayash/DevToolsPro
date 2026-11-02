import * as React from 'react';

/**
 * Shared behaviour for in-page "fullscreen" overlays (CSS fixed overlays, not the
 * browser Fullscreen API): Escape closes the overlay and body scroll is locked
 * while it is open. Does nothing while closed.
 *
 * Escape presses already handled elsewhere (e.g. a Modal calling preventDefault)
 * are ignored so a single Esc only dismisses the topmost layer.
 */
export function useFullscreenOverlay(isOpen: boolean, onClose: () => void) {
  const onCloseRef = React.useRef(onClose);

  React.useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      onCloseRef.current();
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);
}
