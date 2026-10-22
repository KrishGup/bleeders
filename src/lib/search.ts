import type { Character } from '../data/types';

/** Lowercase, strip diacritics (Tōshirō → toshiro) and punctuation. */
export function normalize(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9぀-ヿ㐀-鿿]+/g, ' ')
    .trim();
}

/**
 * A looser key that forgives the many ways Japanese names get romanised:
 * "Toushirou", "Toshirou" and "Tōshirō" all collapse to "toshiro".
 */
export function phonetic(input: string): string {
  return normalize(input)
    .replace(/ou/g, 'o')
    .replace(/(.)\1+/g, '$1')
    .replace(/\s+/g, '');
}

interface IndexedCharacter {
  character: Character;
  /** Normalised full name + aliases. */
  phrases: string[];
  /** Every individual word of those phrases. */
  words: string[];
  /** Phonetic keys of phrases (spaces removed). */
  keys: string[];
}

export interface SearchIndex {
  entries: IndexedCharacter[];
}

export function buildSearchIndex(characters: readonly Character[]): SearchIndex {
  return {
    entries: characters.map((character) => {
      const raw = [character.name, ...(character.aliases ?? [])];
      const phrases = raw.map(normalize).filter(Boolean);
      if (character.jp) phrases.push(normalize(character.jp));
      const words = [...new Set(phrases.flatMap((phrase) => phrase.split(' ')))];
      const keys = [...new Set(raw.map(phonetic))];
      return { character, phrases, words, keys };
    }),
  };
}

/** Levenshtein distance with an early exit once `max` is exceeded. */
export function editDistance(a: string, b: string, max = 2): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const value = Math.min(previous[j]! + 1, current[j - 1]! + 1, previous[j - 1]! + cost);
      current.push(value);
      rowMin = Math.min(rowMin, value);
    }
    if (rowMin > max) return max + 1;
    previous = current;
  }
  return previous[b.length]!;
}

function scoreEntry(entry: IndexedCharacter, query: string, queryKey: string): number {
  let best = 0;
  for (const phrase of entry.phrases) {
    if (phrase === query) return 1000;
    if (phrase.startsWith(query)) best = Math.max(best, 900 - phrase.length);
    else if (phrase.includes(` ${query}`)) best = Math.max(best, 800 - phrase.length);
    else if (phrase.includes(query)) best = Math.max(best, 600 - phrase.length);
  }
  if (best) return best;

  // Multi-word queries: every query word must prefix some word ("kur ich").
  const queryWords = query.split(' ');
  if (queryWords.length > 1 && queryWords.every((qw) => entry.words.some((w) => w.startsWith(qw)))) {
    return 700;
  }

  for (const key of entry.keys) {
    if (key.startsWith(queryKey)) best = Math.max(best, 500 - key.length);
    else if (key.includes(queryKey)) best = Math.max(best, 400 - key.length);
  }
  if (best || query.length < 4) return best;

  // Typo tolerance: compare against same-length word prefixes.
  const allowed = query.length >= 7 ? 2 : 1;
  for (const word of entry.words) {
    const distance = editDistance(query, word.slice(0, query.length), allowed);
    if (distance <= allowed) best = Math.max(best, 200 - distance * 50 - word.length);
  }
  return best;
}

export interface SearchOptions {
  exclude?: ReadonlySet<string>;
  limit?: number;
}

export function searchCharacters(index: SearchIndex, rawQuery: string, options: SearchOptions = {}): Character[] {
  const query = normalize(rawQuery);
  if (!query) return [];
  const queryKey = phonetic(rawQuery);
  const { exclude, limit = 8 } = options;

  const scored: { character: Character; score: number }[] = [];
  for (const entry of index.entries) {
    if (exclude?.has(entry.character.id)) continue;
    const score = scoreEntry(entry, query, queryKey);
    if (score > 0) scored.push({ character: entry.character, score });
  }
  scored.sort(
    (a, b) =>
      b.score - a.score || a.character.tier - b.character.tier || a.character.name.localeCompare(b.character.name),
  );
  return scored.slice(0, limit).map((entry) => entry.character);
}
