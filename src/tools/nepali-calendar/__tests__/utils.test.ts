import { describe, it, expect } from 'vitest';
import { convertBsToAd, convertAdToBs, nepaliMonths, englishMonths } from '../utils';

describe('Nepali Calendar Utilities', () => {
  it('should list month metadata', () => {
    expect(nepaliMonths).toHaveLength(12);
    expect(englishMonths).toHaveLength(12);
  });

  it('should convert BS to AD date successfully', async () => {
    const res = await convertBsToAd({ year: 2080, month: 1, day: 1 });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.date).toBeInstanceOf(Date);
      expect(res.date.getFullYear()).toBe(2023);
    }
  });

  it('should convert AD to BS date successfully', async () => {
    const res = await convertAdToBs(new Date(2023, 3, 14)); // April 14, 2023
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.bsDate.year).toBe(2080);
      expect(res.bsDate.month).toBe(1);
    }
  });

  it('should reject out of range years', async () => {
    const res = await convertBsToAd({ year: 1990, month: 1, day: 1 });
    expect(res.success).toBe(false);
  });
});
