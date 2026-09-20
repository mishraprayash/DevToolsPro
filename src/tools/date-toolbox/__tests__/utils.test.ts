import { describe, it, expect } from 'vitest';
import {
  toTimestamp,
  fromTimestamp,
  parseInput,
  toEpochSeconds,
  toEpochMilliseconds,
  toEpochMicroseconds,
  toEpochNanoseconds,
  formatInTimezone,
  listTimeZones,
  getRelativeTime,
  detectTimestampUnit,
  addSubtractDate,
  computeDateDifference
} from '../utils';

describe('Date Toolbox Utilities', () => {
  describe('toTimestamp & fromTimestamp', () => {
    it('should convert Date, string, and number to timestamp', () => {
      const now = new Date();
      expect(toTimestamp(now)).toBe(now.getTime());
      expect(toTimestamp(now.toISOString())).toBe(now.getTime());
      expect(toTimestamp(123456789)).toBe(123456789);
    });

    it('should convert timestamp to Date across various units', () => {
      const sec = 1600000000;
      expect(fromTimestamp(sec, 'seconds').getTime()).toBe(sec * 1000);
      expect(fromTimestamp(sec * 1000, 'milliseconds').getTime()).toBe(sec * 1000);
      expect(fromTimestamp(sec * 1000000, 'microseconds').getTime()).toBe(sec * 1000);
      expect(fromTimestamp(sec * 1000000000, 'nanoseconds').getTime()).toBe(sec * 1000);
    });
  });

  describe('parseInput & detectTimestampUnit', () => {
    it('should detect units correctly', () => {
      expect(detectTimestampUnit('1600000000')).toBe('seconds');
      expect(detectTimestampUnit('1600000000000')).toBe('milliseconds');
      expect(detectTimestampUnit('1600000000000000')).toBe('microseconds');
      expect(detectTimestampUnit('1600000000000000000')).toBe('nanoseconds');
      expect(detectTimestampUnit('not-a-number')).toBe('unknown');
    });

    it('should parse numeric strings correctly', () => {
      const res = parseInput('1600000000');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.detectedUnit).toBe('seconds');
        expect(res.dateMs).toBe(1600000000000);
      }
    });

    it('should parse ISO date strings', () => {
      const res = parseInput('2023-01-01T00:00:00Z');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.detectedUnit).toBe('unknown');
        expect(res.dateMs).toBe(Date.parse('2023-01-01T00:00:00Z'));
      }
    });

    it('should handle empty or invalid inputs gracefully', () => {
      expect(parseInput('').success).toBe(false);
      expect(parseInput('   ').success).toBe(false);
      expect(parseInput('invalid-date-string-xyz').success).toBe(false);
    });
  });

  describe('Epoch Converters', () => {
    it('should convert dateMs to epoch units', () => {
      const dateMs = 1600000000000;
      expect(toEpochSeconds(dateMs)).toBe(1600000000);
      expect(toEpochMilliseconds(dateMs)).toBe(1600000000000);
      expect(toEpochMicroseconds(dateMs)).toBe(1600000000000000);
      expect(toEpochNanoseconds(dateMs)).toBe(1600000000000000000);
    });
  });

  describe('formatInTimezone & listTimeZones', () => {
    it('should format date in given timezone', () => {
      const formatted = formatInTimezone(1600000000000, 'UTC');
      expect(formatted).toContain('2020');
    });

    it('should return timezone list', () => {
      const tzs = listTimeZones();
      expect(Array.isArray(tzs)).toBe(true);
      expect(tzs.length).toBeGreaterThan(0);
    });
  });

  describe('getRelativeTime', () => {
    it('should format relative times for past and future', () => {
      const now = Date.now();
      expect(getRelativeTime(now - 1000)).toBe('just now');
      expect(getRelativeTime(now - 10000)).toBe('10 seconds ago');
      expect(getRelativeTime(now - 120000)).toBe('2 minutes ago');
      expect(getRelativeTime(now + 3600000)).toBe('in 1 hour');
    });
  });

  describe('addSubtractDate & computeDateDifference', () => {
    it('should add and subtract date offsets', () => {
      const base = new Date('2023-01-01T00:00:00Z');
      const added = addSubtractDate(base, { years: 1, months: 2, weeks: 1, days: 3 }, 'add');
      expect(added.getFullYear()).toBe(2024);

      const subbed = addSubtractDate(base, { years: 1, months: 0, weeks: 0, days: 0 }, 'subtract');
      expect(subbed.getFullYear()).toBe(2022);
    });

    it('should calculate difference between two dates', () => {
      const start = new Date('2023-01-01');
      const end = new Date('2023-01-10');
      const diff = computeDateDifference(start, end);
      expect(diff.totalDays).toBe(9);
      expect(diff.businessDays).toBeGreaterThan(0);
    });
  });
});
