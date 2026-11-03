import { describe, it, expect } from 'vitest';
import { extractTimestampClaims } from '../utils';

describe('extractTimestampClaims', () => {
  it('returns exp, iat, nbf in order', () => {
    expect(extractTimestampClaims({ iat: 1516239022, sub: 'x', nbf: 1516239000, exp: 2516239022 })).toEqual([
      { claim: 'exp', seconds: 2516239022 },
      { claim: 'iat', seconds: 1516239022 },
      { claim: 'nbf', seconds: 1516239000 },
    ]);
  });

  it('floors fractional seconds and skips non-numeric values', () => {
    expect(extractTimestampClaims({ exp: 1700000000.9, iat: '1700000000', nbf: Number.NaN })).toEqual([
      { claim: 'exp', seconds: 1700000000 },
    ]);
  });

  it('ignores negative values and non-object payloads', () => {
    expect(extractTimestampClaims({ exp: -5 })).toEqual([]);
    expect(extractTimestampClaims(null)).toEqual([]);
    expect(extractTimestampClaims([1, 2])).toEqual([]);
    expect(extractTimestampClaims('exp')).toEqual([]);
  });
});
