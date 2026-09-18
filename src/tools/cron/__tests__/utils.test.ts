import { describe, it, expect } from 'vitest';
import {
  getNextRuns,
  translateCronToEnglish,
  getRelativeTimeCountdown,
} from '../utils';

describe('Cron Utilities', () => {
  describe('getNextRuns', () => {
    it('should parse valid minute-based cron expression and return next runs', () => {
      const res = getNextRuns('*/5 * * * *', 5);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.dates).toHaveLength(5);
        expect(res.dates[0]).toBeInstanceOf(Date);
      }
    });

    it('should parse valid 6-field cron expression with seconds', () => {
      const res = getNextRuns('*/10 * * * * *', 3);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.dates).toHaveLength(3);
      }
    });

    it('should return error for invalid field counts or malformed input', () => {
      expect(getNextRuns('0 0 *').success).toBe(false);
      expect(getNextRuns('0 0 * * * * * *').success).toBe(false);
    });
  });

  describe('translateCronToEnglish', () => {
    it('should translate common cron expressions to English', () => {
      expect(translateCronToEnglish('0 0 * * *')).toContain('at 00:00');
      expect(translateCronToEnglish('* * * * *')).toContain('Every minute');
      expect(translateCronToEnglish('0 12 * * 1-5')).toContain('from Monday through Friday');
    });

    it('should translate 6-field cron with seconds', () => {
      const result = translateCronToEnglish('30 0 12 * * *');
      expect(result).toBeDefined();
      expect(result).not.toContain('Invalid');
    });

    it('should return error string for invalid field length', () => {
      expect(translateCronToEnglish('invalid')).toContain('Invalid cron expression');
    });
  });

  describe('getRelativeTimeCountdown', () => {
    it('should format future dates into human relative time strings', () => {
      const now = Date.now();
      const future30s = new Date(now + 30 * 1000);
      const future5m = new Date(now + 5 * 60 * 1000);
      const future2h = new Date(now + 2 * 3600 * 1000);

      expect(getRelativeTimeCountdown(future30s)).toMatch(/in \d+s/);
      expect(getRelativeTimeCountdown(future5m)).toMatch(/in 5m \d+s/);
      expect(getRelativeTimeCountdown(future2h)).toMatch(/in 2h 0m/);
    });

    it('should return "Just now" for past dates', () => {
      const pastDate = new Date(Date.now() - 10000);
      expect(getRelativeTimeCountdown(pastDate)).toBe('Just now');
    });
  });
});
