import { describe, expect, it } from 'vitest';
import { ACHIEVEMENTS, newlyUnlocked } from '../game/achievements';
import { dailyPuzzle } from '../game/engine';
import {
  applyGuess,
  displayStreak,
  getArchiveRecord,
  getDailyRecord,
  giveUp,
  newDailyRecord,
  recordShare,
  revealHint,
  startEndless,
} from '../state/actions';
import { dailyKey, hydrate, initialState, pruneDaily, type PersistedState } from '../state/model';
import { dailyStatus } from '../state/status';
import { mulberry32 } from '../lib/hash';

const NOW = 1_800_000_000_000;

function solve(
  state: PersistedState,
  mode: 'classic' | 'release' | 'quote' | 'emoji',
  day: number,
  wrong: string[] = [],
) {
  let s = state;
  for (const id of [...wrong, dailyPuzzle(mode, day).answer]) {
    const record = getDailyRecord(s, mode, day, NOW);
    const t = applyGuess(s, record, id, NOW);
    if (t) s = t.state;
  }
  return s;
}

describe('game state', () => {
  it('records guesses and wins', () => {
    const s0 = initialState();
    const record = newDailyRecord('classic', 0, NOW);
    const wrong = applyGuess(s0, record, 'kon', NOW)!;
    expect(wrong.finished).toBeUndefined();
    expect(wrong.state.daily[dailyKey('classic', 0)]?.guesses).toEqual(['kon']);

    const again = applyGuess(wrong.state, wrong.state.daily[dailyKey('classic', 0)]!, 'kon', NOW);
    expect(again).toBeNull();

    const win = applyGuess(wrong.state, wrong.state.daily[dailyKey('classic', 0)]!, record.answer, NOW)!;
    expect(win.finished).toBe('won');
    expect(win.state.stats.classic).toMatchObject({ played: 1, won: 1, currentStreak: 1, best: 2 });
    expect(win.state.collection[record.answer]?.modes).toEqual(['classic']);
    expect(win.unlocked).toContain('konso');
  });

  it('ignores guesses after the game ends and unknown ids', () => {
    const s = solve(initialState(), 'classic', 0);
    const record = s.daily[dailyKey('classic', 0)]!;
    expect(applyGuess(s, record, 'kon', NOW)).toBeNull();
    expect(applyGuess(initialState(), newDailyRecord('classic', 0, NOW), 'not-a-soul', NOW)).toBeNull();
  });

  it('builds and breaks streaks across days', () => {
    let s = initialState();
    s = solve(s, 'quote', 0);
    s = solve(s, 'quote', 1);
    s = solve(s, 'quote', 2);
    expect(s.stats.quote?.currentStreak).toBe(3);
    expect(displayStreak(s, 'quote', 3)).toBe(3);
    expect(displayStreak(s, 'quote', 4)).toBe(0);
    s = solve(s, 'quote', 5);
    expect(s.stats.quote?.currentStreak).toBe(1);
    expect(s.stats.quote?.maxStreak).toBe(3);
  });

  it('resets the streak when giving up', () => {
    let s = solve(initialState(), 'emoji', 0);
    const record = getDailyRecord(s, 'emoji', 1, NOW);
    const t = giveUp(s, record, NOW)!;
    s = t.state;
    expect(t.finished).toBe('lost');
    expect(s.stats.emoji).toMatchObject({ played: 2, won: 1, currentStreak: 0 });
    expect(t.unlocked).toContain('retreat');
  });

  it('awards Bankai for clearing all four modes in one day', () => {
    let s = initialState();
    for (const mode of ['classic', 'release', 'quote', 'emoji'] as const) s = solve(s, mode, 0);
    expect(s.perfectDays).toEqual([0]);
    expect(s.achievements.bankai).toBeDefined();
  });

  it('tracks revealed hints', () => {
    const s0 = initialState();
    const record = newDailyRecord('classic', 0, NOW);
    const s1 = revealHint(s0, record, 1);
    expect(s1.daily[dailyKey('classic', 0)]?.hints).toEqual([1]);
    expect(revealHint(s1, s1.daily[dailyKey('classic', 0)]!, 1)).toBe(s1);
  });

  it('starts endless games from the chosen pool without repeating the last answer', () => {
    let s = startEndless(initialState(), 'classic', 'filler', mulberry32(1), NOW);
    const first = s.endless.classic!;
    expect(first.pool).toBe('filler');
    s = startEndless(s, 'classic', 'filler', mulberry32(1), NOW);
    expect(s.endless.classic!.answer).not.toBe(first.answer);
    expect(s.counters.endlessStarted).toBe(2);
  });

  it('replays past dailies from the archive without touching streaks', () => {
    let s = solve(initialState(), 'classic', 3);
    const before = s.stats.classic;
    const record = getArchiveRecord(s, 'classic', 1, NOW);
    expect(record.kind).toBe('archive');
    const t = applyGuess(s, record, dailyPuzzle('classic', 1).answer, NOW)!;
    s = t.state;
    expect(t.finished).toBe('won');
    expect(s.stats.classic).toEqual(before);
    expect(s.stats['archive:classic']).toMatchObject({ played: 1, won: 1, currentStreak: 0 });
    expect(s.archive[dailyKey('classic', 1)]?.status).toBe('won');
    expect(s.perfectDays).toEqual([]);
    // A puzzle finished live shows its live result in the archive.
    expect(getArchiveRecord(s, 'classic', 3, NOW).kind).toBe('daily');
  });

  it('summarises where today stands for cards and menus', () => {
    expect(dailyStatus(undefined)).toMatchObject({ tone: 'new', action: 'Play' });
    let s = initialState();
    const record = getDailyRecord(s, 'classic', 0, NOW);
    s = applyGuess(s, record, 'kon', NOW)!.state;
    expect(dailyStatus(s.daily[dailyKey('classic', 0)])).toEqual({
      tone: 'playing',
      label: 'In progress · 1 guess',
      action: 'Continue',
    });
    s = solve(s, 'classic', 0);
    expect(dailyStatus(s.daily[dailyKey('classic', 0)])).toMatchObject({
      tone: 'won',
      label: 'Solved in 2 guesses',
    });
    const lost = giveUp(initialState(), getDailyRecord(initialState(), 'quote', 0, NOW), NOW)!;
    expect(dailyStatus(lost.state.daily[dailyKey('quote', 0)]).tone).toBe('lost');
  });

  it('counts shares', () => {
    const t = recordShare(initialState(), NOW);
    expect(t.state.counters.shares).toBe(1);
    expect(t.unlocked).toContain('hell-butterfly');
  });

  it('hydrates old or broken saves safely', () => {
    expect(hydrate(null)).toEqual(initialState());
    expect(hydrate({ version: 99 })).toEqual(initialState());
    const partial = hydrate({ version: 1, settings: { sound: true } });
    expect(partial.settings.sound).toBe(true);
    expect(partial.settings.theme).toBe('system');
    expect(partial.counters.shares).toBe(0);
  });

  it('prunes ancient daily records', () => {
    let s = solve(initialState(), 'classic', 0);
    s = solve(s, 'classic', 300);
    const pruned = pruneDaily(s, 300);
    expect(Object.keys(pruned.daily)).toEqual([dailyKey('classic', 300)]);
  });

  it('only reports achievements once', () => {
    const s = solve(initialState(), 'classic', 0);
    expect(newlyUnlocked(s)).toEqual([]);
    expect(ACHIEVEMENTS.length).toBe(new Set(ACHIEVEMENTS.map((a) => a.id)).size);
  });
});
