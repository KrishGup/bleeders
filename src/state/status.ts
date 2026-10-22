import type { GameRecord } from './model';

export type DailyTone = 'new' | 'playing' | 'won' | 'lost';

export interface DailyStatus {
  tone: DailyTone;
  /** e.g. "Solved in 3 guesses" — for cards. */
  label: string;
  /** e.g. "Continue" — for call-to-action buttons. */
  action: string;
}

/** Where today's puzzle stands for one mode. */
export function dailyStatus(record: GameRecord | undefined): DailyStatus {
  const n = record?.guesses.length ?? 0;
  const guesses = `${n} ${n === 1 ? 'guess' : 'guesses'}`;
  if (record?.status === 'won') return { tone: 'won', label: `Solved in ${guesses}`, action: 'See result' };
  if (record?.status === 'lost') return { tone: 'lost', label: 'Retreated', action: 'See answer' };
  if (n === 0) return { tone: 'new', label: 'New soul awaits', action: 'Play' };
  return { tone: 'playing', label: `In progress · ${guesses}`, action: 'Continue' };
}
