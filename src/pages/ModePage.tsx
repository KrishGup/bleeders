import { useEffect, useMemo, useRef, useState } from 'react';
import { characterById } from '../data';
import { modeInfo } from '../data/taxonomy';
import type { Character, ModeId } from '../data/types';
import { dailyPuzzle, matchesPool, releaseEntry } from '../game/engine';
import { useGame, type GameView } from '../hooks/useGame';
import { navigate } from '../hooks/useHashRoute';
import { formatDay, puzzleNumber } from '../lib/date';
import { compareCharacters } from '../lib/compare';
import { sfx } from '../lib/sound';
import type { GameKind, PoolFilter } from '../state/model';
import { useSettings } from '../state/store';
import { ui } from '../state/ui';
import { ArchiveList } from '../components/ArchiveList';
import { Avatar } from '../components/Avatar';
import { ClassicBoard } from '../components/ClassicBoard';
import { FLIP_TOTAL_MS, twinsOf } from '../game/board';
import { ClueCard } from '../components/ClueCard';
import { GuessInput } from '../components/GuessInput';
import { GuessList } from '../components/GuessList';
import { HintPanel } from '../components/HintPanel';
import { Icon } from '../components/Icon';
import { ConfirmDialog } from '../components/Modal';
import { ReiatsuBurst } from '../components/ReiatsuBurst';
import { Segmented } from '../components/Segmented';
import { VictoryPanel } from '../components/VictoryPanel';

const POOLS: { value: PoolFilter; label: string; hint: string }[] = [
  { value: 'all', label: 'Everyone', hint: 'Every character, filler and films included' },
  { value: 'main', label: 'Main cast', hint: 'The best-known characters only' },
  { value: 'canon', label: 'Canon', hint: 'Manga characters only' },
  { value: 'filler', label: 'Filler & films', hint: 'Anime-only and movie characters' },
];

function Legend() {
  return (
    <div className="legend" aria-label="Colour legend">
      <span className="legend__item">
        <span className="legend__swatch is-correct" /> Correct
      </span>
      <span className="legend__item">
        <span className="legend__swatch is-partial" /> Partial
      </span>
      <span className="legend__item">
        <span className="legend__swatch is-wrong" /> Wrong
      </span>
      <span className="legend__item">
        <Icon name="up" size={14} /> Higher / later
      </span>
      <span className="legend__item">
        <Icon name="down" size={14} /> Lower / earlier
      </span>
    </div>
  );
}

function Yesterday({ mode, day }: { mode: ModeId; day: number }) {
  const character = characterById(dailyPuzzle(mode, day).answer);
  return (
    <a className="yesterday" href={`#/registry/${character.id}`}>
      <span className="faint">Yesterday’s soul</span>
      <Avatar character={character} size={28} />
      <strong>{character.name}</strong>
    </a>
  );
}

