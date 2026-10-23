/**
 * Day arithmetic. Bleedle is global: everyone gets the next puzzle at the same
 * moment, 11 PM US Eastern (following daylight saving, so 03:00 UTC in summer
 * and 04:00 UTC in winter). Each puzzle is dated by the Eastern calendar day it
 * leads into: Bleedle #1 is 22 Oct 2026, live from 11 PM ET on the 21st.
 */
export const EPOCH_UTC = Date.UTC(2026, 9, 22); // 22 Oct 2026 — Bleedle #1
const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

export const RESET_ZONE = 'America/New_York';
const RESET_HOUR = 23;

/** One-off early starts: Bleedle #2 went live a few hours before the first 11 PM reset. */
const EARLY_STARTS: ReadonlyMap<number, number> = new Map([[1, Date.UTC(2026, 9, 23, 0, 30)]]);

const eastern = new Intl.DateTimeFormat('en-US', {
  timeZone: RESET_ZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
});

/** The Eastern wall-clock reading at an instant, expressed as if it were UTC. */
function easternWallClock(ms: number): number {
  const parts: Partial<Record<Intl.DateTimeFormatPartTypes, number>> = {};
  for (const part of eastern.formatToParts(new Date(ms))) parts[part.type] = Number(part.value);
  const { year = 1970, month = 1, day = 1, hour = 0, minute = 0, second = 0 } = parts;
  return Date.UTC(year, month - 1, day, hour, minute, second);
}

/** 11 PM Eastern on the eve of puzzle `day`'s date. */
function scheduledStart(day: number): number {
  const wall = EPOCH_UTC + (day - 1) * DAY_MS + RESET_HOUR * HOUR_MS;
  // Wall time → instant: take off Eastern's UTC offset; a second pass settles DST edges.
  let ms = wall - (easternWallClock(wall) - wall);
  ms = wall - (easternWallClock(ms) - ms);
  return ms;
}

/** The moment puzzle `day` goes live for everyone. */
export function puzzleStart(day: number): number {
  const scheduled = scheduledStart(day);
  const early = EARLY_STARTS.get(day);
  return early !== undefined && early < scheduled ? early : scheduled;
}

export function dayIndexFor(date: Date = new Date()): number {
  const ms = date.getTime();
  // A puzzle's date is the Eastern calendar day an hour later: 11 PM rolls into tomorrow.
  const wall = easternWallClock(ms + (24 - RESET_HOUR) * HOUR_MS);
  let day = Math.floor((wall - EPOCH_UTC) / DAY_MS);
  if (ms >= puzzleStart(day + 1)) day += 1;
  return Math.max(0, day);
}

/** Human-facing puzzle number. */
export function puzzleNumber(day: number): number {
  return day + 1;
}

export function dayToDate(day: number): Date {
  const utc = new Date(EPOCH_UTC + day * DAY_MS);
  return new Date(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate());
}

export function formatDay(day: number, locale?: string): string {
  return dayToDate(day).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Time left until the next puzzle goes live. */
export function msUntilNextDay(now: Date = new Date()): number {
  return Math.max(0, puzzleStart(dayIndexFor(now) + 1) - now.getTime());
}

/** The nightly reset on the player's own clock, e.g. "8:00 PM". */
export function resetTimeLabel(now: Date = new Date(), locale?: string): string {
  return new Date(puzzleStart(dayIndexFor(now) + 1)).toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}
