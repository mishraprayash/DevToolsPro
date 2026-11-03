/**
 * Install-prompt state for the PWA.
 *
 * `beforeinstallprompt` can fire before React hydrates, so the listener is
 * attached when this module is first evaluated in the browser (it is imported
 * by the Footer, which ships in the root layout chunk) and the event is kept
 * in a tiny external store read via `useSyncExternalStore`.
 */

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

/** What the install UI should show. */
export type InstallUiState =
  | { kind: 'hidden' } // already installed, unsupported, or not yet known (SSR)
  | { kind: 'prompt' } // Chromium: we hold a deferred beforeinstallprompt event
  | { kind: 'ios' }; // iOS/iPadOS Safari: manual "Add to Home Screen"

export interface PlatformInfo {
  userAgent: string;
  platform: string;
  maxTouchPoints: number;
  /** `display-mode: standalone` matches or iOS `navigator.standalone` is true. */
  standalone: boolean;
}

/** True for iPhone/iPod/iPad, including iPadOS which reports itself as "MacIntel". */
export function isIOSDevice(info: Pick<PlatformInfo, 'userAgent' | 'platform' | 'maxTouchPoints'>): boolean {
  if (/iPad|iPhone|iPod/.test(info.userAgent)) return true;
  return info.platform === 'MacIntel' && info.maxTouchPoints > 1;
}

/**
 * On iOS only Safari can add a web app to the Home Screen (pre-iOS 16.4) and
 * it is the only browser that reliably does, so skip the hint for in-app or
 * third-party browsers (CriOS, FxiOS, EdgiOS, ...).
 */
export function isIOSSafari(info: Pick<PlatformInfo, 'userAgent' | 'platform' | 'maxTouchPoints'>): boolean {
  if (!isIOSDevice(info)) return false;
  return /Safari/.test(info.userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS|GSA|FBAN|FBAV|Instagram/.test(info.userAgent);
}

/** Pure decision function: which install affordance to show. */
export function resolveInstallUi(info: PlatformInfo, hasDeferredPrompt: boolean): InstallUiState {
  if (info.standalone) return { kind: 'hidden' };
  if (hasDeferredPrompt) return { kind: 'prompt' };
  if (isIOSSafari(info)) return { kind: 'ios' };
  return { kind: 'hidden' };
}

// ── Browser store ──────────────────────────────────────────────────────────

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;
let snapshot: InstallUiState = { kind: 'hidden' };
const listeners = new Set<() => void>();
const SERVER_SNAPSHOT: InstallUiState = { kind: 'hidden' };

function readPlatform(): PlatformInfo {
  const nav = navigator as Navigator & { standalone?: boolean };
  const standalone =
    installed ||
    nav.standalone === true ||
    (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches);
  return {
    userAgent: nav.userAgent,
    platform: nav.platform ?? '',
    maxTouchPoints: nav.maxTouchPoints ?? 0,
    standalone,
  };
}

function recompute() {
  const next = resolveInstallUi(readPlatform(), deferredPrompt !== null);
  if (next.kind !== snapshot.kind) {
    snapshot = next;
    listeners.forEach((l) => l());
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault(); // keep the mini-infobar away; we show our own button
    deferredPrompt = event as BeforeInstallPromptEvent;
    recompute();
  });
  window.addEventListener('appinstalled', () => {
    installed = true;
    deferredPrompt = null;
    recompute();
  });
  try {
    window.matchMedia?.('(display-mode: standalone)').addEventListener?.('change', recompute);
  } catch {
    // Older Safari without MediaQueryList#addEventListener: ignore.
  }
}

export function subscribeInstallUi(listener: () => void): () => void {
  listeners.add(listener);
  recompute(); // pick up platform info on first subscribe (after hydration)
  return () => {
    listeners.delete(listener);
  };
}

export function getInstallUiSnapshot(): InstallUiState {
  return snapshot;
}

export function getInstallUiServerSnapshot(): InstallUiState {
  return SERVER_SNAPSHOT;
}

/** Show the native install dialog. Resolves to the user's choice, or 'unavailable'. */
export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  const event = deferredPrompt;
  if (!event) return 'unavailable';
  // A deferred prompt can be used only once.
  deferredPrompt = null;
  try {
    await event.prompt();
    const { outcome } = await event.userChoice;
    if (outcome === 'accepted') installed = true;
    return outcome;
  } catch {
    return 'unavailable';
  } finally {
    recompute();
  }
}
