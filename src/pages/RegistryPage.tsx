import { useDeferredValue, useMemo, useState } from 'react';
import { CHARACTERS, EMOJIS, QUOTES, RELEASES, characterById, hasCharacter } from '../data';
import { arcInfo, arcOrder, ARCS, insigniaOf, MODES } from '../data/taxonomy';
import type { Character, Race } from '../data/types';
import { navigate } from '../hooks/useHashRoute';
import { buildSearchIndex, searchCharacters } from '../lib/search';
import { store, useStore } from '../state/store';
import { Avatar } from '../components/Avatar';
import { FillerBadge } from '../components/FillerBadge';
import { Icon } from '../components/Icon';
import { Modal } from '../components/Modal';
import { Segmented } from '../components/Segmented';

type Origin = 'all' | 'canon' | 'filler';
type Owned = 'all' | 'found' | 'missing';
type Sort = 'name' | 'debut' | 'tier';

const RACE_FILTERS: (Race | 'All')[] = [
  'All',
  'Shinigami',
  'Human',
  'Hollow',
  'Arrancar',
  'Visored',
  'Quincy',
  'Fullbringer',
  'Mod Soul',
  'Bount',
  'Zanpakutō Spirit',
  'Soul',
];

const index = buildSearchIndex(CHARACTERS);

function Profile({ character, found }: { character: Character; found: boolean }) {
  const insignia = insigniaOf(character);
  const releases = RELEASES.filter((r) => r.character === character.id);
  const quotes = QUOTES.filter((q) => q.character === character.id);
  const emoji = EMOJIS.find((e) => e.character === character.id);
  const modes = [
    { id: 'classic', present: true },
    { id: 'release', present: releases.length > 0 },
    { id: 'quote', present: quotes.length > 0 },
    { id: 'emoji', present: Boolean(emoji) },
  ];

  return (
    <div className="profile">
      <div className="profile__top">
        <Avatar character={character} size={112} />
        <div>
          <p className="profile__epithet">{character.epithet}</p>
          {character.jp ? <p className="profile__jp">{character.jp}</p> : null}
          <p className="profile__bio">{character.bio}</p>
          <p className="profile__tags">
            <FillerBadge character={character} />
            {found ? (
              <span className="chip chip--success">
                <Icon name="check" size={13} strokeWidth={3} /> Collected
              </span>
            ) : (
              <span className="chip">Not yet collected</span>
            )}
          </p>
        </div>
      </div>

      <dl className="profile__facts">
        <div>
          <dt>Gender</dt>
          <dd>{character.gender}</dd>
        </div>
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
          <dt>Hair</dt>
          <dd>{character.hair.join(', ')}</dd>
        </div>
        <div>
          <dt>Debut</dt>
          <dd>
            {arcInfo(character.debut).name} <span className="faint">· {arcInfo(character.debut).span}</span>
          </dd>
        </div>
        {character.aliases?.length ? (
          <div>
            <dt>Also known as</dt>
            <dd>{character.aliases.join(', ')}</dd>
          </div>
        ) : null}
      </dl>

      <div className="profile__modes">
        {modes.map((m) => {
          const info = MODES.find((x) => x.id === m.id)!;
          return (
            <span key={m.id} className={`profile__mode${m.present ? ' is-present' : ''}`} data-mode={m.id}>
              <span className="kanji">{info.kanji}</span> {info.title}
            </span>
          );
        })}
      </div>

      {found && (releases.length > 0 || quotes.length > 0 || emoji) ? (
        <div className="profile__extras">
          {releases.map((r) => (
            <p key={r.id}>
              <span className="chip chip--accent">{r.kind}</span>{' '}
              <strong>{r.kind === 'Schrift' ? `“${r.letter}” — ${r.name}` : r.name}</strong>
              {r.command ? <span className="dim"> · “{r.command}”</span> : null}
            </p>
          ))}
          {quotes.map((q) => (
            <blockquote key={q.id} className="profile__quote">
              “{q.text}”
            </blockquote>
          ))}
          {emoji ? <p className="emoji profile__emoji">{emoji.emoji.join(' ')}</p> : null}
        </div>
      ) : (releases.length > 0 || quotes.length > 0 || emoji) && !found ? (
        <p className="profile__locked">
          <Icon name="lock" size={14} /> Solve this soul in any mode to unlock their releases, quotes and
          emoji here.
        </p>
      ) : null}
    </div>
  );
}

