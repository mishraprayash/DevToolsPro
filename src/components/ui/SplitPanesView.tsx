'use client';

import * as React from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useFullscreenOverlay } from '@/lib/hooks/useFullscreenOverlay';

export const SplitPanesContext = React.createContext({ isFullscreen: false });
export const useSplitPanes = () => React.useContext(SplitPanesContext);

type RenderPane = React.ReactNode | ((isFullscreen: boolean) => React.ReactNode);

export interface SplitPanesViewProps {
  leftPane: RenderPane;
  rightPane: RenderPane;
  toolbarContent?: RenderPane;
}

export function SplitPanesView({ leftPane, rightPane, toolbarContent }: SplitPanesViewProps) {
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const overlayRef = React.useRef<HTMLDivElement>(null);

  const toggleFullscreen = React.useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  const exitFullscreen = React.useCallback(() => setIsFullscreen(false), []);

  useFullscreenOverlay(isFullscreen, exitFullscreen);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'f' && e.key !== 'F') return;
      // Leave modified/repeated/IME keys alone so ⌘F / Ctrl+F (browser find) still work
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey || e.repeat || e.isComposing || e.defaultPrevented) return;

      const active = document.activeElement;
      if (active instanceof HTMLElement) {
        const isTyping =
          active.isContentEditable ||
          active.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])') !== null;
        if (isTyping) return;
      }

      // Don't toggle underneath another open dialog (our own fullscreen overlay is fine)
      const hasForeignModal = Array.from(document.querySelectorAll('[aria-modal="true"]')).some(
        (el) => el !== overlayRef.current
      );
      if (hasForeignModal) return;

      e.preventDefault();
      toggleFullscreen();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleFullscreen]);

  const renderContent = (content: RenderPane) =>
    typeof content === 'function' ? content(isFullscreen) : content;

  // Same element tree in both modes so toggling never remounts the panes (keeps search, scroll, undo state).
  // Fullscreen sits at z-45: above the header (z-40), below modals and toasts (z-50).
  return (
    <SplitPanesContext.Provider value={{ isFullscreen }}>
      <div
        ref={overlayRef}
        className={cn(
          isFullscreen && 'fixed inset-0 z-[45] bg-bg-primary flex flex-col overflow-y-auto lg:overflow-hidden animate-fade-in'
        )}
        role={isFullscreen ? 'dialog' : undefined}
        aria-modal={isFullscreen ? true : undefined}
        aria-label={isFullscreen ? 'Fullscreen editor' : undefined}
        data-fullscreen-overlay={isFullscreen ? '' : undefined}
      >
        <div className={cn(
          "flex flex-col w-full",
          isFullscreen ? "min-h-full shrink-0 lg:h-full p-4 gap-4 [&_textarea]:!text-[15px] [&_textarea]:!leading-relaxed [&_input]:!text-[15px] [&_.font-mono]:!text-[15px] [&_.font-mono]:!leading-relaxed" : "gap-6"
        )}>
          {/* Top Bar for Toolbar & Fullscreen Toggle */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 flex flex-wrap sm:flex-nowrap items-center gap-4 overflow-x-auto scrollbar-hide">
              {renderContent(toolbarContent)}
            </div>
            <div className="flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                icon={isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                title={isFullscreen ? "Exit Fullscreen (Esc)" : "Fullscreen (F)"}
              >
                {isFullscreen ? "Exit" : "Fullscreen"}
              </Button>
            </div>
          </div>

          {/* Split Panes — on lg fullscreen, strictly 50/50 filling the viewport; below lg the overlay scrolls */}
          <div className={cn(
            "grid grid-cols-1 gap-6 lg:grid-cols-2",
            isFullscreen && "lg:grid-rows-1 lg:flex-1 lg:min-h-0"
          )}>
            <div className={cn("flex flex-col h-full min-h-0", isFullscreen && "lg:overflow-auto")}>
              {renderContent(leftPane)}
            </div>
            <div className={cn("flex flex-col h-full min-h-0", isFullscreen && "lg:overflow-auto")}>
              {renderContent(rightPane)}
            </div>
          </div>
        </div>
      </div>
    </SplitPanesContext.Provider>
  );
}
