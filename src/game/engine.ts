import { CHARACTERS, characterById, EMOJIS, QUOTES, RELEASES } from '../data';
import { arcInfo } from '../data/taxonomy';
import type { Character, EmojiEntry, ModeId, QuoteEntry, ReleaseEntry, Tier } from '../data/types';
import { createSchedule, type Schedule } from '../lib/daily';
import { cyrb53 } from '../lib/hash';
import type { PoolFilter } from '../state/model';

export interface Puzzle {
  answer: string;
  clue?: string;
}

/** How much more often each tier is chosen as a daily answer. */
export const TIER_WEIGHT: Record<Tier, number> = { 1: 3, 2: 2.2, 3: 1.4, 4: 1 };

/** Bump to deliberately reshuffle every future schedule. */
const SCHEDULE_VERSION = 'v1';

/**
 * Launch-week line-up: famous-but-not-trivial answers so the first days make a
 * good impression. After that the weighted schedule takes over.
 */
const PINNED: Record<ModeId, Record<number, string>> = {
  classic: { 0: 'renji-abarai', 1: 'grimmjow-jaegerjaquez', 2: 'rangiku-matsumoto', 3: 'shinji-hirako' },
  release: {
    0: 'toshiro-hitsugaya:shikai',
    1: 'ulquiorra-cifer:resurreccion',
    2: 'shuhei-hisagi:shikai',
    3: 'bambietta-basterbine:schrift',
  },
  quote: { 0: 'sosuke-aizen', 1: 'kenpachi-zaraki', 2: 'orihime-inoue', 3: 'gin-ichimaru' },
  emoji: { 0: 'kon', 1: 'byakuya-kuchiki', 2: 'yachiru-kusajishi', 3: 'mayuri-kurotsuchi' },
};

/** Pins are a character id, optionally followed by `:entry` to fix the exact clue. */
function pinnedCharacters(mode: ModeId): Record<number, string> {
  return Object.fromEntries(Object.entries(PINNED[mode]).map(([day, pin]) => [day, pin.split(':')[0]!]));
}

type Entry = ReleaseEntry | QuoteEntry | EmojiEntry;

const ENTRIES: Record<Exclude<ModeId, 'classic'>, readonly Entry[]> = {
  release: RELEASES,
  quote: QUOTES,
  emoji: EMOJIS,
};

function entriesByCharacter(mode: Exclude<ModeId, 'classic'>): Map<string, Entry[]> {
  const map = new Map<string, Entry[]>();
  for (const entry of ENTRIES[mode]) {
    const list = map.get(entry.character) ?? [];
    list.push(entry);
    map.set(entry.character, list);
  }
  return map;
}

const groupedCache = new Map<ModeId, Map<string, Entry[]>>();
function grouped(mode: Exclude<ModeId, 'classic'>): Map<string, Entry[]> {
  let map = groupedCache.get(mode);
  if (!map) groupedCache.set(mode, (map = entriesByCharacter(mode)));
  return map;
}

/** Characters that can be the answer in a mode. */
export function modeRoster(mode: ModeId): Character[] {
  if (mode === 'classic') return [...CHARACTERS];
  return [...grouped(mode).keys()].map(characterById);
}

const scheduleCache = new Map<ModeId, Schedule<Character>>();
function schedule(mode: ModeId): Schedule<Character> {
  let s = scheduleCache.get(mode);
  if (!s) {
    s = createSchedule({
      salt: `bleedle:${mode}:${SCHEDULE_VERSION}`,
      items: modeRoster(mode),
      key: (character) => character.id,
      weight: (character) => TIER_WEIGHT[character.tier],
      noRepeatDays: mode === 'classic' ? 150 : 90,
      pinned: pinnedCharacters(mode),
    });
    scheduleCache.set(mode, s);
  }
  return s;
}

/** When a character has several clues, choose one deterministically per day. */
function chooseEntry(mode: Exclude<ModeId, 'classic'>, characterId: string, seed: string): Entry {
  const list = grouped(mode).get(characterId);
  if (!list?.length) throw new Error(`No ${mode} entries for ${characterId}`);
  return list[cyrb53(seed) % list.length]!;
}

export function dailyPuzzle(mode: ModeId, day: number): Puzzle {
  const character = schedule(mode).pick(day);
  if (mode === 'classic') return { answer: character.id };
  const pin = PINNED[mode][day];
  if (pin?.includes(':') && entryIndex.has(pin)) return { answer: character.id, clue: pin };
  const entry = chooseEntry(mode, character.id, `bleedle:${mode}:entry:${day}`);
  return { answer: character.id, clue: entry.id };
}

export function matchesPool(character: Character, filter: PoolFilter): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'main':
      return character.tier <= 2;
    case 'canon':
      return character.origin === 'canon';
    case 'filler':
      return character.origin !== 'canon';
  }
}

export function poolSize(mode: ModeId, filter: PoolFilter): number {
  return modeRoster(mode).filter((character) => matchesPool(character, filter)).length;
}

export function randomPuzzle(mode: ModeId, filter: PoolFilter, random: () => number, avoid?: string): Puzzle {
  let roster = modeRoster(mode).filter((character) => matchesPool(character, filter));
  if (roster.length === 0) roster = modeRoster(mode);
  if (roster.length > 1 && avoid) roster = roster.filter((character) => character.id !== avoid);
  const character = roster[Math.floor(random() * roster.length)]!;
  if (mode === 'classic') return { answer: character.id };
  const list = grouped(mode).get(character.id)!;
  return { answer: character.id, clue: list[Math.floor(random() * list.length)]!.id };
}

