import { describe, it, expect } from 'vitest';
import { getTimezones, convertTime, getCommonTimezones } from '../utils';

describe('Timezone Utilities', () => {
  it('should list timezones and common timezones', () => {
    const common = getCommonTimezones();
    expect(common.length).toBeGreaterThan(0);
    expect(common.some(t => t.name === 'UTC')).toBe(true);

    const all = getTimezones();
    expect(Array.isArray(all)).toBe(true);
  });

  it('should convert time between timezones correctly', () => {
    const date = new Date('2023-01-01T12:00:00Z');
    const res = convertTime(date, 'UTC', 'America/New_York');
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.sourceTime).toBeDefined();
      expect(res.targetTime).toBeDefined();
    }
  });

  it('should fail on invalid date input', () => {
    const res = convertTime(new Date('invalid-date'), 'UTC', 'America/New_York');
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toBe('Invalid date');
    }
  });
});
