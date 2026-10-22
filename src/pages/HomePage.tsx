import { CHARACTERS } from '../data';
import { MODES } from '../data/taxonomy';
import type { ModeId } from '../data/types';
import { ACHIEVEMENTS } from '../game/achievements';
import { useToday } from '../hooks/useToday';
import { formatDay, puzzleNumber } from '../lib/date';
import { displayStreak } from '../state/actions';
import { dailyKey, type GameRecord } from '../state/model';
import { useStore } from '../state/store';
import { ui } from '../state/ui';
import { Countdown } from '../components/Countdown';
import { Icon } from '../components/Icon';
import { Logo } from '../components/Logo';

function statusOf(record: GameRecord | undefined) {
  if (!record || record.guesses.length === 0) return { label: 'New soul awaits', tone: 'new' as const };
  if (record.status === 'won') {
    const n = record.guesses.length;
    return { label: `Solved in ${n} ${n === 1 ? 'guess' : 'guesses'}`, tone: 'won' as const };
  }
  if (record.status === 'lost') return { label: 'Retreated', tone: 'lost' as const };
  const n = record.guesses.length;
  return { label: `In progress · ${n} ${n === 1 ? 'guess' : 'guesses'}`, tone: 'playing' as const };
}

const MODE_ART: Record<ModeId, string> = {
  classic: 'Gender · Race · Rank · Insignia · Hair · Debut',
  release: '“Scatter, ████████!”',
  quote: '“Since when were you under the impression…”',
  emoji: '🍓 🌙 💀 ❓ ❓',
};

export function HomePage() {
  const today = useToday();
  const state = useStore((s) => s);
  const solvedToday = MODES.filter((m) => state.daily[dailyKey(m.id, today)]?.status === 'won').length;
  const collected = Object.keys(state.collection).length;
  const unlocked = Object.keys(state.achievements).length;

  return (
    <div className="home">
      <section className="hero">
        <Logo size="lg" animate />
        <p className="hero__tagline">The daily Bleach character guessing game.</p>
        <p className="hero__meta">
          <span className="chip chip--accent">
            <Icon name="calendar" size={14} /> Bleedle #{puzzleNumber(today)} · {formatDay(today)}
          </span>
          <Countdown />
        </p>
      </section>

      <section className="bankai-meter" aria-label="Today's progress">
        <div className="bankai-meter__dots">
          {MODES.map((m) => {
            const won = state.daily[dailyKey(m.id, today)]?.status === 'won';
            return (
              <span
                key={m.id}
                className={`bankai-meter__dot${won ? ' is-won' : ''}`}
                data-mode={m.id}
                title={m.title}
              >
                <span className="kanji">{m.kanji}</span>
              </span>
            );
          })}
        </div>
        <p className="bankai-meter__text">
          {solvedToday === 4 ? (
            <>
              <span className="kanji">卍解</span> Bankai achieved — all four souls found today!
            </>
          ) : (
            <>
              {solvedToday} of 4 souls found today
              <span className="faint"> · find all four to achieve Bankai</span>
            </>
          )}
        </p>
      </section>

      <section className="mode-grid" aria-label="Game modes">
        {MODES.map((m) => {
          const record = state.daily[dailyKey(m.id, today)];
          const status = statusOf(record);
          const streak = displayStreak(state, m.id, today);
          return (
            <a key={m.id} href={`#/${m.id}`} className={`mode-card is-${status.tone}`} data-mode={m.id}>
              <span className="mode-card__kanji kanji" aria-hidden="true">
                {m.kanji}
              </span>
              <span className="mode-card__body">
                <span className="mode-card__top">
                  <span className="mode-card__title">{m.title}</span>
                  {streak > 0 ? (
                    <span className="chip chip--gold" title="Daily streak">
                      <Icon name="flame" size={13} /> {streak}
                    </span>
                  ) : null}
                </span>
                <span className="mode-card__reading">{m.reading}</span>
                <span className="mode-card__tagline">{m.tagline}</span>
                <span className="mode-card__art" aria-hidden="true">
                  {MODE_ART[m.id]}
                </span>
                <span className="mode-card__foot">
                  <span className={`mode-card__status mode-card__status--${status.tone}`}>
                    {status.tone === 'won' ? <Icon name="check" size={14} strokeWidth={3} /> : null}
                    {status.label}
                  </span>
                  <span className="mode-card__go" aria-hidden="true">
                    <Icon name="next" size={18} />
                  </span>
                </span>
              </span>
            </a>
          );
        })}
      </section>

      <section className="extras" aria-label="More">
        <a href="#/classic/endless" className="extra-card">
          <span className="extra-card__kanji kanji">修行</span>
          <span className="extra-card__text">
            <span className="extra-card__title">Endless training</span>
            <span className="extra-card__sub">
              Unlimited souls in every mode. Filter by canon, filler or main cast.
            </span>
          </span>
          <Icon name="infinity" />
        </a>
        <a href="#/classic/archive" className="extra-card">
          <span className="extra-card__kanji kanji">暦</span>
          <span className="extra-card__text">
            <span className="extra-card__title">Puzzle archive</span>
            <span className="extra-card__sub">
              {today === 0
                ? 'Missed a day? Past puzzles land here from tomorrow.'
                : `Replay ${today} past ${today === 1 ? 'puzzle' : 'puzzles'} per mode — your streak stays safe.`}
            </span>
          </span>
          <Icon name="calendar" />
        </a>
        <a href="#/registry" className="extra-card">
          <span className="extra-card__kanji kanji">名簿</span>
          <span className="extra-card__text">
            <span className="extra-card__title">Soul Registry</span>
            <span className="extra-card__sub">
              {collected} / {CHARACTERS.length} souls collected — every character, filler included.
            </span>
          </span>
          <Icon name="book" />
        </a>
        <a href="#/achievements" className="extra-card">
          <span className="extra-card__kanji kanji">勲章</span>
          <span className="extra-card__text">
            <span className="extra-card__title">Achievements</span>
            <span className="extra-card__sub">
              {unlocked} / {ACHIEVEMENTS.length} unlocked — from Shunpo to Soul King.
            </span>
          </span>
          <Icon name="trophy" />
        </a>
      </section>

      <section className="how" aria-label="How to play">
        <h2 className="section-title">
          <span className="kanji">道</span> How it works
        </h2>
        <ol className="how__steps">
          <li>
            <span className="how__num">1</span>
            <span>
              <strong>Guess any character.</strong> Every guess reveals clues: matching attributes, clue
              lines, or a new emoji.
            </span>
          </li>
          <li>
            <span className="how__num">2</span>
            <span>
              <strong>Read the colours.</strong> <span className="how__swatch is-correct" /> exact,{' '}
              <span className="how__swatch is-partial" /> partial, <span className="how__swatch is-wrong" />{' '}
              wrong — arrows point toward the answer.
            </span>
          </li>
          <li>
            <span className="how__num">3</span>
            <span>
              <strong>Unlimited guesses.</strong> New souls arrive every midnight, the same for everyone. Keep
              your streak alive!
            </span>
          </li>
        </ol>
        <button type="button" className="btn" onClick={() => ui.open('help', 'classic')}>
          <Icon name="help" size={18} /> Full rules
        </button>
      </section>
    </div>
  );
}
