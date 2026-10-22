import { arcInfo, arcOrder, insigniaOf, RANK_GROUP } from '../data/taxonomy';
import type { Character } from '../data/types';

export type Verdict = 'correct' | 'partial' | 'wrong';
export type Arrow = 'up' | 'down';

export type AttributeKey = 'gender' | 'race' | 'affiliation' | 'rank' | 'insignia' | 'hair' | 'debut';

export interface AttributeInfo {
  key: AttributeKey;
  label: string;
  /** How a partial match / arrow works, shown in the help sheet & tooltips. */
  rule: string;
}

export const ATTRIBUTES: readonly AttributeInfo[] = [
  { key: 'gender', label: 'Gender', rule: 'Exact match only.' },
  { key: 'race', label: 'Race', rule: 'Yellow if at least one race overlaps (hybrids list several).' },
  { key: 'affiliation', label: 'Affiliation', rule: 'Yellow if at least one group overlaps.' },
  { key: 'rank', label: 'Rank', rule: 'Yellow for a related rank, e.g. Captain vs Former Captain.' },
  {
    key: 'insignia',
    label: 'Insignia',
    rule: 'Gotei division (Squad 0 = Royal Guard), Espada number (Fracción share their master’s) or Schrift letter. Arrows point toward the answer when both share a kind.',
  },
  { key: 'hair', label: 'Hair', rule: 'Yellow if at least one colour overlaps.' },
  { key: 'debut', label: 'Debut', rule: 'Debut arc in release order. Arrows point earlier or later.' },
];

export interface CellResult {
  key: AttributeKey;
  verdict: Verdict;
  /** Which way the answer lies (only for ordered attributes). */
  arrow?: Arrow;
  /** The guessed character's values, for display. */
  values: string[];
}

function compareSets<T>(guess: readonly T[], answer: readonly T[]): Verdict {
  const guessSet = new Set(guess);
  const answerSet = new Set(answer);
  let overlap = 0;
  for (const value of guessSet) if (answerSet.has(value)) overlap++;
  if (overlap === guessSet.size && overlap === answerSet.size) return 'correct';
  return overlap > 0 ? 'partial' : 'wrong';
}

function compareRank(guess: Character, answer: Character): Verdict {
  if (guess.rank === answer.rank) return 'correct';
  const group = RANK_GROUP[guess.rank];
  return !group.startsWith('solo:') && group === RANK_GROUP[answer.rank] ? 'partial' : 'wrong';
}

function compareOrdered(guess: number | null, answer: number | null): Pick<CellResult, 'verdict' | 'arrow'> {
  if (guess === answer) return { verdict: 'correct' };
  if (guess === null || answer === null) return { verdict: 'wrong' };
  return { verdict: 'wrong', arrow: answer > guess ? 'up' : 'down' };
}

function compareInsignia(guess: Character, answer: Character): Pick<CellResult, 'verdict' | 'arrow'> {
  const g = insigniaOf(guess);
  const a = insigniaOf(answer);
  if (!g || !a) return { verdict: g === a ? 'correct' : 'wrong' };
  if (g.kind !== a.kind) return { verdict: 'wrong' };
  return compareOrdered(g.order, a.order);
}

export function compareAttribute(key: AttributeKey, guess: Character, answer: Character): CellResult {
  switch (key) {
    case 'gender':
      return { key, values: [guess.gender], verdict: guess.gender === answer.gender ? 'correct' : 'wrong' };
    case 'race':
      return { key, values: guess.race, verdict: compareSets(guess.race, answer.race) };
    case 'affiliation':
      return { key, values: guess.affiliation, verdict: compareSets(guess.affiliation, answer.affiliation) };
    case 'rank':
      return { key, values: [guess.rank], verdict: compareRank(guess, answer) };
    case 'insignia':
      return {
        key,
        values: [insigniaOf(guess)?.label ?? 'None'],
        ...compareInsignia(guess, answer),
      };
    case 'hair':
      return { key, values: guess.hair, verdict: compareSets(guess.hair, answer.hair) };
    case 'debut':
      return {
        key,
        values: [arcInfo(guess.debut).short],
        ...compareOrdered(arcOrder(guess.debut), arcOrder(answer.debut)),
      };
  }
}

export function compareCharacters(guess: Character, answer: Character): CellResult[] {
  return ATTRIBUTES.map(({ key }) => compareAttribute(key, guess, answer));
}
