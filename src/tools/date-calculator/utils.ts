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

  if (offset.years) {
    result.setFullYear(result.getFullYear() + offset.years * factor);
  }
  if (offset.months) {
    result.setMonth(result.getMonth() + offset.months * factor);
  }
  if (offset.weeks) {
    result.setDate(result.getDate() + offset.weeks * 7 * factor);
  }
  if (offset.days) {
    result.setDate(result.getDate() + offset.days * factor);
  }

  return result;
}

export function computeDateDifference(startDate: Date, endDate: Date): DateDiffResult {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Absolute difference calculations
  const isReverse = start.getTime() > end.getTime();
  const early = isReverse ? end : start;
  const late = isReverse ? start : end;

  // Total days
  const timeDiff = late.getTime() - early.getTime();
  const totalDays = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

  // Weeks
  const weeks = Math.floor(totalDays / 7);
  const remainingDays = totalDays % 7;

  // Years & Months (calculated step-wise for calendar accuracy)
  let yDiff = late.getFullYear() - early.getFullYear();
  let mDiff = late.getMonth() - early.getMonth();
  let dDiff = late.getDate() - early.getDate();

  if (dDiff < 0) {
    mDiff--;
    // Get number of days in the previous month
    const prevMonth = new Date(late.getFullYear(), late.getMonth(), 0);
    dDiff += prevMonth.getDate();
  }

  if (mDiff < 0) {
    yDiff--;
    mDiff += 12;
  }

  // Count business days (excluding Saturday & Sunday)
  let businessDays = 0;
  const current = new Date(early.getTime());
  current.setHours(0, 0, 0, 0);
  const finish = new Date(late.getTime());
  finish.setHours(0, 0, 0, 0);

  while (current.getTime() <= finish.getTime()) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) { // 0 = Sunday, 6 = Saturday
      businessDays++;
    }
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
