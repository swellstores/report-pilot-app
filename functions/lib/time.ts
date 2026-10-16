/**
 * Calendar maths in the store's time zone.
 *
 * Swell does not let apps read the time zone set under Settings → General, so
 * the merchant picks one in the app's own settings (`timezone`, an IANA name
 * such as `America/Los_Angeles`; UTC when unset). Every period boundary, due
 * day, send hour and date on a report is worked out in that zone, so a "daily"
 * report covers the store's own day and daylight saving is handled.
 */

export const DEFAULT_TIME_ZONE = 'UTC';

/** The local hour reports are sent at. Crons run hourly and wait for it. */
export const SEND_HOUR = 8;

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 86400000;

/** A setting's time zone if the runtime knows it, otherwise UTC. */
export function validTimeZone(value: unknown): string {
  if (typeof value !== 'string' || !value) {
    return DEFAULT_TIME_ZONE;
  }
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return value;
  } catch {
    return DEFAULT_TIME_ZONE;
  }
}

export interface LocalDay {
  year: number;
  /** 1–12. */
  month: number;
  day: number;
}

interface LocalParts extends LocalDay {
  hour: number;
  minute: number;
  second: number;
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string) {
  let format = formatters.get(timeZone);
  if (!format) {
    format = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    });
    formatters.set(timeZone, format);
  }
  return format;
}

/** The wall-clock date and time at `date` in `timeZone`. */
export function localParts(date: Date, timeZone: string): LocalParts {
  const parts: Record<string, number> = {};
  for (const part of formatter(timeZone).formatToParts(date)) {
    if (part.type !== 'literal') {
      parts[part.type] = Number(part.value);
    }
  }
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour % 24,
    minute: parts.minute,
    second: parts.second,
  };
}

/** How far `timeZone` is ahead of UTC at `date`, in milliseconds. */
function offsetAt(date: Date, timeZone: string): number {
  const p = localParts(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - (date.getTime() - date.getMilliseconds());
}

/** The instant a local calendar day starts (00:00) in `timeZone`. */
export function startOfLocalDay(day: LocalDay, timeZone: string): Date {
  const guess = Date.UTC(day.year, day.month - 1, day.day);
  // Two passes settle the offset on almost every day.
  let instant = guess - offsetAt(new Date(guess), timeZone);
  instant = guess - offsetAt(new Date(instant), timeZone);

  // Where the clocks change at midnight, the passes can be an hour out: when
  // they jump forward (Santiago, Havana, Asunción) 00:00 doesn't exist, and
  // when they go back (Amman, Gaza) it happens twice. Either way the day
  // starts at the first instant whose local date is `day`, within a few hours
  // of the estimate.
  const target = dayKey(day);
  const reached = (t: number) => dayKey(localDay(new Date(t), timeZone)) >= target;
  let before = instant - 6 * HOUR_MS;
  let after = instant + 6 * HOUR_MS;
  if (reached(before) || !reached(after)) {
    return new Date(instant);
  }
  while (after - before > 1000) {
    const mid = Math.floor((before + after) / 2);
    if (reached(mid)) {
      after = mid;
    } else {
      before = mid;
    }
  }
  // Clock changes happen on a whole second.
  return new Date(Math.floor(after / 1000) * 1000);
}

/** The local calendar day `date` falls on in `timeZone`. */
export function localDay(date: Date, timeZone: string): LocalDay {
  const { year, month, day } = localParts(date, timeZone);
  return { year, month, day };
}

/** `day` moved by `days` calendar days (negative goes back). */
export function addDays(day: LocalDay, days: number): LocalDay {
  const moved = new Date(Date.UTC(day.year, day.month - 1, day.day) + days * DAY_MS);
  return { year: moved.getUTCFullYear(), month: moved.getUTCMonth() + 1, day: moved.getUTCDate() };
}

/** The first day of the month `months` away from `day`'s month. */
export function addMonths(day: LocalDay, months: number): LocalDay {
  const moved = new Date(Date.UTC(day.year, day.month - 1 + months, 1));
  return { year: moved.getUTCFullYear(), month: moved.getUTCMonth() + 1, day: 1 };
}

/** 0 = Sunday … 6 = Saturday. */
export function weekday(day: LocalDay): number {
  return new Date(Date.UTC(day.year, day.month - 1, day.day)).getUTCDay();
}

/** Whole days from `a` to `b`. */
export function daysBetween(a: LocalDay, b: LocalDay): number {
  return Math.round(
    (Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)) / DAY_MS,
  );
}

/** `YYYY-MM-DD` for a local day. */
export function dayKey(day: LocalDay): string {
  return `${day.year}-${String(day.month).padStart(2, '0')}-${String(day.day).padStart(2, '0')}`;
}

/** A local day as a UTC-midnight Date, for formatting with `timeZone: 'UTC'`. */
export function dayAsUtcDate(day: LocalDay): Date {
  return new Date(Date.UTC(day.year, day.month - 1, day.day));
}

/**
 * Whether `now` is in the store's send hour (08:00–08:59 local). The report
 * crons run every hour, and only the run in this hour can send, so each store
 * gets its reports in its own morning, once a day.
 */
export function isSendHour(now: Date, timeZone: string): boolean {
  return localParts(now, timeZone).hour === SEND_HOUR;
}
