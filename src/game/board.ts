import { CHARACTERS } from '../data';
import type { Character } from '../data/types';
import { ATTRIBUTES, compareCharacters } from '../lib/compare';

/** Seconds between each tile flip in a Classic row. */
export const FLIP_STAGGER = 0.16;
/** How long a full row takes to reveal, in ms. */
export const FLIP_TOTAL_MS = Math.round((ATTRIBUTES.length * FLIP_STAGGER + 0.55) * 1000);

/** Characters whose seven Classic attributes are identical to `guess`. */
export function twinsOf(guess: Character): Character[] {
  return CHARACTERS.filter(
    (other) =>
      other.id !== guess.id && compareCharacters(other, guess).every((cell) => cell.verdict === 'correct'),
  );
}
