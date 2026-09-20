import { describe, it, expect } from 'vitest';
import { calculateSubnet, calculateSubnetSplits } from '../utils';

describe('Subnet Calculator Utilities', () => {
  it('should calculate subnet for standard IPv4 CIDR 192.168.1.50/24', () => {
    const res = calculateSubnet('192.168.1.50', 24);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.networkAddress).toBe('192.168.1.0');
      expect(res.data.broadcastAddress).toBe('192.168.1.255');
      expect(res.data.subnetMask).toBe('255.255.255.0');
      expect(res.data.firstUsable).toBe('192.168.1.1');
      expect(res.data.lastUsable).toBe('192.168.1.254');
      expect(res.data.usableHosts).toBe(254);
      expect(res.data.isPrivate).toBe(true);
      expect(res.data.ipClass).toBe('C');
    }
  });

  it('should handle CIDR /32 and /31 edge cases', () => {
    const res32 = calculateSubnet('10.0.0.1', 32);
    expect(res32.success).toBe(true);
    if (res32.success) {
      expect(res32.data.usableHosts).toBe(1);
    }

    const res31 = calculateSubnet('10.0.0.0', 31);
    expect(res31.success).toBe(true);
    if (res31.success) {
      expect(res31.data.usableHosts).toBe(2);
    }
  });

  it('should split a subnet into smaller child subnets', () => {
    const res = calculateSubnetSplits('192.168.1.0', 24, 25);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data).toHaveLength(2);
      expect(res.data[0].networkAddress).toBe('192.168.1.0');
      expect(res.data[1].networkAddress).toBe('192.168.1.128');
    }
  });

  it('should return failure for invalid IP or CIDR bounds', () => {
    expect(calculateSubnet('invalid.ip', 24).success).toBe(false);
    expect(calculateSubnet('192.168.1.1', 35).success).toBe(false);
    expect(calculateSubnetSplits('192.168.1.0', 24, 23).success).toBe(false);
  });
});
