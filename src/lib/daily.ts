import { unitHash } from './hash';

export interface ScheduleOptions<T> {
  /** Distinguishes one mode's schedule from another's. */
  salt: string;
  items: readonly T[];
  key: (item: T) => string;
  weight: (item: T) => number;
  /** An item can't be picked again until this many days have passed. */
  noRepeatDays: number;
  /** Hand-picked answers for specific days (e.g. launch week), by key. */
  pinned?: Readonly<Record<number, string>>;
}

export interface Schedule<T> {
  pick(day: number): T;
  /** Days on which `key` is the answer, within [from, to]. */
  daysOf(key: string, from: number, to: number): number[];
}

/**
 * Daily answer schedule built on weighted rendezvous hashing.
 *
 * For every day, each eligible item gets the score `w / -ln(u)` where `u` is a
 * hash of (salt, day, key) in (0, 1). The highest score wins, which picks items
 * with probability proportional to their weight. Recently picked items sit out
 * for `noRepeatDays`, so favourites don't repeat back-to-back.
 *
 * The big advantage over "shuffle the roster": adding a character later only
 * changes the days that character itself wins — every other day keeps its
 * answer, so new data never scrambles past or future puzzles wholesale.
 */
export function createSchedule<T>(options: ScheduleOptions<T>): Schedule<T> {
  const { salt, items, key, weight, pinned = {} } = options;
  if (items.length === 0) throw new Error(`Schedule "${salt}" has no items`);

  const keys = items.map(key);
  const weights = items.map(weight);
  const indexByKey = new Map(keys.map((k, i) => [k, i]));
  const window = Math.max(0, Math.min(options.noRepeatDays, Math.floor(items.length * 0.6)));
  const picks: number[] = [];
  const lastDay = new Map<number, number>();

  for (const [day, pinnedKey] of Object.entries(pinned)) {
    if (!indexByKey.has(pinnedKey)) throw new Error(`Pinned "${pinnedKey}" (day ${day}) not in "${salt}"`);
  }

  function compute(day: number): number {
    const pinnedKey = pinned[day];
    if (pinnedKey !== undefined) return indexByKey.get(pinnedKey)!;
    let best = -1;
    let bestScore = -Infinity;
    for (let i = 0; i < keys.length; i++) {
      const last = lastDay.get(i);
      if (last !== undefined && day - last <= window) continue;
      const u = unitHash(`${salt}|${day}|${keys[i]}`);
      const score = weights[i]! / -Math.log(u);
      if (score > bestScore) {
        bestScore = score;
        best = i;
      }
    }
    return best;
  }

  function ensure(day: number) {
    for (let d = picks.length; d <= day; d++) {
      const index = compute(d);
      picks.push(index);
      lastDay.set(index, d);
    }
  }

  return {
    pick(day) {
      const safeDay = Math.max(0, Math.floor(day));
      ensure(safeDay);
      return items[picks[safeDay]!]!;
    },
    daysOf(target, from, to) {
      ensure(to);
      const index = indexByKey.get(target);
      const days: number[] = [];
      if (index === undefined) return days;
      for (let d = Math.max(0, from); d <= to; d++) if (picks[d] === index) days.push(d);
      return days;
    },
  };
}
