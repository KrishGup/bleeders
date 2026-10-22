import { characterById, hasCharacter } from '../data';
import type { ModeId } from '../data/types';
import type { PersistedState } from '../state/model';

export interface Achievement {
  id: string;
  name: string;
  kanji: string;
  description: string;
  /** Hidden until unlocked. */
  secret?: boolean;
  progress: (state: PersistedState) => { value: number; goal: number };
}

const DAILY_MODES: ModeId[] = ['classic', 'release', 'quote', 'emoji'];

function sum(state: PersistedState, pick: (key: string) => boolean, field: 'won' | 'played'): number {
  return Object.entries(state.stats)
    .filter(([key]) => pick(key))
    .reduce((total, [, stats]) => total + stats[field], 0);
}

const isDaily = (key: string) => !key.startsWith('endless:');
const isEndless = (key: string) => key.startsWith('endless:');
const any = () => true;

function bestStreak(state: PersistedState): number {
  return Math.max(0, ...DAILY_MODES.map((mode) => state.stats[mode]?.maxStreak ?? 0));
}

function fastestWin(state: PersistedState): number {
  return Math.min(Infinity, ...Object.values(state.stats).map((stats) => stats.best ?? Infinity));
}

function longestWin(state: PersistedState): number {
  const allRecords = [...Object.values(state.daily), ...Object.values(state.endless)];
  return Math.max(
    0,
    ...allRecords.filter((record) => record?.status === 'won').map((record) => record!.guesses.length),
  );
}

function fillerSolved(state: PersistedState): number {
  return Object.keys(state.collection).filter(
    (id) => hasCharacter(id) && characterById(id).origin !== 'canon',
  ).length;
}

function hintlessClassicWins(state: PersistedState): number {
  return Object.values(state.daily).filter(
    (record) => record.mode === 'classic' && record.status === 'won' && record.hints.length === 0,
  ).length;
}

const count = (value: number, goal: number) => ({ value: Math.min(value, goal), goal });

