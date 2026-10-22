import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { AFFILIATION_SHORT, arcInfo, HAIR_COLOR, insigniaOf, RANK_NOTE } from '../data/taxonomy';
import type { Character, Hair } from '../data/types';
import { ATTRIBUTES, compareCharacters, type CellResult } from '../lib/compare';
import { FLIP_STAGGER } from '../game/board';
import { sfx } from '../lib/sound';
import { useSettings } from '../state/store';
import { Avatar } from './Avatar';
import { FillerBadge } from './FillerBadge';
import { Icon } from './Icon';

const VERDICT_TEXT = { correct: 'correct', partial: 'partial match', wrong: 'no match' } as const;

function describe(cell: CellResult, guess: Character): string {
  const label = ATTRIBUTES.find((a) => a.key === cell.key)!.label;
  let detail = cell.values.join(', ');
  if (cell.key === 'insignia') detail = insigniaOf(guess)?.long ?? 'None';
  if (cell.key === 'debut') detail = `${arcInfo(guess.debut).name} (${arcInfo(guess.debut).span})`;
  if (cell.key === 'rank' && RANK_NOTE[guess.rank]) detail += ` — ${RANK_NOTE[guess.rank]}`;
  const arrow = cell.arrow
    ? cell.arrow === 'up'
      ? ' · answer is higher / later'
      : ' · answer is lower / earlier'
    : '';
  return `${label}: ${detail} — ${VERDICT_TEXT[cell.verdict]}${arrow}`;
}

function TileValue({ cell }: { cell: CellResult }) {
  if (cell.key === 'hair') {
    return (
      <span className="tile__values">
        {cell.values.map((value) => (
          <span key={value} className="tile__hair">
            <span className="tile__swatch" style={{ background: HAIR_COLOR[value as Hair].fill }} />
            {value}
          </span>
        ))}
      </span>
    );
  }
  const values =
    cell.key === 'affiliation'
      ? cell.values.map((v) => AFFILIATION_SHORT[v as keyof typeof AFFILIATION_SHORT] ?? v)
      : cell.values;
  return (
    <span className={`tile__values${values.length > 2 ? ' tile__values--dense' : ''}`}>
      {values.map((value) => (
        <span key={value}>{value}</span>
      ))}
    </span>
  );
}

interface RowProps {
  guess: Character;
  answer: Character;
  fresh: boolean;
  fillerBadges: boolean;
}

function BoardRow({ guess, answer, fresh, fillerBadges }: RowProps) {
  const cells = useMemo(() => compareCharacters(guess, answer), [guess, answer]);
  const correct = guess.id === answer.id;
  const twin = !correct && cells.every((cell) => cell.verdict === 'correct');

  useEffect(() => {
    if (!fresh) return;
    const timers = cells.map((_, i) => window.setTimeout(() => sfx.flip(i), i * FLIP_STAGGER * 1000 + 120));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [fresh, cells]);

  return (
    <div
      className={`board__row${fresh ? ' is-fresh' : ''}${correct ? ' is-correct' : ''}`}
      role="row"
      aria-label={`${guess.name}${correct ? ' — correct!' : ''}`}
    >
      <div className={`board__who${correct ? ' is-correct' : twin ? ' is-twin' : ''}`} role="rowheader">
        <Avatar character={guess} size={42} />
        <span className="board__who-text">
          <span className="board__who-name">{guess.name}</span>
          {fillerBadges ? <FillerBadge character={guess} /> : null}
          {twin ? <span className="chip chip--gold board__twin">Twin soul</span> : null}
        </span>
      </div>
      {cells.map((cell, i) => (
        <div
          key={cell.key}
          role="cell"
          className={`tile tile--${cell.verdict}`}
          style={{ '--i': i } as CSSProperties}
          title={describe(cell, guess)}
          aria-label={describe(cell, guess)}
        >
          <span className="tile__label" aria-hidden="true">
            {ATTRIBUTES[i]!.label}
          </span>
          <TileValue cell={cell} />
          {cell.arrow ? (
            <span className={`tile__arrow tile__arrow--${cell.arrow}`} aria-hidden="true">
              <Icon name={cell.arrow === 'up' ? 'up' : 'down'} size={44} strokeWidth={2.4} />
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

interface ClassicBoardProps {
  guesses: readonly Character[];
  answer: Character;
}

export function ClassicBoard({ guesses, answer }: ClassicBoardProps) {
  const settings = useSettings();
  const previous = useRef(guesses.length);
  const [freshId, setFreshId] = useState<string | null>(null);

  useEffect(() => {
    if (guesses.length > previous.current) setFreshId(guesses[guesses.length - 1]!.id);
    previous.current = guesses.length;
  }, [guesses]);

  if (guesses.length === 0) return null;
  const rows = [...guesses].reverse();

  return (
    <div className="board" role="table" aria-label="Your guesses" aria-rowcount={rows.length + 1}>
      <div className="board__head" role="row">
        <div className="board__head-cell board__head-cell--who" role="columnheader">
          Character
        </div>
        {ATTRIBUTES.map((attribute) => (
          <div key={attribute.key} className="board__head-cell" role="columnheader" title={attribute.rule}>
            {attribute.label}
            <Icon name="info" size={12} className="board__head-info" />
          </div>
        ))}
      </div>
      {rows.map((guess) => (
        <BoardRow
          key={guess.id}
          guess={guess}
          answer={answer}
          fresh={guess.id === freshId}
          fillerBadges={settings.fillerBadges}
        />
      ))}
    </div>
  );
}
