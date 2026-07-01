'use client';

import * as React from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';

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
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const toggleFullscreen = React.useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
        return;
      }

      if (e.key.toLowerCase() === 'f') {
        const activeTag = document.activeElement?.tagName.toLowerCase();
        const isInput = activeTag === 'input' || activeTag === 'textarea' || (document.activeElement as HTMLElement)?.isContentEditable;
        if (!isInput) {
          e.preventDefault();
          toggleFullscreen();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, toggleFullscreen]);

  React.useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  const renderContent = (content: RenderPane) =>
    typeof content === 'function' ? content(isFullscreen) : content;

  const innerContent = (
    <div className={cn(
      "flex flex-col w-full",
      isFullscreen ? "h-full p-4 gap-4 [&_textarea]:!text-[15px] [&_textarea]:!leading-relaxed [&_input]:!text-[15px] [&_.font-mono]:!text-[15px] [&_.font-mono]:!leading-relaxed" : "gap-6"
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

      {/* Split Panes */}
      <div className={cn(
        "grid grid-cols-1 gap-6",
        isFullscreen ? "lg:grid-cols-2 flex-1 min-h-0" : "lg:grid-cols-2" // On fullscreen, strictly 50/50 and take full height
      )}>
        <div className={cn("flex flex-col h-full min-h-0", isFullscreen && "overflow-hidden")}>
          {renderContent(leftPane)}
        </div>
        <div className={cn("flex flex-col h-full min-h-0", isFullscreen && "overflow-hidden")}>
          {renderContent(rightPane)}
        </div>
      </div>
    </div>
  );

  const wrappedContent = (
    <SplitPanesContext.Provider value={{ isFullscreen }}>
      {innerContent}
    </SplitPanesContext.Provider>
  );

  if (isFullscreen && mounted) {
    return createPortal(
      <div className="fixed inset-0 z-[100] bg-bg-primary flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {wrappedContent}
      </div>,
      document.body
    );
  }

  return wrappedContent;
}
