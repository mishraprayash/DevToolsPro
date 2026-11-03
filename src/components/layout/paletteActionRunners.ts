'use client';

import type { ElementType } from 'react';
import {
  Fingerprint, KeyRound, Clock, Unlock, Braces, Lock, Hash, SunMoon, Keyboard,
} from 'lucide-react';
import { PALETTE_ACTIONS, type PaletteActionDef, type PaletteActionId } from '@/lib/utils/paletteActions';
import { sendToTool } from '@/lib/utils/toolHandoff';
import { generateV4 } from '@/tools/uuid/utils';
import { generatePasswordResult } from '@/tools/password/utils';
import { toEpochSeconds } from '@/tools/date-toolbox/utils';
import { toast } from '@/components/ui/Toast';

export interface PaletteActionContext {
  navigate: (href: string) => void;
  toggleTheme: () => void;
  openShortcuts: () => void;
}

export interface PaletteAction extends PaletteActionDef {
  icon: ElementType;
  color: string;
  run: (ctx: PaletteActionContext) => Promise<void> | void;
}

async function copy(text: string, what: string): Promise<void> {
  try {
    if (!text) throw new Error('empty');
    await navigator.clipboard.writeText(text);
    toast({ type: 'success', message: `Copied ${what} to clipboard` });
  } catch {
    toast({ type: 'error', message: `Couldn't copy ${what} — clipboard access was blocked` });
  }
}

/** Read the clipboard; shows an error/info toast and returns null on failure or empty. */
async function readClipboard(): Promise<string | null> {
  try {
    if (!navigator.clipboard?.readText) throw new Error('unsupported');
    const text = await navigator.clipboard.readText();
    if (!text.trim()) {
      toast({ type: 'info', message: 'Your clipboard is empty' });
      return null;
    }
    return text;
  } catch {
    toast({ type: 'error', message: 'Clipboard access was blocked — allow it in your browser and try again' });
    return null;
  }
}

async function clipboardToTool(ctx: PaletteActionContext, toolId: string, buildState: (text: string) => Record<string, unknown>, tabName: string) {
  const text = await readClipboard();
  if (text === null) return;
  if (!sendToTool(toolId, buildState(text), tabName)) {
    toast({ type: 'warning', message: 'Clipboard is too large to hand off — opening the tool empty' });
  }
  ctx.navigate(`/tools/${toolId}`);
}

const RUNNERS: Record<PaletteActionId, Pick<PaletteAction, 'icon' | 'color' | 'run'>> = {
  'copy-uuid': {
    icon: Fingerprint,
    color: 'from-cyan-500 to-blue-500',
    run: () => copy(generateV4(), 'UUID'),
  },
  'copy-password': {
    icon: KeyRound,
    color: 'from-red-500 to-rose-500',
    run: () => {
      const r = generatePasswordResult({
        length: 20, uppercase: true, lowercase: true, numbers: true, symbols: true, excludeAmbiguous: true, mode: 'random',
      });
      if (!r.success) {
        toast({ type: 'error', message: r.error });
        return;
      }
      return copy(r.data, 'password');
    },
  },
  'copy-timestamp': {
    icon: Clock,
    color: 'from-rose-500 to-red-500',
    run: () => {
      const ts = String(toEpochSeconds(Date.now()));
      return copy(ts, `timestamp ${ts}`);
    },
  },
  'decode-base64-clipboard': {
    icon: Unlock,
    color: 'from-blue-500 to-cyan-500',
    run: (ctx) => clipboardToTool(ctx, 'encoder', (input) => ({ input: input.trim(), encodingMode: 'base64', direction: 'decode', b64Mode: 'utf8' }), 'Clipboard (decode)'),
  },
  'format-json-clipboard': {
    icon: Braces,
    color: 'from-amber-500 to-orange-500',
    run: (ctx) => clipboardToTool(ctx, 'json', (input) => ({ input, action: 'beautify', activeExample: -1 }), 'Clipboard'),
  },
  'encode-base64-clipboard': {
    icon: Lock,
    color: 'from-blue-500 to-cyan-500',
    run: (ctx) => clipboardToTool(ctx, 'encoder', (input) => ({ input, encodingMode: 'base64', direction: 'encode', b64Mode: 'utf8' }), 'Clipboard (encode)'),
  },
  'hash-clipboard': {
    icon: Hash,
    color: 'from-green-500 to-emerald-500',
    run: (ctx) => clipboardToTool(ctx, 'hash', (input) => ({ input, algorithm: 'SHA-256' }), 'Clipboard'),
  },
  'toggle-theme': {
    icon: SunMoon,
    color: 'from-indigo-500 to-violet-500',
    run: (ctx) => ctx.toggleTheme(),
  },
  'open-shortcuts': {
    icon: Keyboard,
    color: 'from-slate-500 to-zinc-600',
    run: (ctx) => ctx.openShortcuts(),
  },
};

const paletteActions: PaletteAction[] = PALETTE_ACTIONS.map((def) => ({ ...def, ...RUNNERS[def.id] }));

export { paletteActions };
