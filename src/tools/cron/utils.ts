export interface CronOptions {
  expr: string;
}

export interface CronParseResult {
  isValid: boolean;
  error?: string;
  englishDescription?: string;
  nextRuns?: Date[];
}

function parseField(field: string, min: number, max: number): Set<number> {
  const allowed = new Set<number>();
  
  if (field === '*') {
    for (let i = min; i <= max; i++) allowed.add(i);
    return allowed;
  }
  
  const parts = field.split(',');
  for (const part of parts) {
    if (part.includes('/')) {
      const [left, stepStr] = part.split('/');
      const step = parseInt(stepStr, 10) || 1;
      let start = min;
      let end = max;
      
      if (left !== '*') {
        if (left.includes('-')) {
          const [s, e] = left.split('-').map(Number);
          start = s;
          end = e;
        } else {
          start = parseInt(left, 10);
          end = max;
        }
      }
      for (let i = start; i <= end; i += step) {
        if (i >= min && i <= max) allowed.add(i);
      }
    } else if (part.includes('-')) {
      const [start, end] = part.split('-').map(Number);
      for (let i = start; i <= end; i++) {
        if (i >= min && i <= max) allowed.add(i);
      }
    } else {
      const num = parseInt(part, 10);
      if (!isNaN(num) && num >= min && num <= max) {
        allowed.add(num);
      }
    }
  }
  return allowed;
}

export function getNextRuns(
  expr: string,
  count: number = 5
): { success: true; dates: Date[] } | { success: false; error: string } {
  const cleanExpr = expr.trim();
  const parts = cleanExpr.split(/\s+/);
  if (parts.length !== 5 && parts.length !== 6) {
    return { success: false, error: 'Cron expression must have exactly 5 or 6 fields.' };
  }

  const hasSeconds = parts.length === 6;
  const secondExpr = hasSeconds ? parts[0] : '0';
  const minuteExpr = hasSeconds ? parts[1] : parts[0];
  const hourExpr = hasSeconds ? parts[2] : parts[1];
  const dayExpr = hasSeconds ? parts[3] : parts[2];
  const monthExpr = hasSeconds ? parts[4] : parts[3];
  const dowExpr = hasSeconds ? parts[5] : parts[4];

  try {
    const seconds = parseField(secondExpr, 0, 59);
    const minutes = parseField(minuteExpr, 0, 59);
    const hours = parseField(hourExpr, 0, 23);
    const days = parseField(dayExpr, 1, 31);
    const months = parseField(monthExpr, 1, 12);
    const normalizedDowExpr = dowExpr.replace(/7/g, '0');
    const dows = parseField(normalizedDowExpr, 0, 6);

    const dates: Date[] = [];
    const current = new Date();
    current.setMilliseconds(0);
    
    let iterations = 0;
    while (dates.length < count && iterations < 60000) {
      iterations++;
      current.setSeconds(current.getSeconds() + 1);

      const m = current.getMonth() + 1;
      if (!months.has(m)) {
        current.setMonth(current.getMonth() + 1, 1);
        current.setHours(0, 0, 0);
        current.setSeconds(-1);
        continue;
      }

      const day = current.getDate();
      const dow = current.getDay();
      if (!days.has(day) || !dows.has(dow)) {
        current.setDate(current.getDate() + 1);
        current.setHours(0, 0, 0);
        current.setSeconds(-1);
        continue;
      }

      const hr = current.getHours();
      if (!hours.has(hr)) {
        current.setHours(current.getHours() + 1, 0, 0);
        current.setSeconds(-1);
        continue;
      }

      const min = current.getMinutes();
      if (!minutes.has(min)) {
        current.setMinutes(current.getMinutes() + 1, 0);
        current.setSeconds(-1);
        continue;
      }

      const sec = current.getSeconds();
      if (!seconds.has(sec)) continue;

      dates.push(new Date(current.getTime()));
    }

    if (dates.length === 0) {
      return { success: false, error: 'Could not find any upcoming executions. Check if bounds are correct.' };
    }

    return { success: true, dates };
  } catch (e) {
    return { success: false, error: `Parsing error: ${(e as Error).message}` };
  }
}

