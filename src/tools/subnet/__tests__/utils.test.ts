import { describe, it, expect } from 'vitest';
import { calculateSubnet, calculateSubnetSplits } from '../utils';

describe('Subnet Calculator Utilities', () => {
  describe('calculateSubnet', () => {
    it('should calculate correct subnet details for standard Class C network /24', () => {
      const res = calculateSubnet('192.168.1.50', 24);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.ipAddress).toBe('192.168.1.50');
        expect(res.data.cidr).toBe(24);
        expect(res.data.subnetMask).toBe('255.255.255.0');
        expect(res.data.networkAddress).toBe('192.168.1.0');
        expect(res.data.broadcastAddress).toBe('192.168.1.255');
        expect(res.data.firstUsable).toBe('192.168.1.1');
        expect(res.data.lastUsable).toBe('192.168.1.254');
        expect(res.data.totalHosts).toBe(256);
        expect(res.data.usableHosts).toBe(254);
        expect(res.data.ipClass).toBe('C');
        expect(res.data.isPrivate).toBe(true);
      }
    });

    it('should handle /32 host route correctly', () => {
      const res = calculateSubnet('10.0.0.1', 32);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.subnetMask).toBe('255.255.255.255');
        expect(res.data.firstUsable).toBe('10.0.0.1');
        expect(res.data.lastUsable).toBe('10.0.0.1');
        expect(res.data.usableHosts).toBe(1);
        expect(res.data.totalHosts).toBe(1);
        expect(res.data.isPrivate).toBe(true);
      }
    });

    it('should handle /31 RFC 3021 Point-to-Point subnet', () => {
      const res = calculateSubnet('172.16.0.0', 31);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.firstUsable).toBe('172.16.0.0');
        expect(res.data.lastUsable).toBe('172.16.0.1');
        expect(res.data.usableHosts).toBe(2);
        expect(res.data.ipClass).toBe('B');
        expect(res.data.isPrivate).toBe(true);
      }
    });

    it('should handle /0 default route network', () => {
      const res = calculateSubnet('8.8.8.8', 0);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.subnetMask).toBe('0.0.0.0');
        expect(res.data.networkAddress).toBe('0.0.0.0');
        expect(res.data.broadcastAddress).toBe('255.255.255.255');
        expect(res.data.isPrivate).toBe(false);
      }
    });

    it('should return error for invalid IP address format', () => {
      const res = calculateSubnet('256.300.1.1', 24);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toBe('Invalid IPv4 address format.');
      }
    });

    it('should return error for CIDR out of range (< 0 or > 32)', () => {
      const res1 = calculateSubnet('192.168.1.1', -1);
      expect(res1.success).toBe(false);

      const res2 = calculateSubnet('192.168.1.1', 33);
      expect(res2.success).toBe(false);
    });
  });

  describe('calculateSubnetSplits', () => {
    it('should split /24 network into four /26 subnets', () => {
      const res = calculateSubnetSplits('192.168.1.0', 24, 26);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toHaveLength(4);
        expect(res.data[0].networkAddress).toBe('192.168.1.0');
        expect(res.data[1].networkAddress).toBe('192.168.1.64');
        expect(res.data[2].networkAddress).toBe('192.168.1.128');
        expect(res.data[3].networkAddress).toBe('192.168.1.192');
      }
    });

    it('should return error if target CIDR is less than or equal to base CIDR', () => {
      const res = calculateSubnetSplits('192.168.1.0', 24, 24);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toContain('Target CIDR must be greater than base CIDR');
      }
    });
  });
});