export function RegistryPage({ selected }: { selected?: string }) {
  const collection = useStore((s) => s.collection);
  const [query, setQuery] = useState('');
  const [origin, setOrigin] = useState<Origin>('all');
  const [owned, setOwned] = useState<Owned>('all');
  const [race, setRace] = useState<Race | 'All'>('All');
  const [sort, setSort] = useState<Sort>('name');
  const deferred = useDeferredValue(query);

  const list = useMemo(() => {
    let items: Character[] = deferred.trim()
      ? searchCharacters(index, deferred, { limit: CHARACTERS.length })
      : [...CHARACTERS];
    items = items.filter(
      (c) =>
        (origin === 'all' || (origin === 'canon' ? c.origin === 'canon' : c.origin !== 'canon')) &&
        (owned === 'all' || (owned === 'found') === Boolean(collection[c.id])) &&
        (race === 'All' || c.race.includes(race)),
    );
    if (!deferred.trim()) {
      items.sort((a, b) => {
        if (sort === 'debut') return arcOrder(a.debut) - arcOrder(b.debut) || a.name.localeCompare(b.name);
        if (sort === 'tier') return a.tier - b.tier || a.name.localeCompare(b.name);
        return a.name.localeCompare(b.name);
      });
    }
    return items;
  }, [deferred, origin, owned, race, sort, collection]);

  const found = Object.keys(collection).filter(hasCharacter).length;
  const percent = Math.round((found / CHARACTERS.length) * 100);
  const current = selected && hasCharacter(selected) ? characterById(selected) : null;

  const open = (id: string) => {
    navigate(`/registry/${id}`);
    store.update((s) => ({ ...s, counters: { ...s.counters, archiveOpens: s.counters.archiveOpens + 1 } }));
  };

  return (
    <div className="registry" data-mode="classic">
      <header className="page-head">
        <span className="page-head__kanji kanji" aria-hidden="true">
          名簿
        </span>
        <div>
          <h1 className="page-head__title">Soul Registry</h1>
          <p className="page-head__sub">
            Every soul in Bleedle — {CHARACTERS.length} characters across {ARCS.length} arcs and films. Solve
            a soul to collect it.
          </p>
        </div>
        <div className="registry__progress" aria-label={`${found} of ${CHARACTERS.length} collected`}>
          <span className="registry__progress-num">
            {found}
            <span className="faint"> / {CHARACTERS.length}</span>
          </span>
          <span className="progress">
            <span className="progress__bar" style={{ width: `${percent}%` }} />
          </span>
        </div>
      </header>

      <div className="registry__controls">
        <label className="search-field">
          <Icon name="search" size={18} />
          <input
            type="search"
            placeholder="Search names, nicknames, 日本語…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search the registry"
          />
        </label>
        <div className="registry__filters">
          <Segmented
            label="Origin"
            size="sm"
            value={origin}
            onChange={setOrigin}
            options={[
              { value: 'all', label: 'All' },
              { value: 'canon', label: 'Canon' },
              { value: 'filler', label: 'Filler & films' },
            ]}
          />
          <Segmented
            label="Collection"
            size="sm"
            value={owned}
            onChange={setOwned}
            options={[
              { value: 'all', label: 'Everyone' },
              { value: 'found', label: 'Collected' },
              { value: 'missing', label: 'Missing' },
            ]}
          />
          <label className="select">
            <span className="sr-only">Race</span>
            <select value={race} onChange={(event) => setRace(event.target.value as Race | 'All')}>
              {RACE_FILTERS.map((r) => (
                <option key={r} value={r}>
                  {r === 'All' ? 'All races' : r}
                </option>
              ))}
            </select>
          </label>
          <label className="select">
            <span className="sr-only">Sort</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as Sort)}
              disabled={Boolean(query)}
            >
              <option value="name">A → Z</option>
              <option value="debut">By debut</option>
              <option value="tier">By fame</option>
            </select>
          </label>
        </div>
      </div>

      <p className="registry__count faint" aria-live="polite">
        {list.length} {list.length === 1 ? 'soul' : 'souls'}
      </p>

      <ul className="registry__grid">
        {list.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              className={`soul-card${collection[c.id] ? ' is-found' : ''}`}
              onClick={() => open(c.id)}
            >
              <Avatar character={c} size={56} />
              <span className="soul-card__text">
                <span className="soul-card__name">{c.name}</span>
                <span className="soul-card__epithet">{c.epithet}</span>
                <span className="soul-card__meta">
                  <FillerBadge character={c} />
                  <span className="faint">{arcInfo(c.debut).short}</span>
                </span>
              </span>
              {collection[c.id] ? (
                <span className="soul-card__found" title="Collected">
                  <Icon name="check" size={14} strokeWidth={3} />
                </span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
      {list.length === 0 ? <p className="registry__empty">No souls match those filters.</p> : null}

      <Modal
        open={Boolean(current)}
        onClose={() => navigate('/registry')}
        title={current?.name ?? ''}
        size="lg"
      >
        {current ? <Profile character={current} found={Boolean(collection[current.id])} /> : null}
      </Modal>
    </div>
  );
}
