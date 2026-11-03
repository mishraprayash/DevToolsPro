import { describe, expect, it } from 'vitest';
import { isIOSDevice, isIOSSafari, resolveInstallUi, type PlatformInfo } from '@/lib/pwa/installPrompt';

const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';
const IPHONE_CHROME =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/124.0.6367.88 Mobile/15E148 Safari/604.1';
const IPADOS_SAFARI =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15';
const DESKTOP_CHROME =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const info = (over: Partial<PlatformInfo>): PlatformInfo => ({
  userAgent: DESKTOP_CHROME,
  platform: 'MacIntel',
  maxTouchPoints: 0,
  standalone: false,
  ...over,
});

describe('installPrompt platform detection', () => {
  it('detects iPhone and iPadOS (desktop-class UA with touch)', () => {
    expect(isIOSDevice(info({ userAgent: IPHONE_SAFARI, platform: 'iPhone' }))).toBe(true);
    expect(isIOSDevice(info({ userAgent: IPADOS_SAFARI, maxTouchPoints: 5 }))).toBe(true);
    expect(isIOSDevice(info({ userAgent: IPADOS_SAFARI, maxTouchPoints: 0 }))).toBe(false);
  });

  it('only treats real Safari on iOS as able to Add to Home Screen', () => {
    expect(isIOSSafari(info({ userAgent: IPHONE_SAFARI, platform: 'iPhone' }))).toBe(true);
    expect(isIOSSafari(info({ userAgent: IPHONE_CHROME, platform: 'iPhone' }))).toBe(false);
    expect(isIOSSafari(info({ userAgent: DESKTOP_CHROME }))).toBe(false);
  });
});

describe('resolveInstallUi', () => {
  it('hides everything when already running standalone', () => {
    expect(resolveInstallUi(info({ standalone: true }), true)).toEqual({ kind: 'hidden' });
    expect(resolveInstallUi(info({ userAgent: IPHONE_SAFARI, platform: 'iPhone', standalone: true }), false)).toEqual({ kind: 'hidden' });
  });

  it('shows the install button when a deferred prompt is available', () => {
    expect(resolveInstallUi(info({}), true)).toEqual({ kind: 'prompt' });
  });

  it('shows the iOS hint on iOS Safari and nothing on unsupported browsers', () => {
    expect(resolveInstallUi(info({ userAgent: IPHONE_SAFARI, platform: 'iPhone' }), false)).toEqual({ kind: 'ios' });
    expect(resolveInstallUi(info({}), false)).toEqual({ kind: 'hidden' });
  });
});