const entryIndex = new Map<string, Entry>();
for (const list of Object.values(ENTRIES)) for (const entry of list) entryIndex.set(entry.id, entry);

export function releaseEntry(id: string): ReleaseEntry {
  const entry = entryIndex.get(id);
  if (!entry || !('kind' in entry)) throw new Error(`Unknown release entry ${id}`);
  return entry;
}
export function quoteEntry(id: string): QuoteEntry {
  const entry = entryIndex.get(id);
  if (!entry || !('text' in entry)) throw new Error(`Unknown quote entry ${id}`);
  return entry;
}
export function emojiEntry(id: string): EmojiEntry {
  const entry = entryIndex.get(id);
  if (!entry || !('emoji' in entry)) throw new Error(`Unknown emoji entry ${id}`);
  return entry;
}

// ---------------------------------------------------------------------------
// Clue ladders. `at` = number of wrong guesses needed before a clue shows.
// ---------------------------------------------------------------------------

export interface Clue {
  at: number;
  label: string;
  text: string;
  /** Visual treatment. */
  tone?: 'command' | 'emoji' | 'quote' | 'plain' | 'name';
}

/** "Sode no Shirayuki" → "S••• n• S••••••••" */
export function maskName(name: string): string {
  return name
    .split(' ')
    .map((word) => [...word].map((ch, i) => (i === 0 || /[^\p{L}\p{N}]/u.test(ch) ? ch : '•')).join(''))
    .join(' ');
}

export function initials(name: string): string {
  return name
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => `${[...part][0]!.toUpperCase()}.`)
    .join(' ');
}

/** Replace every part of a character's name (and aliases) with a redaction bar. */
export function redact(text: string, character: Character): string {
  const parts = [character.name, ...(character.aliases ?? [])]
    .flatMap((n) => [n, ...n.split(/\s+/)])
    .filter((p) => p.length > 2)
    .sort((a, b) => b.length - a.length)
    .map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (parts.length === 0) return text;
  return text.replace(new RegExp(`\\b(${parts.join('|')})\\b`, 'gi'), '▇▇▇');
}

export const RELEASE_STEPS = [0, 3, 6, 9, 12] as const;

/** A gentle, non-naming clue about who wields a power. */
function wielderClue(character: Character): Omit<Clue, 'at'> {
  const group = character.affiliation.filter((a) => a !== 'None').join(' · ') || character.race.join(' · ');
  const arc = arcInfo(character.debut);
  const where = arc.kind === 'movie' ? `the film ${arc.name}` : `the ${arc.name} arc`;
  return { label: 'Wielder', text: `${group} — first seen in ${where}` };
}

export function releaseClues(entry: ReleaseEntry, character: Character): Clue[] {
  const steps: Omit<Clue, 'at'>[] = [];
  if (entry.kind === 'Schrift') {
    steps.push(
      { label: 'Schrift', text: `“${entry.letter ?? '?'}”`, tone: 'command' },
      { label: 'Ability', text: entry.ability },
      { label: 'Epithet', text: maskName(entry.name), tone: 'name' },
    );
  } else {
    if (entry.command) {
      steps.push({
        label: 'Release command',
        text: `“${entry.command}, ${maskName(entry.name)}!”`,
        tone: 'command',
      });
      steps.push({ label: 'Ability', text: entry.ability });
      steps.push(entry.meaning ? { label: 'Meaning', text: `“${entry.meaning}”` } : wielderClue(character));
    } else if (entry.meaning) {
      steps.push({ label: 'Meaning', text: `“${entry.meaning}”`, tone: 'command' });
      steps.push({ label: 'Ability', text: entry.ability });
      steps.push(wielderClue(character));
    } else {
      steps.push({ label: 'Power', text: entry.ability, tone: 'plain' });
      steps.push(wielderClue(character));
    }
    steps.push({ label: 'Name', text: maskName(entry.name), tone: 'name' });
  }
  if (entry.extra) steps.push({ label: 'Also known for', text: entry.extra });
  return steps.map((clue, i) => ({ ...clue, at: RELEASE_STEPS[i]! }));
}

export function quoteClues(entry: QuoteEntry, character: Character): Clue[] {
  return [
    { at: 0, label: 'Quote', text: entry.text, tone: 'quote' },
    { at: 3, label: 'Arc', text: arcInfo(entry.arc).name },
    { at: 6, label: 'Context', text: entry.context },
    { at: 9, label: 'Initials', text: initials(character.name), tone: 'name' },
  ];
}

export function emojiClues(entry: EmojiEntry, character: Character): Clue[] {
  return [
    ...entry.emoji.map((emoji, i) => ({
      at: i,
      label: `Emoji ${i + 1}`,
      text: emoji,
      tone: 'emoji' as const,
    })),
    { at: 7, label: 'Debut', text: arcInfo(character.debut).name },
    { at: 10, label: 'Initials', text: initials(character.name), tone: 'name' },
  ];
}

export interface ClassicHint {
  at: number;
  label: string;
  icon: string;
  text: string;
}

/** Classic mode hints are opt-in: they unlock, then the player chooses to reveal. */
export function classicHints(character: Character): ClassicHint[] {
  return [
    { at: 5, label: 'Epithet', icon: '📜', text: character.epithet },
    { at: 9, label: 'Dossier', icon: '🗂️', text: redact(character.bio, character) },
  ];
}

export function cluesFor(mode: Exclude<ModeId, 'classic'>, clueId: string, character: Character): Clue[] {
  switch (mode) {
    case 'release':
      return releaseClues(releaseEntry(clueId), character);
    case 'quote':
      return quoteClues(quoteEntry(clueId), character);
    case 'emoji':
      return emojiClues(emojiEntry(clueId), character);
  }
}
