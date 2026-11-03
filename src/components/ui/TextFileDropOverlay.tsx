import * as React from 'react';
import { UploadCloud } from 'lucide-react';

interface TextFileDropOverlayProps {
  show: boolean;
}

/** Same overlay as the shared <Input />'s drop zone, for wrappers using useTextFileDrop. Parent must be `relative`. */
function TextFileDropOverlay({ show }: TextFileDropOverlayProps) {
  if (!show) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center rounded-lg bg-bg-tertiary/90 backdrop-blur-sm border-2 border-dashed border-accent text-accent animate-in fade-in duration-200">
      <UploadCloud className="h-10 w-10 mb-2" />
      <p className="font-semibold text-sm">Drop file here to load contents</p>
    </div>
  );
}

export { TextFileDropOverlay, type TextFileDropOverlayProps };