function TwinBanner({ view }: { view: GameView }) {
  const latest = view.guesses[view.guesses.length - 1];
  const twins = useMemo(() => {
    if (!latest || !view.answer || latest.id === view.answer.id) return [];
    const allGreen = compareCharacters(latest, view.answer).every((cell) => cell.verdict === 'correct');
    return allGreen ? twinsOf(latest).filter((c) => !view.record?.guesses.includes(c.id)) : [];
  }, [latest, view.answer, view.record]);
  if (twins.length === 0 || view.status !== 'playing') return null;
  return (
    <div className="twin-banner" role="status">
      <Icon name="users" size={20} />
      <div>
        <p className="twin-banner__title">Perfect profile — but a different soul!</p>
        <p className="twin-banner__text">These characters share every attribute with {latest!.name}:</p>
        <div className="twin-banner__chips">
          {twins.map((twin: Character) => (
            <button key={twin.id} type="button" className="btn btn--sm" onClick={() => view.guess(twin.id)}>
              <Avatar character={twin} size={22} plain /> {twin.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function EndlessBar({ view, onNew }: { view: GameView; onNew: (pool?: PoolFilter) => void }) {
  const pool = view.record?.pool ?? 'all';
  const counts = useMemo(
    () =>
      Object.fromEntries(
        POOLS.map((p) => [p.value, view.roster.filter((c) => matchesPool(c, p.value)).length]),
      ),
    [view.roster],
  );
  return (
    <div className="endless-bar">
      <Segmented
        label="Character pool"
        size="sm"
        value={pool}
        onChange={(value) => onNew(value)}
        options={POOLS.map((p) => ({
          value: p.value,
          hint: `${p.hint} (${counts[p.value]})`,
          label: p.label,
        }))}
      />
      <button type="button" className="btn btn--sm" onClick={() => onNew()}>
        <Icon name="refresh" size={16} /> New soul
      </button>
    </div>
  );
}

const KIND_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'endless', label: 'Endless' },
  { value: 'archive', label: 'Archive' },
] as const;

function KindSwitch({ mode, kind }: { mode: ModeId; kind: GameKind }) {
  return (
    <Segmented
      label="Puzzle type"
      size="sm"
      value={kind}
      onChange={(value) => navigate(value === 'daily' ? `/${mode}` : `/${mode}/${value}`)}
      options={KIND_OPTIONS}
    />
  );
}

export function ModePage({ mode, kind, day }: { mode: ModeId; kind: GameKind; day?: number }) {
  const view = useGame(mode, kind, day ?? 0);
  const settings = useSettings();
  const info = modeInfo(mode);
  const [showVictory, setShowVictory] = useState(view.status !== 'playing');
  const [burst, setBurst] = useState(0);
  const [confirm, setConfirm] = useState<null | 'give-up' | { pool?: PoolFilter }>(null);
  const previous = useRef({ status: view.status, answer: view.record?.answer });

  useEffect(() => {
    const before = previous.current;
    previous.current = { status: view.status, answer: view.record?.answer };
    const sameGame = before.answer === view.record?.answer;
    if (sameGame && before.status === 'playing' && view.status === 'won') {
      setShowVictory(false);
      const timer = window.setTimeout(
        () => {
          setShowVictory(true);
          sfx.win();
          window.requestAnimationFrame(() => {
            document.getElementById('victory')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setBurst((n) => n + 1);
          });
        },
        mode === 'classic' ? FLIP_TOTAL_MS : 500,
      );
      return () => window.clearTimeout(timer);
    }
    setShowVictory(view.status !== 'playing');
    return undefined;
  }, [view.status, view.record?.answer, mode]);

  const exclude = useMemo(() => new Set(view.record?.guesses ?? []), [view.record]);
  const candidates = useMemo(
    () =>
      kind === 'endless' && view.record?.pool
        ? view.roster.filter((c) => matchesPool(c, view.record!.pool!))
        : view.roster,
    [kind, view.roster, view.record],
  );

  const requestNewEndless = (pool?: PoolFilter) => {
    if (view.status === 'playing' && (view.record?.guesses.length ?? 0) > 0) setConfirm({ pool });
    else view.newEndless(pool);
  };

  const onGuess = (id: string) => {
    const result = view.guess(id);
    if (!result) ui.toast('Already guessed — try another soul.', 'error');
  };

  const info0 = modeInfo(mode);
  if (kind === 'archive' && (day === undefined || !Number.isInteger(day) || day < 0 || day >= view.today)) {
    return (
      <div className="mode-page" data-mode={mode}>
        <header className="mode-head">
          <span className="mode-head__kanji kanji" aria-hidden="true">
            {info0.kanji}
          </span>
          <div className="mode-head__text">
            <h1 className="mode-head__title">{info0.title}</h1>
            <p className="mode-head__sub">Archive · every past puzzle, ready to replay</p>
          </div>
          <KindSwitch mode={mode} kind={kind} />
        </header>
        {day !== undefined ? (
          <p className="archive-missing">
            That puzzle isn’t in the archive yet. <a href={`#/${mode}/archive`}>See all past puzzles</a>
          </p>
        ) : null}
        <ArchiveList mode={mode} today={view.today} />
      </div>
    );
  }

  if (!view.record || !view.answer) {
    return (
      <div className="mode-page" data-mode={mode}>
        <p className="mode-loading">Summoning a soul…</p>
      </div>
    );
  }

  const releaseKind =
    mode === 'release' && view.record.clue ? releaseEntry(view.record.clue).kind : undefined;
  const finished = view.status !== 'playing';
  const count = view.record.guesses.length;

  return (
    <div className="mode-page" data-mode={mode}>
      <header className="mode-head">
        <span className="mode-head__kanji kanji" aria-hidden="true">
          {info.kanji}
        </span>
        <div className="mode-head__text">
          <h1 className="mode-head__title">{info.title}</h1>
          <p className="mode-head__sub">
            {kind === 'daily'
              ? `Bleedle #${puzzleNumber(view.today)} · ${formatDay(view.today)}`
              : kind === 'archive'
                ? `Bleedle #${puzzleNumber(view.day)} · ${formatDay(view.day)} · Archive replay`
                : 'Endless training · no streaks on the line'}
          </p>
        </div>
        <KindSwitch mode={mode} kind={kind} />
      </header>

      {kind === 'archive' ? (
        <a className="archive-back" href={`#/${mode}/archive`}>
          <Icon name="back" size={16} /> All past puzzles
        </a>
      ) : null}

      {kind === 'endless' ? <EndlessBar view={view} onNew={requestNewEndless} /> : null}

      {mode !== 'classic' ? (
        <ClueCard
          mode={mode}
          clues={view.clues}
          misses={view.misses}
          finished={finished}
          {...(releaseKind ? { releaseKind } : {})}
        />
      ) : null}

      {finished ? (
        showVictory ? (
          <VictoryPanel view={view} onNextEndless={() => view.newEndless()} />
        ) : null
      ) : (
        <GuessInput
          candidates={candidates}
          exclude={exclude}
          onGuess={onGuess}
          autoFocus
          helper={
            mode === 'classic'
              ? count === 0
                ? 'Start with anyone — a captain is a good opener.'
                : null
              : `${candidates.length} possible souls have ${/^[aeiou]/i.test(info.title) ? 'an' : 'a'} ${info.title.toLowerCase()} clue.`
          }
        />
      )}

      {mode === 'classic' && !finished ? (
        <HintPanel
          hints={view.hints}
          revealed={view.record.hints}
          misses={view.misses}
          finished={finished}
          hardMode={settings.hardMode}
          onReveal={view.revealHint}
        />
      ) : null}

      {mode === 'classic' ? <TwinBanner view={view} /> : null}

      {mode === 'classic' ? (
        <ClassicBoard guesses={view.guesses} answer={view.answer} />
      ) : (
        <GuessList guesses={view.guesses} answerId={view.answer.id} />
      )}

      <div className="mode-foot">
        <span className="mode-foot__count">
          {count} {count === 1 ? 'guess' : 'guesses'}
        </span>
        {!finished && count >= 3 ? (
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setConfirm('give-up')}>
            <Icon name="flag" size={15} /> Give up
          </button>
        ) : null}
        {kind === 'daily' && view.today > 0 ? <Yesterday mode={mode} day={view.today - 1} /> : null}
      </div>

      {mode === 'classic' ? <Legend /> : null}

      <ReiatsuBurst trigger={burst} originId="victory" />

      <ConfirmDialog
        open={confirm === 'give-up'}
        title="Retreat from this soul?"
        message={
          kind === 'daily' ? (
            <p>The answer will be revealed and today’s game counts as a loss — your streak resets to zero.</p>
          ) : (
            <p>The answer will be revealed and this game counts as a loss.</p>
          )
        }
        confirmLabel="Give up"
        danger
        onConfirm={view.giveUp}
        onClose={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={typeof confirm === 'object' && confirm !== null}
        title="Skip this soul?"
        message={<p>You’ve already made guesses. Skipping counts this Endless game as a loss.</p>}
        confirmLabel="Skip"
        danger
        onConfirm={() => {
          view.giveUp();
          view.newEndless(typeof confirm === 'object' && confirm ? confirm.pool : undefined);
        }}
        onClose={() => setConfirm(null)}
      />
    </div>
  );
}
