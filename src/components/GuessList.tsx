import { useEffect, useRef, useState } from 'react';
import type { Character } from '../data/types';
import { sfx } from '../lib/sound';
import { useSettings } from '../state/store';
import { Avatar } from './Avatar';
import { FillerBadge } from './FillerBadge';
import { Icon } from './Icon';

/** Guess history for the clue-based modes: newest first, red until it's right. */
export function GuessList({ guesses, answerId }: { guesses: readonly Character[]; answerId: string }) {
  const settings = useSettings();
  const previous = useRef(guesses.length);
  const [freshId, setFreshId] = useState<string | null>(null);

  useEffect(() => {
    if (guesses.length > previous.current) {
      const newest = guesses[guesses.length - 1]!;
      setFreshId(newest.id);
      if (newest.id !== answerId) sfx.miss();
    }
    previous.current = guesses.length;
  }, [guesses, answerId]);

  if (guesses.length === 0) return null;

  return (
    <ol className="guess-list" aria-label="Your guesses" reversed>
      {[...guesses].reverse().map((guess) => {
        const correct = guess.id === answerId;
        return (
          <li
            key={guess.id}
            className={`guess-list__item${correct ? ' is-correct' : ''}${guess.id === freshId ? ' is-fresh' : ''}`}
          >
            <Avatar character={guess} size={36} />
            <span className="guess-list__name">{guess.name}</span>
            {settings.fillerBadges ? <FillerBadge character={guess} /> : null}
            <span className="guess-list__mark" aria-label={correct ? 'Correct' : 'Wrong'}>
              <Icon name={correct ? 'check' : 'close'} size={18} strokeWidth={3} />
            </span>
          </li>
        );
      })}
    </ol>
  );
}
