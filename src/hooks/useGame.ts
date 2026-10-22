import { useCallback, useEffect, useMemo } from 'react';
import { characterById } from '../data';
import type { Character, ModeId } from '../data/types';
import { achievementById } from '../game/achievements';
import { classicHints, cluesFor, modeRoster, type ClassicHint, type Clue } from '../game/engine';
import { mulberry32, randomSeed } from '../lib/hash';
import { sfx } from '../lib/sound';
import {
  applyGuess,
  getArchiveRecord,
  getDailyRecord,
  giveUp as giveUpAction,
  newDailyRecord,
  revealHint as revealHintAction,
  startEndless,
  type Transition,
} from '../state/actions';
import { dailyKey, type GameKind, type GameRecord, type PoolFilter } from '../state/model';
import { store, useStore } from '../state/store';
import { ui } from '../state/ui';
import { useToday } from './useToday';

export interface GameView {
  mode: ModeId;
  kind: GameKind;
  today: number;
  /** The puzzle's day (today for Daily/Endless, the chosen day in the archive). */
  day: number;
  record: GameRecord | null;
  answer: Character | null;
  guesses: Character[];
  misses: number;
  status: GameRecord['status'];
  clues: Clue[];
  hints: ClassicHint[];
  roster: Character[];
  guess: (id: string) => Transition | null;
  revealHint: (index: number) => void;
  giveUp: () => void;
  newEndless: (pool?: PoolFilter) => void;
}

/** Announce achievements a little after the result so they don't collide with the reveal. */
export function announceUnlocks(ids: string[], delay = 0): void {
  ids.forEach((id, i) => {
    const achievement = achievementById(id);
    if (!achievement) return;
    window.setTimeout(
      () => {
        sfx.unlock();
        ui.toast(
          achievement.description,
          'achievement',
          { title: achievement.name, kanji: achievement.kanji },
          5200,
        );
      },
      delay + i * 900,
    );
  });
}

function recordFrom(
  s: ReturnType<typeof store.get>,
  mode: ModeId,
  kind: GameKind,
  day: number,
): GameRecord | undefined {
  if (kind === 'daily') return getDailyRecord(s, mode, day, Date.now());
  if (kind === 'archive') return getArchiveRecord(s, mode, day, Date.now());
  return s.endless[mode];
}

export function useGame(mode: ModeId, kind: GameKind, archiveDay = 0): GameView {
  const today = useToday();
  const day = kind === 'archive' ? archiveDay : today;
  const saved = useStore((s) => {
    const key = dailyKey(mode, day);
    if (kind === 'daily') return s.daily[key];
    if (kind === 'archive')
      return s.daily[key]?.status !== 'playing' && s.daily[key] ? s.daily[key] : s.archive[key];
    return s.endless[mode];
  });

  const record = useMemo<GameRecord | null>(() => {
    if (saved) return saved;
    // Not saved until the first guess; `startedAt` is filled in then.
    if (kind === 'endless') return null;
    return newDailyRecord(mode, day, 0, kind);
  }, [saved, kind, mode, day]);

  // Endless games start themselves the first time the page opens.
  useEffect(() => {
    if (kind === 'endless' && !store.get().endless[mode]) {
      store.update((s) =>
        startEndless(s, mode, s.settings.endlessPool, mulberry32(randomSeed()), Date.now()),
      );
    }
  }, [kind, mode]);

  const answer = record ? characterById(record.answer) : null;
  const guesses = useMemo(() => (record ? record.guesses.map(characterById) : []), [record]);
  const status = record?.status ?? 'playing';
  const misses = record ? record.guesses.length - (status === 'won' ? 1 : 0) : 0;
  const roster = useMemo(() => modeRoster(mode), [mode]);

  const clues = useMemo(() => {
    if (!record || !answer || mode === 'classic' || !record.clue) return [];
    return cluesFor(mode, record.clue, answer);
  }, [record, answer, mode]);

  const hints = useMemo(() => (answer && mode === 'classic' ? classicHints(answer) : []), [answer, mode]);

  const guess = useCallback(
    (id: string) => {
      const box: { result: Transition | null } = { result: null };
      store.update((s) => {
        const current = recordFrom(s, mode, kind, day);
        if (!current) return s;
        box.result = applyGuess(s, current, id, Date.now());
        return box.result ? box.result.state : s;
      });
      if (box.result) announceUnlocks(box.result.unlocked, mode === 'classic' ? 2400 : 1200);
      return box.result;
    },
    [kind, mode, day],
  );

  const revealHint = useCallback(
    (index: number) => {
      const current = recordFrom(store.get(), mode, kind, day);
      if (!current) return;
      store.update((s) => revealHintAction(s, current, index));
      sfx.clue();
    },
    [mode, kind, day],
  );

  const giveUp = useCallback(() => {
    const current = recordFrom(store.get(), mode, kind, day);
    if (!current) return;
    const box: { result: Transition | null } = { result: null };
    store.update((s) => {
      box.result = giveUpAction(s, current, Date.now());
      return box.result ? box.result.state : s;
    });
    if (box.result) {
      sfx.lose();
      announceUnlocks(box.result.unlocked, 800);
    }
  }, [mode, kind, day]);

  const newEndless = useCallback(
    (pool?: PoolFilter) => {
      store.update((s) => {
        const chosen = pool ?? s.endless[mode]?.pool ?? s.settings.endlessPool;
        const next = startEndless(s, mode, chosen, mulberry32(randomSeed()), Date.now());
        return pool ? { ...next, settings: { ...next.settings, endlessPool: pool } } : next;
      });
    },
    [mode],
  );

  return {
    mode,
    kind,
    today,
    day,
    record,
    answer,
    guesses,
    misses,
    status,
    clues,
    hints,
    roster,
    guess,
    revealHint,
    giveUp,
    newEndless,
  };
}
