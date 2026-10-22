import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import type { Character } from '../data/types';
import { useMediaQuery } from '../hooks/useMediaQuery';
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

/**
 * On touch screens, lift the guess box to just under the header so its suggestions clear the
 * on-screen keyboard. Short pages get temporary room below (`.is-guessing`) so the lift always
 * fits. Returns the scroll position to come back to, or null if nothing moved.
 */
function liftAboveKeyboard(root: HTMLElement | null): number | null {
  if (!root || !window.matchMedia('(pointer: coarse)').matches) return null;
  const header = document.querySelector('.header')?.getBoundingClientRect().bottom ?? 0;
  const offset = root.getBoundingClientRect().top - header - 10;
  if (Math.abs(offset) <= 12) return null;
  const html = document.documentElement;
  html.classList.add('is-guessing');
  const from = window.scrollY;
  // Jump, don't glide: the keyboard is already sliding in. (Overrides the page's smooth scrolling.)
  const behavior = html.style.scrollBehavior;
  html.style.scrollBehavior = 'auto';
  window.scrollTo(0, from + offset);
  html.style.scrollBehavior = behavior;
  return from;
}

/** Drop the temporary room once the guess box is no longer in use. */
function settleAfterGuessing(input: HTMLInputElement | null) {
  if (document.activeElement !== input) document.documentElement.classList.remove('is-guessing');
}

export function GuessInput({ candidates, exclude, onGuess, disabled, helper, autoFocus }: GuessInputProps) {
  const settings = useSettings();
  const compact = useMediaQuery('(max-width: 480px)');
  const index = useMemo(() => buildSearchIndex(candidates), [candidates]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [shake, setShake] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const liftedFrom = useRef<number | null>(null);
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

  // Leaving the page mid-guess shouldn't strand the extra keyboard room.
  useEffect(() => () => document.documentElement.classList.remove('is-guessing'), []);

  // Press "/" anywhere to jump to the guess box.
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"], dialog[open]')) return;
      event.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const showList = open && query.trim().length > 0;

  // Keep the suggestion list inside what's actually visible (the on-screen keyboard shrinks the
  // visual viewport, not the layout one).
  useEffect(() => {
    const list = listRef.current;
    const viewport = window.visualViewport;
    if (!showList || !list || !viewport) return;
    const fit = () => {
      const space = viewport.offsetTop + viewport.height - list.getBoundingClientRect().top - 12;
      list.style.setProperty('--list-max', `${Math.round(Math.max(150, Math.min(420, space)))}px`);
    };
    fit();
    viewport.addEventListener('resize', fit);
    viewport.addEventListener('scroll', fit);
    window.addEventListener('scroll', fit, { passive: true });
    return () => {
      viewport.removeEventListener('resize', fit);
      viewport.removeEventListener('scroll', fit);
      window.removeEventListener('scroll', fit);
    };
  }, [showList]);

  const submit = (character?: Character) => {
    const target = character ?? results[active];
    if (!target || disabled) {
      setShake((n) => n + 1);
      return;
    }
    onGuess(target.id);
    setQuery('');
    setOpen(false);
    if (window.matchMedia('(pointer: fine)').matches) {
      inputRef.current?.focus();
      return;
    }
    // Touch: drop the keyboard and settle back where the player was, so new clues are in view.
    const from = liftedFrom.current;
    liftedFrom.current = null;
    inputRef.current?.blur();
    if (from === null) return;
    window.requestAnimationFrame(() => window.scrollTo({ top: from, behavior: 'smooth' }));
    window.setTimeout(() => settleAfterGuessing(inputRef.current), 600);
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

  const activeId = showList && results[active] ? `${listId}-${results[active]!.id}` : undefined;

  return (
    <div ref={rootRef} className={`guess${disabled ? ' guess--disabled' : ''}`}>
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
            placeholder={
              disabled ? 'Waiting for the next soul…' : compact ? 'Guess a soul…' : 'Type a character’s name…'
            }
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
            onFocus={() => {
              setOpen(true);
              liftedFrom.current = liftAboveKeyboard(rootRef.current);
            }}
            onBlur={() => {
              // A tap on a suggestion blurs the field just before its click lands, so wait a beat
              // before forgetting where to scroll back to.
              window.setTimeout(() => {
                setOpen(false);
                if (document.activeElement === inputRef.current) return;
                liftedFrom.current = null;
                settleAfterGuessing(inputRef.current);
              }, 150);
            }}
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
                    <span className="guess__option-label">
                      <Highlight text={character.name} query={query} />
                    </span>
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
