import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import type { Character } from '../data/types';
import { normalize, searchCharacters, buildSearchIndex } from '../lib/search';
import { useSettings } from '../state/store';
import { Avatar } from './Avatar';
import { FillerBadge } from './FillerBadge';
import { Icon } from './Icon';

interface GuessInputProps {
  candidates: readonly Character[];
  exclude: ReadonlySet<string>;
  onGuess: (id: string) => void;
  disabled?: boolean;
  /** Shown under the field, e.g. "128 possible souls". */
  helper?: ReactNode;
  autoFocus?: boolean;
}

function Highlight({ text, query }: { text: string; query: string }) {
  const q = normalize(query);
  if (!q) return <>{text}</>;
  const plain = text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  // Map indices of the diacritic-stripped string back onto the original.
  const map: number[] = [];
  [...text].forEach((ch, i) => {
    const stripped = ch.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
    for (let k = 0; k < stripped.length; k++) map.push(i);
  });
  const at = plain.indexOf(q);
  if (at < 0) return <>{text}</>;
  const chars = [...text];
  const start = map[at] ?? 0;
  const end = (map[at + q.length - 1] ?? chars.length - 1) + 1;
  return (
    <>
      {chars.slice(0, start).join('')}
      <mark>{chars.slice(start, end).join('')}</mark>
      {chars.slice(end).join('')}
    </>
  );
}

export function GuessInput({ candidates, exclude, onGuess, disabled, helper, autoFocus }: GuessInputProps) {
  const settings = useSettings();
  const index = useMemo(() => buildSearchIndex(candidates), [candidates]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [shake, setShake] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const results = useMemo(
    () => (query.trim() ? searchCharacters(index, query, { exclude, limit: 8 }) : []),
    [index, query, exclude],
  );

  useEffect(() => {
    if (autoFocus && !disabled && window.matchMedia('(pointer: fine)').matches) inputRef.current?.focus();
  }, [autoFocus, disabled]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const submit = (character?: Character) => {
    const target = character ?? results[active];
    if (!target || disabled) {
      setShake((n) => n + 1);
      return;
    }
    onGuess(target.id);
    setQuery('');
    setOpen(false);
    if (window.matchMedia('(pointer: fine)').matches) inputRef.current?.focus();
    else inputRef.current?.blur();
  };

  const randomGuess = () => {
    const pool = candidates.filter((c) => !exclude.has(c.id));
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (pick) submit(pick);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActive((i) => (results.length ? (i + 1) % results.length : 0));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      submit();
    } else if (event.key === 'Escape') {
      if (open) setOpen(false);
      else setQuery('');
    } else if (event.key === 'Tab' && open && results[active]) {
      event.preventDefault();
      setQuery(results[active]!.name);
    }
  };

  const showList = open && query.trim().length > 0;
  const activeId = showList && results[active] ? `${listId}-${results[active]!.id}` : undefined;

  return (
    <div className={`guess${disabled ? ' guess--disabled' : ''}`}>
      <form
        className="guess__form"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div className="guess__field" key={shake} data-shake={shake > 0 || undefined}>
          <Icon name="search" size={18} className="guess__icon" />
          <input
            ref={inputRef}
            className="guess__input"
            type="text"
            inputMode="search"
            enterKeyHint="go"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="words"
            spellCheck={false}
            placeholder={disabled ? 'Waiting for the next soul…' : 'Type a character’s name…'}
            value={query}
            disabled={disabled}
            role="combobox"
            aria-label="Guess a character"
            aria-expanded={showList}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={activeId}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => window.setTimeout(() => setOpen(false), 120)}
            onKeyDown={onKeyDown}
          />
          {query ? (
            <button
              type="button"
              className="guess__clear"
              aria-label="Clear"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
            >
              <Icon name="close" size={16} />
            </button>
          ) : (
            <button
              type="button"
              className="guess__random"
              title="Random guess"
              aria-label="Make a random guess"
              disabled={disabled}
              onClick={randomGuess}
            >
              <Icon name="dice" size={18} />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="btn btn--primary guess__submit"
          disabled={disabled || results.length === 0}
        >
          <Icon name="sword" size={18} />
          <span>Guess</span>
        </button>
      </form>

      {showList ? (
        <ul id={listId} ref={listRef} className="guess__list" role="listbox" aria-label="Matching characters">
          {results.length === 0 ? (
            <li className="guess__empty" role="option" aria-selected="false" aria-disabled="true">
              No soul by that name{exclude.size ? ' (or already guessed)' : ''}.
            </li>
          ) : (
            results.map((character, i) => (
              <li
                key={character.id}
                id={`${listId}-${character.id}`}
                data-index={i}
                role="option"
                aria-selected={i === active}
                className={`guess__option${i === active ? ' is-active' : ''}`}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActive(i)}
                onClick={() => submit(character)}
              >
                <Avatar character={character} size={38} />
                <span className="guess__option-text">
                  <span className="guess__option-name">
                    <Highlight text={character.name} query={query} />
                    {settings.fillerBadges ? <FillerBadge character={character} /> : null}
                  </span>
                  <span className="guess__option-sub">{character.epithet}</span>
                </span>
              </li>
            ))
          )}
        </ul>
      ) : null}
      {helper ? <p className="guess__helper">{helper}</p> : null}
    </div>
  );
}
