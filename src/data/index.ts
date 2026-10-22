import { FILLER } from './characters/filler';
import { FULLBRINGERS } from './characters/fullbringers';
import { GOTEI } from './characters/gotei';
import { HOLLOWS } from './characters/hollows';
import { KARAKURA } from './characters/karakura';
import { MOVIES } from './characters/movies';
import { QUINCY } from './characters/quincy';
import { SOUL_SOCIETY } from './characters/soul-society';
import { EMOJIS } from './emoji';
import { QUOTES } from './quotes';
import { RELEASES } from './releases';
import type { Character } from './types';

export const CHARACTERS: readonly Character[] = [
  ...KARAKURA,
  ...GOTEI,
  ...SOUL_SOCIETY,
  ...HOLLOWS,
  ...QUINCY,
  ...FULLBRINGERS,
  ...FILLER,
  ...MOVIES,
];

const BY_ID = new Map(CHARACTERS.map((character) => [character.id, character]));

export function hasCharacter(id: string): boolean {
  return BY_ID.has(id);
}

export function characterById(id: string): Character {
  const character = BY_ID.get(id);
  if (!character) throw new Error(`Unknown character: ${id}`);
  return character;
}

export { EMOJIS, QUOTES, RELEASES };
