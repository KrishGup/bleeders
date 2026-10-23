import { describe, expect, it } from 'vitest';
import { CHARACTERS } from '../data';
import { dailyPuzzle, modeRoster, releaseEntry } from '../game/engine';
import { createSchedule } from '../lib/daily';
import {
  dayIndexFor,
  dayToDate,
  formatCountdown,
  msUntilNextDay,
  puzzleNumber,
  puzzleStart,
  RESET_ZONE,
} from '../lib/date';
import { cyrb53, mulberry32, unitHash } from '../lib/hash';

const items = Array.from({ length: 60 }, (_, i) => ({ id: `soul-${i}`, weight: i < 10 ? 3 : 1 }));
const make = (list = items, pinned?: Record<number, string>) =>
  createSchedule({
    salt: 'test',
    items: list,
    key: (item) => item.id,
    weight: (item) => item.weight,
    noRepeatDays: 20,
    ...(pinned ? { pinned } : {}),
  });

describe('hashing', () => {
  it('is deterministic and well spread', () => {
    expect(cyrb53('bleedle')).toBe(cyrb53('bleedle'));
    expect(cyrb53('bleedle')).not.toBe(cyrb53('bleedlf'));
    const u = unitHash('x');
    expect(u).toBeGreaterThan(0);
    expect(u).toBeLessThan(1);
  });

  it('seeds a repeatable PRNG', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});

describe('dates', () => {
  const at = (iso: string) => new Date(iso);

  it('rolls over for everyone at 11 PM Eastern', () => {
    expect(dayIndexFor(at('2026-10-22T03:00:00Z'))).toBe(0); // 11 PM EDT on the 21st: #1 goes live
    expect(dayIndexFor(at('2026-10-22T18:00:00Z'))).toBe(0);
    expect(dayIndexFor(at('2026-10-24T02:59:59Z'))).toBe(1); // 10:59 PM EDT on the 23rd
    expect(dayIndexFor(at('2026-10-24T03:00:00Z'))).toBe(2); // 11 PM EDT: #3
    // Once clocks fall back, 11 PM Eastern is 04:00 UTC.
    expect(dayIndexFor(at('2026-11-02T03:59:59Z'))).toBe(10);
    expect(dayIndexFor(at('2026-11-02T04:00:00Z'))).toBe(11);
    expect(dayIndexFor(at('2027-10-22T12:00:00Z'))).toBe(365);
    expect(dayIndexFor(at('2020-01-01T00:00:00Z'))).toBe(0);
    expect(puzzleNumber(0)).toBe(1);
  });

  it('started Bleedle #2 early, at launch', () => {
    expect(dayIndexFor(at('2026-10-23T00:29:59Z'))).toBe(0);
    expect(dayIndexFor(at('2026-10-23T00:30:00Z'))).toBe(1);
    expect(dayIndexFor(at('2026-10-23T02:00:00Z'))).toBe(1);
    expect(new Date(puzzleStart(1)).toISOString()).toBe('2026-10-23T00:30:00.000Z');
  });

  it('starts every puzzle at 11 PM on the Eastern clock, through daylight saving', () => {
    const hourIn = (ms: number) =>
      new Intl.DateTimeFormat('en-US', { timeZone: RESET_ZONE, hour: 'numeric', hourCycle: 'h23' }).format(
        ms,
      );
    for (let day = 2; day < 420; day++) {
      const start = puzzleStart(day);
      expect(hourIn(start), `day ${day}`).toBe('23');
      expect(dayIndexFor(new Date(start))).toBe(day);
      expect(dayIndexFor(new Date(start - 1))).toBe(day - 1);
      // 24 hours apart, or 23/25 around a clock change (#2's early start aside).
      if (day > 2) expect([23, 24, 25]).toContain((start - puzzleStart(day - 1)) / 3_600_000);
    }
  });

  it('round-trips a day index to a calendar date', () => {
    const date = dayToDate(10);
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 10, 1]);
  });

  it('counts down to the next reset', () => {
    expect(formatCountdown(3_723_000)).toBe('01:02:03');
    expect(formatCountdown(-5)).toBe('00:00:00');
    expect(msUntilNextDay(at('2026-10-24T02:59:00Z'))).toBe(60_000);
    expect(msUntilNextDay(at('2026-10-23T00:00:00Z'))).toBe(30 * 60_000);
    expect(formatCountdown(msUntilNextDay(at('2026-10-23T00:45:00Z')))).toBe('26:15:00');
  });
});

describe('schedule', () => {
  it('is deterministic', () => {
    const a = make();
    const b = make();
    for (let day = 0; day < 200; day++) expect(a.pick(day).id).toBe(b.pick(day).id);
  });

  it('never repeats inside the cool-down window', () => {
    const schedule = make();
    const lastSeen = new Map<string, number>();
    for (let day = 0; day < 500; day++) {
      const id = schedule.pick(day).id;
      const last = lastSeen.get(id);
      if (last !== undefined) expect(day - last).toBeGreaterThan(20);
      lastSeen.set(id, day);
    }
  });

  it('favours heavier items', () => {
    const schedule = make();
    let heavy = 0;
    for (let day = 0; day < 2000; day++) if (schedule.pick(day).weight === 3) heavy++;
    // 10 heavy items of 60 at 3× weight should land well above their 1/6 head-count share.
    expect(heavy / 2000).toBeGreaterThan(0.2);
  });

  it('honours pinned days', () => {
    const schedule = make(items, { 0: 'soul-42', 3: 'soul-7' });
    expect(schedule.pick(0).id).toBe('soul-42');
    expect(schedule.pick(3).id).toBe('soul-7');
  });

  it('barely changes when a new item is added (rendezvous hashing)', () => {
    const before = make();
    const after = make([...items, { id: 'soul-new', weight: 1 }]);
    let changed = 0;
    for (let day = 0; day < 300; day++) if (before.pick(day).id !== after.pick(day).id) changed++;
    expect(changed).toBeLessThan(150);
  });

  it('rejects pins that are not in the pool', () => {
    expect(() => make(items, { 0: 'nobody' })).toThrow();
  });
});

describe('daily puzzles', () => {
  it('produces a valid answer for every mode for years', () => {
    for (const mode of ['classic', 'release', 'quote', 'emoji'] as const) {
      const roster = new Set(modeRoster(mode).map((c) => c.id));
      for (let day = 0; day < 1000; day += 7) {
        const puzzle = dailyPuzzle(mode, day);
        expect(roster.has(puzzle.answer)).toBe(true);
        if (mode !== 'classic') expect(puzzle.clue?.startsWith(`${puzzle.answer}:`)).toBe(true);
      }
    }
  });

  it('opens launch week with hand-picked souls', () => {
    expect(dailyPuzzle('classic', 0).answer).toBe('renji-abarai');
    expect(dailyPuzzle('quote', 0).answer).toBe('sosuke-aizen');
    const release = dailyPuzzle('release', 0);
    expect(release.answer).toBe('toshiro-hitsugaya');
    expect(releaseEntry(release.clue!).kind).toBe('Shikai');
  });

  it('eventually features filler characters as daily answers', () => {
    const fillerIds = new Set(CHARACTERS.filter((c) => c.origin !== 'canon').map((c) => c.id));
    let filler = 0;
    for (let day = 0; day < 365; day++) if (fillerIds.has(dailyPuzzle('classic', day).answer)) filler++;
    expect(filler).toBeGreaterThan(15);
  });
});
