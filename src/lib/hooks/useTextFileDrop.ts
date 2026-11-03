'use client';

import * as React from 'react';

/**
 * Drop-a-text-file support for inputs that can't switch to the shared <Input /> without
 * changing layout (plain textareas, Monaco editors, single-line fields). Spread
 * `dropProps` on a wrapper element; `isDragging` drives an optional overlay
 * (see <TextFileDropOverlay />).
 *
 * Only file drags are handled (capture phase, so editors like Monaco don't swallow
 * them); dragging selected text within or between fields keeps its native behaviour.
 */
export function useTextFileDrop(onText: (text: string) => void) {
  const [isDragging, setIsDragging] = React.useState(false);
  const onTextRef = React.useRef(onText);
  const depth = React.useRef(0);

  React.useEffect(() => {
    onTextRef.current = onText;
  });

  const hasFiles = (e: React.DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes('Files');

  const dropProps = React.useMemo(
    () => ({
      onDragEnterCapture: (e: React.DragEvent) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        depth.current += 1;
        setIsDragging(true);
      },
      onDragOverCapture: (e: React.DragEvent) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      },
      onDragLeaveCapture: (e: React.DragEvent) => {
        if (!hasFiles(e)) return;
        depth.current = Math.max(0, depth.current - 1);
        if (depth.current === 0) setIsDragging(false);
      },
      onDropCapture: (e: React.DragEvent) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        e.stopPropagation();
        depth.current = 0;
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (!file) return;
        file
          .text()
          .then((text) => onTextRef.current(text))
          .catch(() => {});
      },
    }),
    []
  );

  return { isDragging, dropProps };
}
