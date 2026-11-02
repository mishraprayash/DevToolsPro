'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, ChevronDown } from 'lucide-react';
import { Button, type ButtonProps } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { toolsMap } from '@/tools/registry';
import { sendToTool } from '@/lib/utils/toolHandoff';
import { cn } from '@/lib/utils';
import type { OpenInTarget } from '@/lib/utils/openInTargets';

interface OpenInMenuProps {
  targets: OpenInTarget[];
  disabled?: boolean;
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  /** Which edge of the trigger the dropdown lines up with. */
  align?: 'left' | 'right';
  className?: string;
  /** Trigger label when several targets are shown. */
  label?: string;
}

const GAP = 6;
const EDGE = 8;

function targetName(target: OpenInTarget): string {
  return target.label ?? toolsMap.get(target.toolId)?.name ?? target.toolId;
}

function ToolBadge({ toolId }: { toolId: string }) {
  const tool = toolsMap.get(toolId);
  const Icon = tool?.icon ?? ArrowUpRight;
  return (
    <span
      className={cn(
        'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white',
        tool?.color ?? 'from-slate-500 to-slate-600'
      )}
      aria-hidden="true"
    >
      <Icon className="h-3.5 w-3.5" />
    </span>
  );
}

/**
 * "Open in…" control: hands the current output to another tool (sessionStorage handoff)
 * and navigates there. One target renders a plain "Open in <Tool>" button; several render
 * a dropdown. The dropdown is portalled to <body> with fixed positioning so it is never
 * clipped by overflow-hidden panels.
 */
function OpenInMenu({
  targets,
  disabled = false,
  variant = 'ghost',
  size = 'sm',
  align = 'right',
  className,
  label = 'Open in…',
}: OpenInMenuProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pos, setPos] = React.useState<{ top: number; left: number } | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const itemRefs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const menuId = React.useId();

  const available = targets.filter((t) => t.payload !== null);
  const isDisabled = disabled || available.length === 0;
  const isOpen = open && !isDisabled;

  const close = React.useCallback((restoreFocus: boolean) => {
    setOpen(false);
    setPos(null);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  const place = React.useCallback(() => {
    const trigger = triggerRef.current;
    const menu = menuRef.current;
    if (!trigger || !menu) return;
    const r = trigger.getBoundingClientRect();
    const w = menu.offsetWidth;
    const h = menu.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = align === 'right' ? r.right - w : r.left;
    left = Math.min(Math.max(EDGE, left), Math.max(EDGE, vw - w - EDGE));
    let top = r.bottom + GAP;
    if (top + h > vh - EDGE && r.top - GAP - h >= EDGE) top = r.top - GAP - h;
    setPos({ top, left });
  }, [align]);

  // Position once rendered, and keep it attached while the page scrolls / resizes.
  React.useLayoutEffect(() => {
    if (!isOpen) return;
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [isOpen, place]);

  // Close on a pointer press outside both the trigger and the menu.
  React.useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      close(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [isOpen, close]);

  // Move focus into the menu once it is positioned.
  React.useEffect(() => {
    if (isOpen && pos) itemRefs.current[0]?.focus({ preventScroll: true });
  }, [isOpen, pos]);

  const go = (target: OpenInTarget) => {
    if (!target.payload) return;
    close(false);
    if (!sendToTool(target.toolId, target.payload, target.tabName)) {
      toast({ type: 'error', message: `Could not hand off to ${targetName(target)}.` });
      return;
    }
    router.push(`/tools/${target.toolId}`);
  };

  // A single usable (or single declared) target: plain button, no menu.
  const shown = available.length > 0 ? available : targets;
  if (shown.length <= 1) {
    const single = shown[0];
    const text = single ? `Open in ${targetName(single)}` : label;
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled={isDisabled}
        onClick={() => single && go(single)}
        icon={<ArrowUpRight className="h-4 w-4" />}
        title={text}
      >
        {text}
      </Button>
    );
  }

  const focusItem = (index: number) => {
    const count = available.length;
    itemRefs.current[((index % count) + count) % count]?.focus();
  };

  const onMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const current = itemRefs.current.findIndex((el) => el === document.activeElement);
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        close(true);
        break;
      case 'ArrowDown':
        e.preventDefault();
        focusItem(current + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        focusItem(current - 1);
        break;
      case 'Home':
        e.preventDefault();
        focusItem(0);
        break;
      case 'End':
        e.preventDefault();
        focusItem(available.length - 1);
        break;
      case 'Tab':
        e.preventDefault();
        close(true);
        break;
    }
  };

  const onTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && !isDisabled) {
      e.preventDefault();
      setOpen(true);
    } else if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      e.stopPropagation();
      close(true);
    }
  };

  const menu = isOpen
    ? createPortal(
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label="Open in another tool"
          onKeyDown={onMenuKeyDown}
          style={{ top: pos?.top ?? 0, left: pos?.left ?? 0, visibility: pos ? 'visible' : 'hidden' }}
          className="fixed z-[100] w-64 max-w-[calc(100vw-1rem)] rounded-xl border border-border bg-bg-secondary p-1.5 shadow-xl animate-fade-in"
        >
          {available.map((target, i) => (
            <button
              key={`${target.toolId}-${i}`}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              type="button"
              role="menuitem"
              tabIndex={-1}
              onClick={() => go(target)}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-text-primary transition-colors cursor-pointer hover:bg-bg-hover focus:bg-bg-hover focus:outline-none"
            >
              <ToolBadge toolId={target.toolId} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{targetName(target)}</span>
                {target.hint && <span className="block truncate text-xs text-text-muted">{target.hint}</span>}
              </span>
            </button>
          ))}
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <Button
        ref={triggerRef}
        variant={variant}
        size={size}
        className={className}
        disabled={isDisabled}
        onClick={() => (isOpen ? close(false) : setOpen(true))}
        onKeyDown={onTriggerKeyDown}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        icon={<ArrowUpRight className="h-4 w-4" />}
        title="Continue in another tool"
      >
        {label}
        <ChevronDown className={cn('h-3.5 w-3.5 opacity-70 transition-transform', isOpen && 'rotate-180')} />
      </Button>
      {menu}
    </>
  );
}

export { OpenInMenu, type OpenInMenuProps, type OpenInTarget };