export function translateCronToEnglish(expr: string): string {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5 && parts.length !== 6) {
    return 'Invalid cron expression: must have exactly 5 or 6 fields';
  }

  const hasSeconds = parts.length === 6;
  const second = hasSeconds ? parts[0] : '0';
  const minute = hasSeconds ? parts[1] : parts[0];
  const hour = hasSeconds ? parts[2] : parts[1];
  const day = hasSeconds ? parts[3] : parts[2];
  const month = hasSeconds ? parts[4] : parts[3];
  const dow = hasSeconds ? parts[5] : parts[4];

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const formatUnit = (val: string, unit: string, mapping?: string[]): string => {
    if (val === '*') return `every ${unit}`;
    if (val.includes('/')) {
      const [left, step] = val.split('/');
      const base = left === '*' ? '' : `starting from ${left} `;
      return `every ${step} ${unit}s ${base}`;
    }
    if (val.includes('-')) {
      const [s, e] = val.split('-');
      if (mapping) {
        return `from ${mapping[parseInt(s, 10)]} through ${mapping[parseInt(e, 10)]}`;
      }
      return `from ${unit} ${s} through ${e}`;
    }
    if (val.includes(',')) {
      if (mapping) {
        return `on ` + val.split(',').map(v => mapping[parseInt(v, 10)]).join(' & ');
      }
      return `at ${unit}(s): ${val}`;
    }
    if (mapping) {
      return `on ${mapping[parseInt(val, 10)]}`;
    }
    return `at ${unit} ${val}`;
  };

  const desc: string[] = [];

  // Second
  if (hasSeconds && second !== '0') {
    desc.push(formatUnit(second, 'second'));
  }

  // Minute / Hour
  if (minute === '*' && hour === '*') {
    desc.push('every minute');
  } else if (minute !== '*' && hour === '*') {
    desc.push(formatUnit(minute, 'minute') + ' of every hour');
  } else if (minute === '*' && hour !== '*') {
    desc.push('every minute');
    if (hour.includes(',')) {
      desc.push(`during hours: ${hour}`);
    } else if (hour.includes('-')) {
      desc.push(`between hours ${hour.replace('-', ' and ')}`);
    } else {
      desc.push(`during hour ${hour}`);
    }
  } else {
    const formattedMin = minute.includes(',') || minute.includes('-') || minute.includes('/') 
      ? formatUnit(minute, 'minute') 
      : `at minute ${minute.padStart(2, '0')}`;
      
    const formattedHr = hour.includes(',') || hour.includes('-') || hour.includes('/')
      ? formatUnit(hour, 'hour')
      : `at ${hour.padStart(2, '0')}:00`;
      
    desc.push(`${formattedMin} of ${formattedHr}`);
  }

  // Day of Month
  if (day !== '*') {
    desc.push(formatUnit(day, 'day of month'));
  }

  // Month
  if (month !== '*') {
    desc.push(formatUnit(month, 'month', months));
  }

  // Day of Week
  if (dow !== '*') {
    desc.push(formatUnit(dow.replace(/7/g, '0'), 'day of week', days));
  } else if (day === '*') {
    desc.push('every day of the week');
  }

  const finalStr = desc.join(', ');
  return finalStr.charAt(0).toUpperCase() + finalStr.slice(1);
}

export function getRelativeTimeCountdown(targetDate: Date): string {
  const now = Date.now();
  const diffMs = targetDate.getTime() - now;
  if (diffMs <= 0) return 'Just now';

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffSec < 60) return `in ${diffSec}s`;
  if (diffMin < 60) return `in ${diffMin}m ${diffSec % 60}s`;
  if (diffHr < 24) return `in ${diffHr}h ${diffMin % 60}m`;
  return `in ${diffDays}d ${diffHr % 24}h`;
}
