'use client';

import * as React from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { toast } from '@/components/ui/Toast';
import { OpenInMenu } from '@/components/tool/OpenInMenu';
import { useShortcutHint } from '@/lib/hooks/useToolShortcuts';
import { downloadText } from '@/lib/utils/download';
import type { OpenInTarget } from '@/lib/utils/openInTargets';
import { cn } from '@/lib/utils';

interface OutputActionsProps {
  /** The text that Copy / Download act on. */
  value: string;
  /** Disables every action (e.g. while the output is an error). Empty values disable them too. */
  disabled?: boolean;
  /** Copy button label. */
  copyLabel?: string;
  /** When set, shows a Download button that saves `value` under this name. */
  filename?: string;
  /** Overrides the MIME type inferred from `filename`. */
  mime?: string;
  /** Optional "Open in…" destinations. */
  openIn?: OpenInTarget[];
  className?: string;
  children?: React.ReactNode;
}

/**
 * Save `value` as `filename` (with a toast on failure). Pages bind the same function
 * to ⌘S / Ctrl+S via useToolShortcuts({ onDownload }).
 */
function downloadOutput(value: string, filename: string, mime?: string) {
  if (!value) {
    toast({ type: 'info', message: 'Nothing to download yet' });
    return;
  }
  if (!downloadText(value, filename, mime)) {
    toast({ type: 'error', message: 'Download failed' });
  }
}

/** Standard Copy + Download (+ Open in…) cluster for a tool's primary text output. */
function OutputActions({ value, disabled, copyLabel = 'Copy', filename, mime, openIn, className, children }: OutputActionsProps) {
  const hint = useShortcutHint();
  const off = disabled || !value;

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {children}
      <CopyButton shortcut="copy" value={value} label={copyLabel} disabled={off} />
      {filename && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => downloadOutput(value, filename, mime)}
          disabled={off}
          icon={<Download className="h-4 w-4" />}
          title={hint(`Download ${filename}`, 'download')}
        >
          Download
        </Button>
      )}
      {openIn && openIn.length > 0 && <OpenInMenu targets={openIn} disabled={off} align="right" />}
    </div>
  );
}

export { OutputActions, downloadOutput, type OutputActionsProps };
