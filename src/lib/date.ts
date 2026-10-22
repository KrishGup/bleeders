/**
 * Day arithmetic. Like Wordle, a "day" is the player's local calendar day, so
 * the answer flips at local midnight. Day 0 is the launch date (Bleedle #1).
 */
export const EPOCH_UTC = Date.UTC(2026, 9, 22); // 22 Oct 2026 — Bleedle #1
const DAY_MS = 86_400_000;

export function dayIndexFor(date: Date = new Date()): number {
  const local = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.max(0, Math.round((local - EPOCH_UTC) / DAY_MS));
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

export function msUntilNextDay(now: Date = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return Math.max(0, next.getTime() - now.getTime());
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}
