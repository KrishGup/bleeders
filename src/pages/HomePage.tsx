import { useMemo } from 'react';
import { characterById, CHARACTERS } from '../data';
import { MODES, modeInfo, type ModeInfo } from '../data/taxonomy';
import { ACHIEVEMENTS } from '../game/achievements';
import { useToday } from '../hooks/useToday';
import { ATTRIBUTES, compareCharacters, type Arrow, type Verdict } from '../lib/compare';
import { formatDay, puzzleNumber } from '../lib/date';
import { displayStreak } from '../state/actions';
import { dailyKey, type GameRecord, type PersistedState } from '../state/model';
import { dailyStatus } from '../state/status';
import { useStore } from '../state/store';
import { ui } from '../state/ui';
import { Countdown } from '../components/Countdown';
import { Icon } from '../components/Icon';
import { Logo } from '../components/Logo';

interface MiniTile {
  verdict: Verdict;
  arrow?: Arrow | undefined;
}

/** How a Classic row reads, shown before the first guess of the day. */
const SAMPLE_ROW: MiniTile[] = [
  { verdict: 'correct' },
  { verdict: 'correct' },
  { verdict: 'partial' },
  { verdict: 'wrong' },
  { verdict: 'wrong', arrow: 'up' },
  { verdict: 'correct' },
  { verdict: 'wrong', arrow: 'down' },
];

const MAX_ROWS = 4;

/** Today's Classic guesses as spoiler-free colour rows, oldest first (like a share grid). */
function boardRows(record: GameRecord | undefined): MiniTile[][] {
  if (!record || record.guesses.length === 0) return [];
  const answer = characterById(record.answer);
  return record.guesses.slice(-MAX_ROWS).map((id) =>
    compareCharacters(characterById(id), answer).map((cell) => ({
      verdict: cell.verdict,
      arrow: cell.arrow,
    })),
  );
}

function ClassicFeature({ state, today }: { state: PersistedState; today: number }) {
  const info = modeInfo('classic');
  const record = state.daily[dailyKey('classic', today)];
  const status = dailyStatus(record);
  const streak = displayStreak(state, 'classic', today);
  const rows = useMemo(() => boardRows(record), [record]);
  const hidden = (record?.guesses.length ?? 0) - rows.length;
  const cta = status.tone === 'new' ? `Play Bleedle #${puzzleNumber(today)}` : status.action;

  return (
    <a href="#/classic" className={`feature is-${status.tone}`} data-mode="classic">
      <span className="feature__head">
        <span className="feature__kanji kanji" aria-hidden="true">
          {info.kanji}
        </span>
        <span className="feature__titles">
          <span className="feature__eyebrow">Today’s soul · Bleedle #{puzzleNumber(today)}</span>
          <span className="feature__title">{info.title}</span>
          <span className="feature__tagline">{info.tagline}</span>
        </span>
        {streak > 0 ? (
          <span className="chip chip--gold feature__streak" title="Daily streak">
            <Icon name="flame" size={13} /> {streak} day{streak === 1 ? '' : 's'}
          </span>
        ) : null}
      </span>

      <span className={`feature__board${rows.length ? '' : ' is-sample'}`} aria-hidden="true">
        {hidden > 0 ? (
          <span className="feature__more">
            ⋯ {hidden} earlier {hidden === 1 ? 'guess' : 'guesses'}
          </span>
        ) : null}
        {(rows.length ? rows : [SAMPLE_ROW]).map((row, r) => (
          <span key={r} className="feature__row">
            {row.map((tile, i) => (
              <span key={ATTRIBUTES[i]!.key} className={`feature__tile is-${tile.verdict}`}>
                {rows.length ? null : <span className="feature__tile-label">{ATTRIBUTES[i]!.label}</span>}
                {tile.arrow ? <Icon name={tile.arrow} size={15} strokeWidth={3} /> : null}
              </span>
            ))}
          </span>
        ))}
      </span>

      <span className="feature__foot">
        <span className={`feature__status is-${status.tone}`}>
          {status.tone === 'won' ? <Icon name="check" size={15} strokeWidth={3} /> : null}
          {status.label}
        </span>
        <span className="btn btn--primary btn--lg feature__cta">
          {cta} <Icon name="next" size={18} />
        </span>
      </span>
    </a>
  );
}

function BonusCard({ mode, state, today }: { mode: ModeInfo; state: PersistedState; today: number }) {
  const status = dailyStatus(state.daily[dailyKey(mode.id, today)]);
  const streak = displayStreak(state, mode.id, today);
  return (
    <a href={`#/${mode.id}`} className={`bonus-card is-${status.tone}`} data-mode={mode.id}>
      <span className="bonus-card__kanji kanji" aria-hidden="true">
        {mode.kanji}
      </span>
      <span className="bonus-card__text">
        <span className="bonus-card__title">
          {mode.title}
          {streak > 0 ? (
            <span className="chip chip--gold" title="Daily streak">
              <Icon name="flame" size={12} /> {streak}
            </span>
          ) : null}
        </span>
        <span className="bonus-card__tagline">{mode.tagline}</span>
        <span className={`bonus-card__status is-${status.tone}`}>
          {status.tone === 'won' ? <Icon name="check" size={13} strokeWidth={3} /> : null}
          {status.label}
        </span>
      </span>
      <Icon name="next" size={18} className="bonus-card__go" />
    </a>
  );
}

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

      <ClassicFeature state={state} today={today} />

      <section className="bonus" aria-labelledby="bonus-title">
        <div className="bonus__head">
          <h2 id="bonus-title" className="section-title">
            <span className="kanji">外伝</span> Bonus modes
          </h2>
          <p className="bonus__sub">Three quick side puzzles, new every day.</p>
        </div>
        <div className="bonus__grid">
          {MODES.filter((m) => m.id !== 'classic').map((m) => (
            <BonusCard key={m.id} mode={m} state={state} today={today} />
          ))}
        </div>
        <div className="bankai-meter" aria-label="Today's progress">
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
                {solvedToday} of 4 found today
                <span className="faint"> · clear Classic and every bonus mode for Bankai</span>
              </>
            )}
          </p>
        </div>
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
          <span className="kanji">道</span> How Classic works
        </h2>
        <ol className="how__steps">
          <li>
            <span className="how__num">1</span>
            <span>
              <strong>Guess any character.</strong> Each guess fills a row of seven tiles: gender, race,
              affiliation, rank, insignia, hair and debut arc.
            </span>
          </li>
          <li>
            <span className="how__num">2</span>
            <span>
              <strong>Read the colours.</strong> <span className="how__swatch is-correct" /> exact,{' '}
              <span className="how__swatch is-partial" /> partial, <span className="how__swatch is-wrong" />{' '}
              wrong — arrows point toward the answer’s insignia number or debut arc.
            </span>
          </li>
          <li>
            <span className="how__num">3</span>
            <span>
              <strong>Unlimited guesses.</strong> A new soul arrives every midnight, the same for everyone.
              Keep your streak alive!
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
