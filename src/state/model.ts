import type { ModeId } from '../data/types';

export type GameKind = 'daily' | 'endless';
export type GameStatus = 'playing' | 'won' | 'lost';

/** Which characters Endless mode may pick from. */
export type PoolFilter = 'all' | 'main' | 'canon' | 'filler';

export interface GameRecord {
  mode: ModeId;
  kind: GameKind;
  /** Daily puzzles only. */
  day?: number;
  /** Character id of the answer — locked in when the game starts. */
  answer: string;
  /** Release/Quote/Emoji entry id, when the mode has one. */
  clue?: string;
  guesses: string[];
  status: GameStatus;
  /** Indexes of manually revealed hints (Classic). */
  hints: number[];
  startedAt: number;
  endedAt?: number;
  pool?: PoolFilter;
}

export interface ModeStats {
  played: number;
  won: number;
  currentStreak: number;
  maxStreak: number;
  /** Daily: day index of the last win (for streak continuity). */
  lastWonDay?: number;
  /** guesses-to-win → count */
  distribution: Record<string, number>;
  totalGuesses: number;
  hintsUsed: number;
  /** Fewest guesses for a win. */
  best?: number;
}

export type ColorMode = 'default' | 'colorblind';
export type MotionMode = 'system' | 'reduced' | 'full';
export type ThemeMode = 'system' | 'dark' | 'light';

export interface Settings {
  theme: ThemeMode;
  colors: ColorMode;
  motion: MotionMode;
  sound: boolean;
  /** Show the ANIME-ONLY / FILM badge on filler characters. */
  fillerBadges: boolean;
  /** Hide the "unlock in N" hint buttons until earned. */
  hardMode: boolean;
  /** Default pool for new Endless games. */
  endlessPool: PoolFilter;
}

export interface CollectionEntry {
  /** First time the character was solved (epoch ms). */
  first: number;
  count: number;
  modes: ModeId[];
}

export interface Counters {
  shares: number;
  guesses: number;
  giveUps: number;
  endlessStarted: number;
  archiveOpens: number;
}

export interface PersistedState {
  version: 1;
  settings: Settings;
  /** Daily games keyed by `${mode}:${day}`. */
  daily: Record<string, GameRecord>;
  /** The in-progress (or last finished) Endless game per mode. */
  endless: Partial<Record<ModeId, GameRecord>>;
  stats: Record<string, ModeStats>;
  collection: Record<string, CollectionEntry>;
  /** Achievement id → unlock time. */
  achievements: Record<string, number>;
  counters: Counters;
  seenIntro: boolean;
  /** Days on which all four daily modes were won (for "Bankai"). */
  perfectDays: number[];
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  colors: 'default',
  motion: 'system',
  sound: false,
  fillerBadges: true,
  hardMode: false,
  endlessPool: 'all',
};

export function emptyStats(): ModeStats {
  return { played: 0, won: 0, currentStreak: 0, maxStreak: 0, distribution: {}, totalGuesses: 0, hintsUsed: 0 };
}

export function initialState(): PersistedState {
  return {
    version: 1,
    settings: { ...DEFAULT_SETTINGS },
    daily: {},
    endless: {},
    stats: {},
    collection: {},
    achievements: {},
    counters: { shares: 0, guesses: 0, giveUps: 0, endlessStarted: 0, archiveOpens: 0 },
    seenIntro: false,
    perfectDays: [],
  };
}

export function dailyKey(mode: ModeId, day: number): string {
  return `${mode}:${day}`;
}

export function statsKey(mode: ModeId, kind: GameKind): string {
  return kind === 'daily' ? mode : `endless:${mode}`;
}

/** Merge whatever was saved with current defaults so new fields always exist. */
export function hydrate(saved: unknown): PersistedState {
  const base = initialState();
  if (!saved || typeof saved !== 'object') return base;
  const s = saved as Partial<PersistedState>;
  if (s.version !== 1) return base;
  return {
    ...base,
    ...s,
    settings: { ...base.settings, ...s.settings },
    counters: { ...base.counters, ...s.counters },
    daily: s.daily ?? {},
    endless: s.endless ?? {},
    stats: s.stats ?? {},
    collection: s.collection ?? {},
    achievements: s.achievements ?? {},
    perfectDays: s.perfectDays ?? [],
  };
}

/** Keep save files small: drop daily games older than `keepDays`. */
export function pruneDaily(state: PersistedState, today: number, keepDays = 120): PersistedState {
  const daily: Record<string, GameRecord> = {};
  for (const [key, record] of Object.entries(state.daily)) {
    if (record.day === undefined || today - record.day <= keepDays) daily[key] = record;
  }
  return { ...state, daily };
}
