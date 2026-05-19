// @ts-ignore
import NepaliDate from 'nepali-date-converter';

export interface NepaliDateObj {
  year: number;
  month: number; // 1-indexed (1 = Baishakh, 12 = Chaitra)
  day: number;
}

export interface GregorianDate {
  year: number;
  month: number; // 1-indexed (1 = Jan, 12 = Dec)
  day: number;
}

export const nepaliMonths = [
  { value: 1, label: 'Baishakh' },
  { value: 2, label: 'Jestha' },
  { value: 3, label: 'Ashadh' },
  { value: 4, label: 'Shrawan' },
  { value: 5, label: 'Bhadra' },
  { value: 6, label: 'Ashwin' },
  { value: 7, label: 'Kartik' },
  { value: 8, label: 'Mangsir' },
  { value: 9, label: 'Poush' },
  { value: 10, label: 'Magh' },
  { value: 11, label: 'Falgun' },
  { value: 12, label: 'Chaitra' }
];

export const englishMonths = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' }
];

// Helper to get number of days in a given BS Month/Year
export function getBsMonthDays(year: number, month: number): number {
  try {
    const map = (NepaliDate as any).dateConfigMap;
    const config = map[String(year)];
    if (config) {
      const keys = Object.keys(config);
      const key = keys[month - 1];
      if (key) return config[key];
    }
    return 30;
  } catch {
    return 30;
  }
}

// Convert BS (Bikram Sambat) to AD (Gregorian)
export function convertBsToAd(bs: NepaliDateObj): { success: true; date: Date } | { success: false; error: string } {
  const { year, month, day } = bs;
  
  if (year < 2000 || year > 2100) {
    return { success: false, error: 'Supported Bikram Sambat years range from 2000 BS to 2100 BS' };
  }
  if (month < 1 || month > 12) {
    return { success: false, error: 'Invalid month (must be between 1 and 12)' };
  }
  const maxDays = getBsMonthDays(year, month);
  if (day < 1 || day > maxDays) {
    return { success: false, error: `Invalid day (Month ${month} of year ${year} has max ${maxDays} days)` };
  }

  try {
    const nd = new NepaliDate(year, month - 1, day);
    const jsDate = nd.toJsDate();
    return { success: true, date: jsDate };
  } catch (e) {
    return { success: false, error: `Conversion error: ${(e as Error).message}` };
  }
}

// Convert AD (Gregorian) to BS (Bikram Sambat)
export function convertAdToBs(adDate: Date): { success: true; bsDate: NepaliDateObj } | { success: false; error: string } {
  try {
    const date = new Date(adDate.getTime());
    // Normalize date to midday to avoid local timezone hour shifts
    date.setHours(12, 0, 0, 0);

    const nd = new NepaliDate(date);
    const bs = nd.getBS();
    
    if (bs.year < 2000 || bs.year > 2100) {
      return { success: false, error: 'Gregorian date corresponds to a Bikram Sambat year outside the supported 2000-2100 BS range' };
    }

    return {
      success: true,
      bsDate: {
        year: bs.year,
        month: bs.month + 1, // Convert 0-indexed to 1-indexed
        day: bs.date
      }
    };
  } catch (e) {
    return { success: false, error: `Conversion error: ${(e as Error).message}` };
  }
}
