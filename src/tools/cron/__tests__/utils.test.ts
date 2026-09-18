import { describe, it, expect } from 'vitest';
import {
  getNextRuns,
  translateCronToEnglish,
  getRelativeTimeCountdown,
} from '../utils';

describe('Cron Utilities', () => {
  describe('getNextRuns', () => {
    it('should parse 5-field cron expression and return next runs', () => {
      const res = getNextRuns('*/15 * * * *', 3);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.dates).toHaveLength(3);
        expect(res.dates[0]).toBeInstanceOf(Date);
      }
    });

    it('should parse 6-field cron expression with seconds', () => {
      const res = getNextRuns('*/10 * * * * *', 2); // Every 10 seconds
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.dates).toHaveLength(2);
      }
    });

    it('should handle ranges and step values in fields', () => {
      const res = getNextRuns('*/5 * * * *', 2);
      expect(res.success).toBe(true);
    });

    it('should fail on invalid expression field count', () => {
      const res = getNextRuns('* * *');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toBe('Cron expression must have exactly 5 or 6 fields.');
      }
    });
  });

  describe('translateCronToEnglish', () => {
    it('should translate basic wildcard cron', () => {
      const english = translateCronToEnglish('* * * * *');
      expect(english).toContain('Every minute, every day of the week');
    });

    it('should translate cron with minute and hour', () => {
      const english = translateCronToEnglish('30 14 * * *');
      expect(english).toContain('At minute 30 of at 14:00, every day of the week');
    });

    it('should translate cron with step and list', () => {
      const english = translateCronToEnglish('*/5 8,12 * * 1-5');
      expect(english).toContain('Every 5 minutes');
      expect(english).toContain('at hour(s): 8,12');
      expect(english).toContain('from Monday through Friday');
    });

    it('should translate 6-field cron with seconds', () => {
      const english = translateCronToEnglish('15 * * * * *');
      expect(english).toContain('At second 15');
    });

    it('should handle invalid cron input', () => {
      const english = translateCronToEnglish('invalid cron');
      expect(english).toBe('Invalid cron expression: must have exactly 5 or 6 fields');
    });
  });

  describe('getRelativeTimeCountdown', () => {
    it('should format future dates into human readable countdowns', () => {
      const now = Date.now();
      const targetSec = new Date(now + 30 * 1000 + 500);
      const targetMin = new Date(now + (5 * 60 + 10) * 1000 + 500);
      const targetHr = new Date(now + (2 * 3600 + 15 * 60) * 1000 + 500);
      const targetDays = new Date(now + (3 * 86400 + 4 * 3600) * 1000 + 500);

      expect(getRelativeTimeCountdown(targetSec)).toBe('in 30s');
      expect(getRelativeTimeCountdown(targetMin)).toBe('in 5m 10s');
      expect(getRelativeTimeCountdown(targetHr)).toBe('in 2h 15m');
      expect(getRelativeTimeCountdown(targetDays)).toBe('in 3d 4h');
    });

    it('should return "Just now" for past or immediate dates', () => {
      expect(getRelativeTimeCountdown(new Date(Date.now() - 1000))).toBe('Just now');
    });
  });
});
