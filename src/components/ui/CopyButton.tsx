'use client';

import * as React from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from './Button';
import { toast } from './Toast';
import { cn } from '@/lib/utils';

export interface CopyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
}

export function CopyButton({
  value,
  label = 'Copy',
  size = 'sm',
  disabled = false,
  variant = 'secondary',
  className,
  children,
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false);

  // Keyboard shortcut handler for instant output copying
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'c' && document.activeElement === document.body && value && !disabled) {
        // Prevent default only if nothing is selected
        if (window.getSelection()?.toString() === '') {
          e.preventDefault();
          navigator.clipboard.writeText(value);
          setCopied(true);
          toast({ type: 'success', message: `${label} copied to clipboard! (⌘C shortcut)` });
          setTimeout(() => setCopied(false), 2000);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [value, label, disabled]);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast({
        type: 'success',
        message: `${label} successfully copied!`,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        type: 'error',
        message: 'Failed to copy to clipboard',
      });
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      disabled={disabled}
      className={cn(className, copied && variant === 'ghost' && 'text-success')}
      icon={copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
      {...props}
    >
      {children ?? (copied ? 'Copied!' : label)}
    </Button>
  );
}

CopyButton.displayName = 'CopyButton';
