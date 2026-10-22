import { arcInfo, insigniaOf, MODES, modeInfo } from '../data/taxonomy';
import type { Character, ModeId } from '../data/types';
import { emojiEntry, quoteEntry, releaseEntry } from '../game/engine';
import { buildShareText } from '../game/share';
import type { GameView } from '../hooks/useGame';
import { announceUnlocks } from '../hooks/useGame';
import { shareText, siteUrl } from '../lib/clipboard';
import { puzzleNumber } from '../lib/date';
import { displayStreak, recordShare } from '../state/actions';
import { dailyKey } from '../state/model';
import { store, useStore } from '../state/store';
import { ui } from '../state/ui';
import { Avatar } from './Avatar';
import { Countdown } from './Countdown';
import { FillerBadge } from './FillerBadge';
import { Icon } from './Icon';

function Reveal({ mode, clueId }: { mode: ModeId; clueId?: string }) {
  if (!clueId) return null;
  if (mode === 'release') {
    const entry = releaseEntry(clueId);
    return (
      <div className="victory__reveal">
        <span className="victory__reveal-kind chip chip--accent">{entry.kind}</span>
        <p className="victory__reveal-title">
          {entry.kind === 'Schrift' ? `“${entry.letter}” — ${entry.name}` : entry.name}
        </p>
        {entry.command ? (
          <p className="victory__reveal-line">
            “{entry.command}, {entry.name}!”
          </p>
        ) : null}
        {entry.meaning ? <p className="victory__reveal-line dim">Meaning: {entry.meaning}</p> : null}
        <p className="victory__reveal-line dim">{entry.ability}</p>
        {entry.extra ? <p className="victory__reveal-line dim">{entry.extra}</p> : null}
      </div>
    );
  }
  if (mode === 'quote') {
    const entry = quoteEntry(clueId);
    return (
      <div className="victory__reveal">
        <p className="victory__reveal-quote">“{entry.text}”</p>
        <p className="victory__reveal-line dim">
          {entry.context} <span className="faint">· {arcInfo(entry.arc).name} arc</span>
        </p>
      </div>
    );
  }
  if (mode === 'emoji') {
    const entry = emojiEntry(clueId);
    return (
      <div className="victory__reveal">
        <p className="victory__reveal-emoji emoji" aria-label="The five emoji">
          {entry.emoji.join(' ')}
        </p>
      </div>
    );
  }
  return null;
}

function Facts({ character }: { character: Character }) {
  const insignia = insigniaOf(character);
  return (
    <dl className="victory__facts">
      <div>
        <dt>Race</dt>
        <dd>{character.race.join(', ')}</dd>
      </div>
      <div>
        <dt>Affiliation</dt>
        <dd>{character.affiliation.join(', ')}</dd>
      </div>
      <div>
        <dt>Rank</dt>
        <dd>{character.rank}</dd>
      </div>
      <div>
        <dt>Insignia</dt>
        <dd>{insignia?.long ?? 'None'}</dd>
      </div>
      <div>
        <dt>Debut</dt>
        <dd>{arcInfo(character.debut).name}</dd>
      </div>
    </dl>
  );
}

export function VictoryPanel({ view, onNextEndless }: { view: GameView; onNextEndless: () => void }) {
  const { record, answer, mode, kind, today } = view;
  const state = useStore((s) => s);
  if (!record || !answer || record.status === 'playing') return null;

  const won = record.status === 'won';
  const streak =
    kind === 'daily'
      ? displayStreak(state, mode, today)
      : (state.stats[`endless:${mode}`]?.currentStreak ?? 0);
  const remaining = MODES.filter(
    (m) =>
      m.id !== mode &&
      state.daily[dailyKey(m.id, today)]?.status !== 'won' &&
      state.daily[dailyKey(m.id, today)]?.status !== 'lost',
  );
  const count = record.guesses.length;

  const onShare = async () => {
    const text = buildShareText(record, {
      colorblind: state.settings.colors === 'colorblind',
      streak,
      url: siteUrl(),
    });
    const outcome = await shareText(text);
    if (outcome === 'copied') ui.toast('Result copied — paste it anywhere!', 'success');
    else if (outcome === 'failed') ui.toast('Couldn’t access the clipboard.', 'error');
    if (outcome === 'copied' || outcome === 'shared') {
      const transition = recordShare(store.get(), Date.now());
      store.set(transition.state);
      announceUnlocks(transition.unlocked, 600);
    }
  };

  return (
    <section className={`victory${won ? ' is-won' : ' is-lost'}`} aria-live="polite" id="victory">
      <div className="victory__banner">
        <span className="kanji victory__kanji">{won ? '見事' : '撤退'}</span>
        <div>
          <p className="victory__eyebrow">
            {kind === 'daily'
              ? `Bleedle #${puzzleNumber(record.day ?? 0)} · ${modeInfo(mode).title}`
              : `Endless · ${modeInfo(mode).title}`}
          </p>
          <h2 className="victory__title">
            {won ? `Soul found in ${count} ${count === 1 ? 'guess' : 'guesses'}!` : 'The soul slipped away…'}
          </h2>
        </div>
      </div>

      <div className="victory__card">
        <Avatar character={answer} size={104} className="victory__avatar" />
        <div className="victory__who">
          <h3 className="victory__name">
            {answer.name} <FillerBadge character={answer} />
          </h3>
          {answer.jp ? <p className="victory__jp">{answer.jp}</p> : null}
          <p className="victory__epithet">{answer.epithet}</p>
          <p className="victory__bio">{answer.bio}</p>
        </div>
      </div>

      <Reveal mode={mode} clueId={record.clue} />
      {mode === 'classic' ? <Facts character={answer} /> : null}

      <div className="victory__stats">
        <span className="chip">
          <Icon name="sword" size={14} /> {count} {count === 1 ? 'guess' : 'guesses'}
        </span>
        {mode === 'classic' ? (
          <span className="chip">
            <Icon name="hint" size={14} /> {record.hints.length}{' '}
            {record.hints.length === 1 ? 'hint' : 'hints'}
          </span>
        ) : null}
        <span className={`chip${streak > 0 ? ' chip--gold' : ''}`}>
          <Icon name="flame" size={14} /> {streak} {kind === 'daily' ? 'day streak' : 'in a row'}
        </span>
      </div>

      <div className="victory__actions">
        <button type="button" className="btn btn--primary btn--lg" onClick={onShare}>
          <Icon name="share" size={18} /> Share result
        </button>
        {kind === 'endless' ? (
          <button type="button" className="btn btn--lg" onClick={onNextEndless}>
            <Icon name="refresh" size={18} /> Next soul
          </button>
        ) : null}
        <a className="btn btn--lg" href={`#/registry/${answer.id}`}>
          <Icon name="book" size={18} /> Registry entry
        </a>
      </div>

      {kind === 'daily' ? (
        <div className="victory__next">
          <Countdown label={`Next ${modeInfo(mode).title} soul in`} />
          {remaining.length > 0 ? (
            <div className="victory__modes">
              <span className="faint">Keep going:</span>
              {remaining.map((m) => (
                <a key={m.id} href={`#/${m.id}`} className="victory__mode-link" data-mode={m.id}>
                  <span className="kanji">{m.kanji}</span> {m.title}
                </a>
              ))}
            </div>
          ) : (
            <p className="victory__done">
              <span className="kanji">卍解</span> All four of today’s souls are settled. See you tomorrow!
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}
