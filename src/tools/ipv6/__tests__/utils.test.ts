import { describe, it, expect } from 'vitest';
import { processIpv6 } from '../utils';

describe('IPv6 Utilities', () => {
  it('should process standard IPv6 loopback address ::1', () => {
    const res = processIpv6('::1');
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.expanded).toBe('0000:0000:0000:0000:0000:0000:0000:0001');
      expect(res.data.compressed).toBe('::1');
      expect(res.data.isLoopback).toBe(true);
    }
  });

  it('should expand and compress complex IPv6 address', () => {
    const res = processIpv6('2001:db8::ff00:42:8329');
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.expanded).toBe('2001:0db8:0000:0000:0000:ff00:0042:8329');
      expect(res.data.compressed).toBe('2001:db8::ff00:42:8329');
      expect(res.data.reverseDns).toContain('ip6.arpa');
    }
  });

  it('should detect link local and multicast addresses', () => {
    const linkLocal = processIpv6('fe80::1');
    expect(linkLocal.success).toBe(true);
    if (linkLocal.success) {
      expect(linkLocal.data.isLinkLocal).toBe(true);
    }

    const multicast = processIpv6('ff02::1');
    expect(multicast.success).toBe(true);
    if (multicast.success) {
      expect(multicast.data.isMulticast).toBe(true);
    }
  });

  it('should return error for invalid IPv6 format', () => {
    const res = processIpv6('invalid:ipv6:address:xyz');
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toBe('Invalid IPv6 address format.');
    }
  });
});
