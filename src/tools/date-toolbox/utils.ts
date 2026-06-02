export function toTimestamp(date: Date | string | number): number {
  if (typeof date === 'number') return date;
  if (typeof date === 'string') {
    const parsed = new Date(date);
    return parsed.getTime();
  }
  return date.getTime();
}

export function fromTimestamp(timestamp: number, unit: 'seconds' | 'milliseconds' | 'microseconds' | 'nanoseconds' = 'seconds'): Date {
  switch (unit) {
    case 'seconds':
      return new Date(timestamp * 1000);
    case 'milliseconds':
      return new Date(timestamp);
    case 'microseconds':
      return new Date(Math.floor(timestamp / 1000));
    case 'nanoseconds':
      return new Date(Math.floor(timestamp / 1000000));
  }
}

export type ParseResult = { 
  success: true; 
  dateMs: number; 
  originalVal: number;
  detectedUnit: 'seconds' | 'milliseconds' | 'microseconds' | 'nanoseconds' | 'unknown'; 
} | { success: false; error: string };

export function parseInput(input: string): ParseResult {
  if (!input || input.trim() === '') return { success: false, error: 'Empty input' };
  const s = input.trim();

  if (/^-?\d+$/.test(s)) {
    const num = parseInt(s, 10);
    const unit = detectTimestampUnit(s);
    if (unit === 'nanoseconds') return { success: true, dateMs: Math.floor(num / 1000000), originalVal: num, detectedUnit: 'nanoseconds' };
    if (unit === 'microseconds') return { success: true, dateMs: Math.floor(num / 1000), originalVal: num, detectedUnit: 'microseconds' };
    if (unit === 'milliseconds') return { success: true, dateMs: num, originalVal: num, detectedUnit: 'milliseconds' };
    if (unit === 'seconds') return { success: true, dateMs: num * 1000, originalVal: num, detectedUnit: 'seconds' };
    return { success: true, dateMs: num, originalVal: num, detectedUnit: 'unknown' };
  }

  const parsed = Date.parse(s);
  if (!isNaN(parsed)) return { success: true, dateMs: parsed, originalVal: parsed, detectedUnit: 'unknown' };

  return { success: false, error: 'Unable to parse input as timestamp or date string' };
}

export function toEpochSeconds(dateMs: number): number { return Math.floor(dateMs / 1000); }
export function toEpochMilliseconds(dateMs: number): number { return dateMs; }
export function toEpochMicroseconds(dateMs: number): number { return dateMs * 1000; }
export function toEpochNanoseconds(dateMs: number): number { return dateMs * 1000000; }

export function formatInTimezone(dateMs: number, timeZone?: string, opts?: Intl.DateTimeFormatOptions): string {
  try {
    const options: Intl.DateTimeFormatOptions = Object.assign({ year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' }, opts ?? {});
    const tz = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    return new Intl.DateTimeFormat(undefined, Object.assign({}, options, { timeZone: tz })).format(new Date(dateMs));
  } catch (e) {
    return new Date(dateMs).toString();
  }
}

export function listTimeZones(): string[] {
  try {
    if (typeof Intl?.supportedValuesOf === 'function') {
      return Intl.supportedValuesOf('timeZone');
    }
  } catch {
    // ignore
  }
  return ['UTC','America/Los_Angeles','America/New_York','Europe/London','Europe/Paris','Asia/Tokyo','Asia/Kolkata','Australia/Sydney'];
}

export function getRelativeTime(timestampMs: number): string {
  const now = Date.now();
  const diff = now - timestampMs;
  const absDiff = Math.abs(diff);
  const seconds = Math.floor(absDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const isFuture = diff < 0;
  const prefix = isFuture ? 'in ' : '';
  const suffix = isFuture ? '' : ' ago';

  if (seconds < 5) return 'just now';
  if (days > 0) return `${prefix}${days} day${days > 1 ? 's' : ''}${suffix}`;
  if (hours > 0) return `${prefix}${hours} hour${hours > 1 ? 's' : ''}${suffix}`;
  if (minutes > 0) return `${prefix}${minutes} minute${minutes > 1 ? 's' : ''}${suffix}`;
  return `${prefix}${seconds} second${seconds > 1 ? 's' : ''}${suffix}`;
}

export function detectTimestampUnit(input: string): 'seconds' | 'milliseconds' | 'microseconds' | 'nanoseconds' | 'unknown' {
  const cleanStr = input.trim();
  if (!/^-?\d+$/.test(cleanStr)) return 'unknown';
  const len = cleanStr.replace('-', '').length;
  if (len <= 10) return 'seconds';
  if (len <= 13) return 'milliseconds';
  if (len <= 16) return 'microseconds';
  return 'nanoseconds';
}

export interface DateOffset {
  years: number;
  months: number;
  weeks: number;
  days: number;
}

export interface DateDiffResult {
  totalDays: number;
  weeks: number;
  remainingDays: number;
  months: number;
  remainingDaysInMonth: number;
  years: number;
  remainingMonths: number;
  businessDays: number;
}

export function addSubtractDate(baseDate: Date, offset: DateOffset, action: 'add' | 'subtract'): Date {
  const result = new Date(baseDate.getTime());
  const factor = action === 'add' ? 1 : -1;

  if (offset.years) result.setFullYear(result.getFullYear() + offset.years * factor);
  if (offset.months) result.setMonth(result.getMonth() + offset.months * factor);
  if (offset.weeks) result.setDate(result.getDate() + offset.weeks * 7 * factor);
  if (offset.days) result.setDate(result.getDate() + offset.days * factor);

  return result;
}

export function computeDateDifference(startDate: Date, endDate: Date): DateDiffResult {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const isReverse = start.getTime() > end.getTime();
  const early = isReverse ? end : start;
  const late = isReverse ? start : end;

  const timeDiff = late.getTime() - early.getTime();
  const totalDays = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(totalDays / 7);
  const remainingDays = totalDays % 7;

  let yDiff = late.getFullYear() - early.getFullYear();
  let mDiff = late.getMonth() - early.getMonth();
  let dDiff = late.getDate() - early.getDate();

  if (dDiff < 0) {
    mDiff--;
    const prevMonth = new Date(late.getFullYear(), late.getMonth(), 0);
    dDiff += prevMonth.getDate();
  }

  if (mDiff < 0) {
    yDiff--;
    mDiff += 12;
  }

  let businessDays = 0;
  const current = new Date(early.getTime());
  current.setHours(0, 0, 0, 0);
  const finish = new Date(late.getTime());
  finish.setHours(0, 0, 0, 0);

  while (current.getTime() <= finish.getTime()) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) businessDays++;
    current.setDate(current.getDate() + 1);
  }

  return {
    totalDays,
    weeks,
    remainingDays,
    months: yDiff * 12 + mDiff,
    remainingDaysInMonth: dDiff,
    years: yDiff,
    remainingMonths: mDiff,
    businessDays
  };
}
