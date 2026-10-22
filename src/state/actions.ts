import { characterById, hasCharacter } from '../data';
import type { ModeId } from '../data/types';
import { newlyUnlocked } from '../game/achievements';
import { dailyPuzzle, randomPuzzle } from '../game/engine';
import {
  dailyKey,
  emptyStats,
  statsKey,
  type GameKind,
  type GameRecord,
  type PersistedState,
  type PoolFilter,
} from './model';

export const DAILY_MODES: readonly ModeId[] = ['classic', 'release', 'quote', 'emoji'];

export interface Transition {
  state: PersistedState;
  /** Achievements unlocked by this transition. */
  unlocked: string[];
  /** The game finished during this transition. */
  finished?: 'won' | 'lost';
}

export function newDailyRecord(mode: ModeId, day: number, now: number): GameRecord {
  const puzzle = dailyPuzzle(mode, day);
  return {
    mode,
    kind: 'daily',
    day,
    answer: puzzle.answer,
    ...(puzzle.clue ? { clue: puzzle.clue } : {}),
    guesses: [],
    status: 'playing',
    hints: [],
    startedAt: now,
  };
}

export function newEndlessRecord(
  mode: ModeId,
  pool: PoolFilter,
  random: () => number,
  now: number,
  avoid?: string,
): GameRecord {
  const puzzle = randomPuzzle(mode, pool, random, avoid);
  return {
    mode,
    kind: 'endless',
    answer: puzzle.answer,
    ...(puzzle.clue ? { clue: puzzle.clue } : {}),
    guesses: [],
    status: 'playing',
    hints: [],
    startedAt: now,
    pool,
  };
}

/** The saved daily record, or a fresh (unsaved) one if the player hasn't started. */
export function getDailyRecord(state: PersistedState, mode: ModeId, day: number, now: number): GameRecord {
  return state.daily[dailyKey(mode, day)] ?? newDailyRecord(mode, day, now);
}

function putRecord(state: PersistedState, record: GameRecord): PersistedState {
  if (record.kind === 'daily') {
    return { ...state, daily: { ...state.daily, [dailyKey(record.mode, record.day!)]: record } };
  }
  return { ...state, endless: { ...state.endless, [record.mode]: record } };
}

function withAchievements(state: PersistedState, now: number): Transition {
  const unlocked = newlyUnlocked(state);
  if (unlocked.length === 0) return { state, unlocked };
  const achievements = { ...state.achievements };
  for (const id of unlocked) achievements[id] = now;
  return { state: { ...state, achievements }, unlocked };
}

function finish(state: PersistedState, record: GameRecord, won: boolean): PersistedState {
  const key = statsKey(record.mode, record.kind);
  const stats = { ...(state.stats[key] ?? emptyStats()) };
  const guesses = record.guesses.length;
  stats.played += 1;
  stats.totalGuesses += guesses;
  stats.hintsUsed += record.hints.length;

  let { collection, perfectDays } = state;
  if (won) {
    stats.won += 1;
    stats.distribution = { ...stats.distribution, [guesses]: (stats.distribution[guesses] ?? 0) + 1 };
    stats.best = Math.min(stats.best ?? Number.POSITIVE_INFINITY, guesses);
    if (record.kind === 'daily') {
      stats.currentStreak = stats.lastWonDay === record.day! - 1 ? stats.currentStreak + 1 : 1;
      stats.lastWonDay = record.day!;
    } else {
      stats.currentStreak += 1;
    }
    stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);

    const previous = collection[record.answer];
    collection = {
      ...collection,
      [record.answer]: {
        first: previous?.first ?? record.endedAt ?? Date.now(),
        count: (previous?.count ?? 0) + 1,
        modes: previous?.modes.includes(record.mode)
          ? previous.modes
          : [...(previous?.modes ?? []), record.mode],
      },
    };
  } else {
    stats.currentStreak = 0;
  }

  let next: PersistedState = { ...state, stats: { ...state.stats, [key]: stats }, collection };
  next = putRecord(next, record);

  if (won && record.kind === 'daily' && !perfectDays.includes(record.day!)) {
    const allWon = DAILY_MODES.every((mode) => next.daily[dailyKey(mode, record.day!)]?.status === 'won');
    if (allWon) perfectDays = [...perfectDays, record.day!];
  }
  return { ...next, perfectDays };
}

export function applyGuess(
  state: PersistedState,
  record: GameRecord,
  guessId: string,
  now: number,
): Transition | null {
  if (record.status !== 'playing') return null;
  if (!hasCharacter(guessId) || record.guesses.includes(guessId)) return null;

  const guesses = [...record.guesses, guessId];
  const won = guessId === record.answer;
  const updated: GameRecord = {
    ...record,
    guesses,
    status: won ? 'won' : 'playing',
    ...(won ? { endedAt: now } : {}),
  };
  let next: PersistedState = {
    ...state,
    counters: { ...state.counters, guesses: state.counters.guesses + 1 },
  };
  next = won ? finish(next, updated, true) : putRecord(next, updated);
  const transition = withAchievements(next, now);
  return won ? { ...transition, finished: 'won' } : transition;
}

export function revealHint(state: PersistedState, record: GameRecord, index: number): PersistedState {
  if (record.status !== 'playing' || record.hints.includes(index)) return state;
  return putRecord(state, { ...record, hints: [...record.hints, index].sort((a, b) => a - b) });
}

export function giveUp(state: PersistedState, record: GameRecord, now: number): Transition | null {
  if (record.status !== 'playing') return null;
  const updated: GameRecord = { ...record, status: 'lost', endedAt: now };
  let next = finish(state, updated, false);
  next = { ...next, counters: { ...next.counters, giveUps: next.counters.giveUps + 1 } };
  return { ...withAchievements(next, now), finished: 'lost' };
}

export function startEndless(
  state: PersistedState,
  mode: ModeId,
  pool: PoolFilter,
  random: () => number,
  now: number,
): PersistedState {
  const current = state.endless[mode];
  const record = newEndlessRecord(mode, pool, random, now, current?.answer);
  const next = putRecord(state, record);
  return { ...next, counters: { ...next.counters, endlessStarted: next.counters.endlessStarted + 1 } };
}

export function recordShare(state: PersistedState, now: number): Transition {
  return withAchievements(
    { ...state, counters: { ...state.counters, shares: state.counters.shares + 1 } },
    now,
  );
}

/** Streak as the player should see it today (a missed day breaks it). */
export function displayStreak(state: PersistedState, mode: ModeId, today: number): number {
  const stats = state.stats[mode];
  if (!stats || stats.lastWonDay === undefined) return 0;
  return stats.lastWonDay >= today - 1 ? stats.currentStreak : 0;
}

export function answerCharacter(record: GameRecord) {
  return characterById(record.answer);
}

export type { GameKind };
