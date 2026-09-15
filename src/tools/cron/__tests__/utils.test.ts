import { describe, it, expect } from 'vitest';
import {
  getNextRuns,
  translateCronToEnglish,
  getRelativeTimeCountdown,
} from '../utils';

describe('Cron Utilities', () => {
  describe('getNextRuns', () => {
    it('should calculate upcoming execution dates for 5-field cron "* * * * *"', () => {
      const res = getNextRuns('* * * * *', 3);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.dates).toHaveLength(3);
        expect(res.dates[0]).toBeInstanceOf(Date);
      }
    });

    it('should calculate upcoming execution dates for 6-field cron with seconds "*/10 * * * * *"', () => {
      const res = getNextRuns('*/10 * * * * *', 5);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.dates).toHaveLength(5);
      }
    });

    it('should handle ranges and step values', () => {
      const res = getNextRuns('0 9-17/2 * * 1-5', 2);
      expect(res.success).toBe(true);
    });

    it('should return error for invalid field count', () => {
      const res = getNextRuns('* * *');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toContain('must have exactly 5 or 6 fields');
      }
    });
  });

  describe('translateCronToEnglish', () => {
    it('should translate standard 5-field cron "* * * * *"', () => {
      const translation = translateCronToEnglish('* * * * *');
      expect(translation).toContain('Every minute');
    });

    it('should translate specific minute and hour "30 8 * * *"', () => {
      const translation = translateCronToEnglish('30 8 * * *');
      expect(translation).toContain('At minute 30 of at 08:00');
    });

    it('should translate complex day of week and month ranges "0 0 1 1-6 1,3,5"', () => {
      const translation = translateCronToEnglish('0 0 1 1-6 1,3,5');
      expect(translation).toContain('Monday & Wednesday & Friday');
    });

    it('should return invalid message for bad field count', () => {
      const translation = translateCronToEnglish('invalid cron');
      expect(translation).toBe('Invalid cron expression: must have exactly 5 or 6 fields');
    });
  });

  describe('getRelativeTimeCountdown', () => {
    it('should return "Just now" for past dates', () => {
      const past = new Date(Date.now() - 5000);
      expect(getRelativeTimeCountdown(past)).toBe('Just now');
    });

    it('should format seconds countdown for dates in near future', () => {
      const futureSeconds = new Date(Date.now() + 30000);
      expect(getRelativeTimeCountdown(futureSeconds)).toMatch(/^in \d+s$/);
    });

    it('should format minutes and hours countdowns', () => {
      const futureMins = new Date(Date.now() + 15 * 60 * 1000);
      expect(getRelativeTimeCountdown(futureMins)).toMatch(/^in 1[45]m \d+s$/);

      const futureHours = new Date(Date.now() + 3 * 3600 * 1000);
      expect(getRelativeTimeCountdown(futureHours)).toMatch(/^in (2h 59m|3h 0m)$/);
    });
  });
});
