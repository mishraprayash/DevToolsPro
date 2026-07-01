import * as React from 'react';
import { cn } from '@/lib/utils';
import { UploadCloud } from 'lucide-react';

interface InputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  monospace?: boolean;
  onDropText?: (text: string) => void;
  onDropFile?: (file: File) => void;
  wrapperClassName?: string;
}

const Input = React.forwardRef<HTMLTextAreaElement, InputProps>(
  ({ className, wrapperClassName, label, error, monospace = false, onDropText, onDropFile, ...props }, ref) => {
    const [isDragging, setIsDragging] = React.useState(false);

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isDragging) setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        const file = files[0];
        
        if (onDropFile) {
          onDropFile(file);
        } else if (onDropText) {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              onDropText(event.target.result as string);
            }
          };
          reader.readAsText(file);
        }
      }
    };

    const isDropEnabled = !!onDropText || !!onDropFile;

    return (
      <div className={cn("w-full relative flex flex-col", wrapperClassName)}>
        {label && (
          <label className="block text-sm font-medium text-text-secondary mb-2">{label}</label>
        )}
        <div 
          className="relative w-full flex-1 min-h-0"
          onDragOver={isDropEnabled ? handleDragOver : undefined}
          onDragLeave={isDropEnabled ? handleDragLeave : undefined}
          onDrop={isDropEnabled ? handleDrop : undefined}
        >
          <textarea
            ref={ref}
            className={cn(
              'w-full h-full min-h-[200px] px-4 py-3 rounded-lg bg-bg-tertiary border border-border',
              'text-text-primary placeholder:text-text-muted',
              'focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30',
              'transition-all duration-200 resize-none',
              monospace && 'font-mono text-sm',
              error && 'border-error focus:border-error focus:ring-error/30',
              className
            )}
            {...props}
          />
          
          {/* Drag Overlay */}
          {isDragging && isDropEnabled && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-bg-tertiary/90 backdrop-blur-sm border-2 border-dashed border-accent rounded-lg text-accent animate-in fade-in duration-200">
              <UploadCloud className="h-10 w-10 mb-2" />
              <p className="font-semibold text-sm">Drop file here to load contents</p>
            </div>
          )}
        </div>
        {error && <p className="mt-1.5 text-sm text-error">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input, type InputProps };