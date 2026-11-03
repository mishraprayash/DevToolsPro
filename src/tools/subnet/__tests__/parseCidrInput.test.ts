import { describe, it, expect } from 'vitest';
import { parseCidrInput } from '../utils';

describe('parseCidrInput', () => {
  it('should parse a CIDR block', () => {
    expect(parseCidrInput('10.0.0.0/8')).toEqual({ success: true, data: { ipAddress: '10.0.0.0', cidr: 8 } });
    expect(parseCidrInput('  192.168.1.10 / 24 ')).toEqual({ success: true, data: { ipAddress: '192.168.1.10', cidr: 24 } });
    expect(parseCidrInput('0.0.0.0/0')).toEqual({ success: true, data: { ipAddress: '0.0.0.0', cidr: 0 } });
    expect(parseCidrInput('8.8.8.8/32')).toEqual({ success: true, data: { ipAddress: '8.8.8.8', cidr: 32 } });
  });

  it('should parse a plain IP with a null prefix', () => {
    expect(parseCidrInput('172.16.5.4')).toEqual({ success: true, data: { ipAddress: '172.16.5.4', cidr: null } });
  });

  it('should reject invalid input without throwing', () => {
    expect(parseCidrInput('').success).toBe(false);
    expect(parseCidrInput('hello').success).toBe(false);
    expect(parseCidrInput('10.0.0/8').success).toBe(false);
    expect(parseCidrInput('256.1.1.1').success).toBe(false);
    expect(parseCidrInput('10.0.0.0/33').success).toBe(false);
    expect(parseCidrInput('10.0.0.0/').success).toBe(false);
    expect(parseCidrInput('2001:db8::/32').success).toBe(false);
  });
});
