import { describe, it, expect } from 'vitest';
import { decodeDnsPacket } from '../utils';

describe('DNS Decoder Utilities', () => {
  it('should decode a valid DNS query packet', () => {
    // Standard DNS Query for example.com A
    const hex = 'abcd01000001000000000000076578616d706c6503636f6d0000010001';
    const res = decodeDnsPacket(hex);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.header.transactionId).toBe('0xABCD');
      expect(res.data.header.questionsCount).toBe(1);
      expect(res.data.questions).toHaveLength(1);
      expect(res.data.questions[0].name).toBe('example.com');
      expect(res.data.questions[0].type).toBe('A');
    }
  });

  it('should decode a valid DNS response packet with A record answer', () => {
    // DNS Response with answer 93.184.216.34
    const hex = 'abcd81800001000100000000076578616d706c6503636f6d0000010001c00c000100010000012c00045db8d822';
    const res = decodeDnsPacket(hex);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.header.flags.qr).toBe('Response (1)');
      expect(res.data.answers).toHaveLength(1);
      expect(res.data.answers[0].type).toBe('A');
      expect(res.data.answers[0].data).toBe('93.184.216.34');
    }
  });

  it('should return failure for payload shorter than 12 bytes', () => {
    const res = decodeDnsPacket('12345678');
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toContain('at least 12 bytes');
    }
  });

  it('should return failure for invalid hex strings', () => {
    const res = decodeDnsPacket('invalid_hex_string!');
    expect(res.success).toBe(false);
  });
});
