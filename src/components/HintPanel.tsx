import type { ClassicHint } from '../game/engine';
import { Icon } from './Icon';

interface HintPanelProps {
  hints: ClassicHint[];
  revealed: readonly number[];
  misses: number;
  finished: boolean;
  hardMode: boolean;
  onReveal: (index: number) => void;
}

/** Classic mode's opt-in hints: they unlock after N misses; revealing one is recorded in your share. */
export function HintPanel({ hints, revealed, misses, finished, hardMode, onReveal }: HintPanelProps) {
  return (
    <div className="hints" role="group" aria-label="Hints">
      {hints.map((hint, index) => {
        const isRevealed = revealed.includes(index) || finished;
        const unlocked = misses >= hint.at;
        if (hardMode && !unlocked && !isRevealed) return null;
        return (
          <div
            key={hint.label}
            className={`hint${isRevealed ? ' is-revealed' : unlocked ? ' is-ready' : ''}`}
          >
            {isRevealed ? (
              <>
                <span className="hint__label">
                  <span aria-hidden="true">{hint.icon}</span> {hint.label}
                </span>
                <span className="hint__text">{hint.text}</span>
              </>
            ) : (
              <button
                type="button"
                className="hint__button"
                disabled={!unlocked}
                onClick={() => onReveal(index)}
                aria-label={
                  unlocked
                    ? `Reveal ${hint.label} hint`
                    : `${hint.label} hint unlocks after ${hint.at} guesses`
                }
              >
                <span className="hint__icon" aria-hidden="true">
                  {unlocked ? hint.icon : <Icon name="lock" size={16} />}
                </span>
                <span className="hint__button-text">
                  <span className="hint__button-title">{hint.label}</span>
                  <span className="hint__button-sub">
                    {unlocked
                      ? 'Tap to reveal'
                      : `In ${hint.at - misses} ${hint.at - misses === 1 ? 'guess' : 'guesses'}`}
                  </span>
                </span>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
