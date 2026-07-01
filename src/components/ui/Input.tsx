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
  ({ className, wrapperClassName, label, error, monospace = false, onDropText, onDropFile, value, onChange, ...props }, ref) => {
    const [isDragging, setIsDragging] = React.useState(false);
    const gutterRef = React.useRef<HTMLDivElement>(null);
    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

    // Provide dual ref resolution
    const handleRef = React.useCallback((node: HTMLTextAreaElement | null) => {
      textareaRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
    }, [ref]);

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

    const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
      if (gutterRef.current) {
        gutterRef.current.scrollTop = e.currentTarget.scrollTop;
      }
      if (props.onScroll) props.onScroll(e);
    };

    const isDropEnabled = !!onDropText || !!onDropFile;

    // Calculate line numbers if monospace
    const lines = React.useMemo(() => {
      if (!monospace) return 0;
      const strVal = typeof value === 'string' ? value : String(value || '');
      return strVal.split('\n').length;
    }, [monospace, value]);

    return (
      <div className={cn("w-full relative flex flex-col", wrapperClassName)}>
        {label && (
          <label className="block text-sm font-medium text-text-secondary mb-2">{label}</label>
        )}
        <div 
          className={cn(
            "relative w-full flex-1 min-h-0 flex rounded-lg border overflow-hidden transition-all duration-200",
            error ? "border-error focus-within:border-error focus-within:ring-1 focus-within:ring-error/30" : "border-border bg-bg-tertiary focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/30"
          )}
          onDragOver={isDropEnabled ? handleDragOver : undefined}
          onDragLeave={isDropEnabled ? handleDragLeave : undefined}
          onDrop={isDropEnabled ? handleDrop : undefined}
        >
          {monospace && (
            <div 
              ref={gutterRef}
              className="flex flex-col items-end py-3 px-3 border-r border-border/50 bg-bg-secondary text-text-muted/50 select-none font-mono text-sm overflow-hidden min-w-[3rem]"
              aria-hidden="true"
            >
              {Array.from({ length: Math.max(1, lines) }).map((_, i) => (
                <div key={i} className="leading-relaxed">{i + 1}</div>
              ))}
            </div>
          )}
          <textarea
            ref={handleRef}
            value={value}
            onChange={onChange}
            onScroll={handleScroll}
            className={cn(
              'w-full h-full min-h-[200px] px-4 py-3 bg-transparent',
              'text-text-primary placeholder:text-text-muted',
              'focus:outline-none resize-none leading-relaxed',
              monospace && 'font-mono text-sm whitespace-pre overflow-auto',
              className
            )}
            {...props}
          />
          
          {/* Drag Overlay */}
          {isDragging && isDropEnabled && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-bg-tertiary/90 backdrop-blur-sm border-2 border-dashed border-accent text-accent animate-in fade-in duration-200">
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