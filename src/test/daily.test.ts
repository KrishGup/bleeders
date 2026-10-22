import { describe, expect, it } from 'vitest';
import { CHARACTERS } from '../data';
import { dailyPuzzle, modeRoster, releaseEntry } from '../game/engine';
import { createSchedule } from '../lib/daily';
import { dayIndexFor, dayToDate, formatCountdown, msUntilNextDay, puzzleNumber } from '../lib/date';
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
  it('counts days from the launch date in local time', () => {
    expect(dayIndexFor(new Date(2026, 9, 22, 0, 1))).toBe(0);
    expect(dayIndexFor(new Date(2026, 9, 22, 23, 59))).toBe(0);
    expect(dayIndexFor(new Date(2026, 9, 23, 0, 0))).toBe(1);
    expect(dayIndexFor(new Date(2027, 9, 22, 12))).toBe(365);
    expect(dayIndexFor(new Date(2020, 0, 1))).toBe(0);
    expect(puzzleNumber(0)).toBe(1);
  });

  it('survives daylight-saving transitions', () => {
    // Every consecutive local midnight must map to consecutive indexes.
    let previous = dayIndexFor(new Date(2027, 0, 1));
    for (let d = 2; d <= 365; d++) {
      const index = dayIndexFor(new Date(2027, 0, d));
      expect(index - previous).toBe(1);
      previous = index;
    }
  });

  it('round-trips a day index to a calendar date', () => {
    const date = dayToDate(10);
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 10, 1]);
  });

  it('formats the countdown', () => {
    expect(formatCountdown(3_723_000)).toBe('01:02:03');
    expect(formatCountdown(-5)).toBe('00:00:00');
    expect(msUntilNextDay(new Date(2026, 9, 22, 23, 59, 0))).toBe(60_000);
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