export const ACHIEVEMENTS: readonly Achievement[] = [
  {
    id: 'konso',
    name: 'Konsō',
    kanji: '魂葬',
    description: 'Win your first game. Every soul deserves a proper send-off.',
    progress: (s) => count(sum(s, any, 'won'), 1),
  },
  {
    id: 'shunpo',
    name: 'Shunpo',
    kanji: '瞬歩',
    description: 'Win any game on your very first guess.',
    progress: (s) => count(fastestWin(s) <= 1 ? 1 : 0, 1),
  },
  {
    id: 'bankai',
    name: 'Bankai',
    kanji: '卍解',
    description: 'Win all four daily modes on the same day.',
    progress: (s) => count(s.perfectDays.length, 1),
  },
  {
    id: 'hogyoku',
    name: 'Hōgyoku',
    kanji: '崩玉',
    description: 'Reach a 7-day streak in any daily mode.',
    progress: (s) => count(bestStreak(s), 7),
  },
  {
    id: 'mugetsu',
    name: 'Mugetsu',
    kanji: '無月',
    description: 'Reach a 30-day streak in any daily mode. The final Getsuga Tenshō.',
    progress: (s) => count(bestStreak(s), 30),
  },
  {
    id: 'gotei',
    name: 'Gotei 13',
    kanji: '護廷',
    description: 'Win 13 daily games — one for every division.',
    progress: (s) => count(sum(s, isDaily, 'won'), 13),
  },
  {
    id: 'espada',
    name: 'Las Noches',
    kanji: '十刃',
    description: 'Win 10 daily Classic games — one for every Espada.',
    progress: (s) => count(s.stats.classic?.won ?? 0, 10),
  },
  {
    id: 'schrift',
    name: 'Schrift',
    kanji: '聖文字',
    description: 'Win 26 daily games — one for every letter of the Sternritter.',
    progress: (s) => count(sum(s, isDaily, 'won'), 26),
  },
  {
    id: 'soutaicho',
    name: 'Captain-Commander',
    kanji: '総隊長',
    description: 'Win 100 games in total.',
    progress: (s) => count(sum(s, any, 'won'), 100),
  },
  {
    id: 'kenpachi',
    name: 'Kenpachi',
    kanji: '剣八',
    description: 'Win a game that took 11 or more guesses. The 11th never gives up.',
    progress: (s) => count(longestWin(s) >= 11 ? 1 : 0, 1),
  },
  {
    id: 'filler',
    name: 'Filler Enjoyer',
    kanji: '外伝',
    description: 'Solve an anime-only or film character.',
    progress: (s) => count(fillerSolved(s), 1),
  },
  {
    id: 'bount-hunter',
    name: 'Bount Hunter',
    kanji: '狩人',
    description: 'Solve 10 different anime-only or film characters.',
    progress: (s) => count(fillerSolved(s), 10),
  },
  {
    id: 'registry',
    name: 'Soul Registry',
    kanji: '名簿',
    description: 'Collect 50 different characters.',
    progress: (s) => count(Object.keys(s.collection).length, 50),
  },
  {
    id: 'library',
    name: 'Great Spirit Library',
    kanji: '大霊書回廊',
    description: 'Collect 150 different characters.',
    progress: (s) => count(Object.keys(s.collection).length, 150),
  },
  {
    id: 'unaided',
    name: 'No Mask Needed',
    kanji: '素顔',
    description: 'Win 10 daily Classic games without revealing a hint.',
    progress: (s) => count(hintlessClassicWins(s), 10),
  },
  {
    id: 'kido',
    name: 'Kidō Corps',
    kanji: '鬼道',
    description: 'Win 5 daily Release games.',
    progress: (s) => count(s.stats.release?.won ?? 0, 5),
  },
  {
    id: 'kotodama',
    name: 'Kotodama',
    kanji: '言霊',
    description: 'Win 5 daily Quote games.',
    progress: (s) => count(s.stats.quote?.won ?? 0, 5),
  },
  {
    id: 'chappy',
    name: 'Chappy Approved',
    kanji: '絵心',
    description: 'Win 5 daily Emoji games. Rukia would be proud of your art appreciation.',
    progress: (s) => count(s.stats.emoji?.won ?? 0, 5),
  },
  {
    id: 'shattered-shaft',
    name: 'Shattered Shaft',
    kanji: '修行',
    description: 'Win 10 Endless games in the training grounds.',
    progress: (s) => count(sum(s, isEndless, 'won'), 10),
  },
  {
    id: 'senbonzakura',
    name: 'Senbonzakura',
    kanji: '千本桜',
    description: 'Make 1,000 guesses. A thousand cherry blossoms, scattered.',
    progress: (s) => count(s.counters.guesses, 1000),
  },
  {
    id: 'hell-butterfly',
    name: 'Hell Butterfly',
    kanji: '地獄蝶',
    description: 'Send word to Soul Society: share a result.',
    progress: (s) => count(s.counters.shares, 1),
  },
  {
    id: 'retreat',
    name: 'Tactical Retreat',
    kanji: '撤退',
    description: 'Give up on a game. Even Urahara runs sometimes.',
    secret: true,
    progress: (s) => count(s.counters.giveUps, 1),
  },
  {
    id: 'soul-king',
    name: 'Soul King',
    kanji: '霊王',
    description: 'Unlock every other achievement.',
    progress: (s) =>
      count(Object.keys(s.achievements).filter((id) => id !== 'soul-king').length, ACHIEVEMENTS.length - 1),
  },
];

export function achievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

/** Returns ids that are newly unlocked in `state` (not yet recorded). */
export function newlyUnlocked(state: PersistedState): string[] {
  const unlocked: string[] = [];
  // Two passes so "Soul King" can see achievements unlocked in the first pass.
  let working = state.achievements;
  for (let pass = 0; pass < 2; pass++) {
    for (const achievement of ACHIEVEMENTS) {
      if (working[achievement.id] !== undefined) continue;
      const { value, goal } = achievement.progress({ ...state, achievements: working });
      if (value >= goal) {
        unlocked.push(achievement.id);
        working = { ...working, [achievement.id]: Date.now() };
      }
    }
  }
  return unlocked;
}
