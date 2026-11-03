import { toast } from '@/components/ui/Toast';

/**
 * Copies text to the clipboard and toasts the result. Never throws.
 * Used by keyboard shortcuts and other non-CopyButton copy actions.
 */
export async function copyText(text: string | null | undefined, label = 'Output'): Promise<boolean> {
  if (!text) {
    toast({ type: 'info', message: 'Nothing to copy yet' });
    return false;
  }
  try {
    await navigator.clipboard.writeText(text);
    toast({ type: 'success', message: `${label} copied to clipboard!` });
    return true;
  } catch {
    toast({ type: 'error', message: 'Failed to copy to clipboard' });
    return false;
  }
}
