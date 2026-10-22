import { useCallback, useEffect, useMemo } from 'react';
import { characterById } from '../data';
import type { Character, ModeId } from '../data/types';
import { achievementById } from '../game/achievements';
import { classicHints, cluesFor, modeRoster, type ClassicHint, type Clue } from '../game/engine';
import { mulberry32, randomSeed } from '../lib/hash';
import { sfx } from '../lib/sound';
import {
  applyGuess,
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

function currentRecord(mode: ModeId, kind: GameKind, today: number): GameRecord | undefined {
  const s = store.get();
  return kind === 'daily' ? getDailyRecord(s, mode, today, Date.now()) : s.endless[mode];
}

export function useGame(mode: ModeId, kind: GameKind): GameView {
  const today = useToday();
  const saved = useStore((s) => (kind === 'daily' ? s.daily[dailyKey(mode, today)] : s.endless[mode]));

  const record = useMemo<GameRecord | null>(() => {
    if (saved) return saved;
    // Not saved until the first guess; `startedAt` is filled in then.
    return kind === 'daily' ? newDailyRecord(mode, today, 0) : null;
  }, [saved, kind, mode, today]);

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
        const current = kind === 'daily' ? getDailyRecord(s, mode, today, Date.now()) : s.endless[mode];
        if (!current) return s;
        box.result = applyGuess(s, current, id, Date.now());
        return box.result ? box.result.state : s;
      });
      if (box.result) announceUnlocks(box.result.unlocked, mode === 'classic' ? 2400 : 1200);
      return box.result;
    },
    [kind, mode, today],
  );

  const revealHint = useCallback(
    (index: number) => {
      const current = currentRecord(mode, kind, today);
      if (!current) return;
      store.update((s) => revealHintAction(s, current, index));
      sfx.clue();
    },
    [mode, kind, today],
  );

  const giveUp = useCallback(() => {
    const current = currentRecord(mode, kind, today);
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
  }, [mode, kind, today]);

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
