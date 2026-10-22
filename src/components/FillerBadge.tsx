import type { Character } from '../data/types';

export function FillerBadge({ character }: { character: Character }) {
  if (character.origin === 'canon') return null;
  return character.origin === 'movie' ? (
    <span className="badge-filler badge-filler--movie" title="Appears only in an animated film">
      Film
    </span>
  ) : (
    <span className="badge-filler" title="Anime-only (filler) character">
      Anime-only
    </span>
  );
}
