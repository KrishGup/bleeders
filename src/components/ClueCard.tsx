import { useEffect, useRef, type CSSProperties } from 'react';
import { modeInfo } from '../data/taxonomy';
import type { ModeId, ReleaseKind } from '../data/types';
import type { Clue } from '../game/engine';
import { sfx } from '../lib/sound';
import { Icon } from './Icon';

interface ClueCardProps {
  mode: Exclude<ModeId, 'classic'>;
  clues: Clue[];
  misses: number;
  finished: boolean;
  releaseKind?: ReleaseKind;
}

const KIND_KANJI: Record<ReleaseKind, string> = {
  Shikai: '始解',
  Bankai: '卍解',
  Resurrección: '帰刃',
  Schrift: '聖文字',
  Fullbring: '完現術',
  'Bount Doll': '人形',
  Power: '力',
};

function useUnlockSound(count: number) {
  const previous = useRef(count);
  useEffect(() => {
    if (count > previous.current) sfx.clue();
    previous.current = count;
  }, [count]);
}

function LockedStep({ clue, misses }: { clue: Clue; misses: number }) {
  const remaining = clue.at - misses;
  return (
    <li className="clue-step is-locked">
      <span className="clue-step__label">{clue.label}</span>
      <span className="clue-step__lock">
        <Icon name="lock" size={14} />
        Unlocks in {remaining} {remaining === 1 ? 'guess' : 'guesses'}
      </span>
    </li>
  );
}

export function ClueCard({ mode, clues, misses, finished, releaseKind }: ClueCardProps) {
  const info = modeInfo(mode);
  const isOpen = (clue: Clue) => finished || misses >= clue.at;
  const unlocked = clues.filter(isOpen).length;
  useUnlockSound(unlocked);

  if (mode === 'emoji') {
    const emoji = clues.filter((c) => c.tone === 'emoji');
    const extra = clues.filter((c) => c.tone !== 'emoji');
    return (
      <section className="clue-card clue-card--emoji" aria-label="Emoji clues">
        <header className="clue-card__head">
          <span className="kanji clue-card__kanji">{info.kanji}</span>
          <span className="clue-card__title">Which soul do these emoji describe?</span>
        </header>
        <ol className="emoji-row">
          {emoji.map((clue, i) => {
            const open = isOpen(clue);
            return (
              <li
                key={clue.label}
                className={`emoji-slot${open ? ' is-open' : ''}`}
                style={{ '--i': i } as CSSProperties}
              >
                {open ? (
                  <span className="emoji emoji-slot__glyph" role="img" aria-label={`Emoji ${i + 1}`}>
                    {clue.text}
                  </span>
                ) : (
                  <span
                    className="emoji-slot__seal kanji"
                    aria-label={`Emoji ${i + 1}: unlocks after ${clue.at} misses`}
                  >
                    封
                  </span>
                )}
              </li>
            );
          })}
        </ol>
        <ul className="clue-steps">
          {extra.map((clue) =>
            isOpen(clue) ? (
              <li key={clue.label} className="clue-step is-open">
                <span className="clue-step__label">{clue.label}</span>
                <span className={`clue-step__text${clue.tone === 'name' ? ' is-name' : ''}`}>
                  {clue.text}
                </span>
              </li>
            ) : (
              <LockedStep key={clue.label} clue={clue} misses={misses} />
            ),
          )}
        </ul>
      </section>
    );
  }

  const [opener, ...rest] = clues;
  if (!opener) return null;

  return (
    <section className={`clue-card clue-card--${mode}`} aria-label={`${info.title} clues`}>
      <header className="clue-card__head">
        <span className="kanji clue-card__kanji">{releaseKind ? KIND_KANJI[releaseKind] : info.kanji}</span>
        <span className="clue-card__title">{mode === 'quote' ? 'Who said it?' : 'Whose power is this?'}</span>
        {releaseKind ? <span className="chip chip--accent">{releaseKind}</span> : null}
      </header>

      <div className={`clue-card__main clue-card__main--${opener.tone ?? 'plain'}`}>
        {mode === 'quote' ? (
          <span className="clue-card__quote-mark" aria-hidden="true">
            “
          </span>
        ) : null}
        <p className="clue-card__opener">
          <span className="clue-card__opener-label">{opener.label}</span>
          {opener.text}
        </p>
      </div>

      <ul className="clue-steps">
        {rest.map((clue) =>
          isOpen(clue) ? (
            <li key={clue.label} className="clue-step is-open">
              <span className="clue-step__label">{clue.label}</span>
              <span className={`clue-step__text${clue.tone === 'name' ? ' is-name' : ''}`}>{clue.text}</span>
            </li>
          ) : (
            <LockedStep key={clue.label} clue={clue} misses={misses} />
          ),
        )}
      </ul>
    </section>
  );
}
