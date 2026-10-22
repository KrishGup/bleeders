import { memo, useId } from 'react';
import { HAIR_COLOR, KANJI_NUMBERS, RACE_STYLE } from '../data/taxonomy';
import type { Character } from '../data/types';
import { initialsOf } from '../lib/monogram';

function shade(hex: string, amount: number): string {
  const n = Number.parseInt(hex.slice(1), 16);
  const mix = (c: number) => Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount);
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function badgeText(character: Character): string | null {
  if (character.division !== null) return KANJI_NUMBERS[character.division] ?? String(character.division);
  if (character.schrift) return character.schrift;
  if (character.espada !== undefined && character.rank !== 'Fracción') return String(character.espada);
  return null;
}

interface AvatarProps {
  character: Character;
  size?: number;
  className?: string;
  /** Hide the insignia badge (for tiny sizes). */
  plain?: boolean;
}

const C = 2 * Math.PI * 29.5;

/**
 * A generated "soul crest" for a character: hair-colour gradient, a ring
 * segmented by race, initials, and an insignia badge (division kanji, Espada
 * number or Schrift letter). Original art — no copyrighted imagery.
 */
export const Avatar = memo(function Avatar({ character, size = 44, className, plain }: AvatarProps) {
  const uid = useId().replace(/:/g, '');
  const primary = HAIR_COLOR[character.hair[0]!];
  const second = character.hair[1] ? HAIR_COLOR[character.hair[1]].fill : shade(primary.fill, -0.42);
  const races = character.race.slice(0, 4);
  const segment = C / races.length;
  const gap = races.length > 1 ? 5 : 0;
  const badge = plain ? null : badgeText(character);
  const initials = initialsOf(character.name);

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={['avatar', className].filter(Boolean).join(' ')}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${uid}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={shade(primary.fill, 0.12)} />
          <stop offset="1" stopColor={second} />
        </linearGradient>
        <radialGradient id={`${uid}-v`} cx="0.32" cy="0.26" r="0.95">
          <stop offset="0" stopColor="#fff" stopOpacity="0.32" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.38" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="27" fill={`url(#${uid}-g)`} />
      <circle cx="32" cy="32" r="27" fill={`url(#${uid}-v)`} />
      <g transform="rotate(-90 32 32)">
        {races.map((race, i) => (
          <circle
            key={race}
            cx="32"
            cy="32"
            r="29.5"
            fill="none"
            stroke={RACE_STYLE[race].ring}
            strokeWidth="4"
            strokeDasharray={`${segment - gap} ${C}`}
            strokeDashoffset={-i * segment - gap / 2}
            strokeLinecap="butt"
          />
        ))}
      </g>
      <text
        x="32"
        y="33.5"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="Cinzel, Georgia, serif"
        fontWeight="700"
        fontSize={initials.length > 1 ? 21 : 26}
        letterSpacing="0.5"
        fill={primary.ink}
        style={{ paintOrder: 'stroke' }}
        stroke={shade(second, -0.3)}
        strokeOpacity="0.35"
        strokeWidth="1.2"
      >
        {initials}
      </text>
      {badge ? (
        <g>
          <circle
            cx="51"
            cy="51"
            r="11.5"
            fill="#0d0d12"
            stroke={RACE_STYLE[races[0]!].ring}
            strokeWidth="2"
          />
          <text
            x="51"
            y="51.5"
            textAnchor="middle"
            dominantBaseline="central"
            style={{ fontFamily: /^[A-Z0-9]+$/.test(badge) ? 'Cinzel, Georgia, serif' : 'var(--font-kanji)' }}
            fontWeight="800"
            fontSize={badge.length > 2 ? 8 : badge.length === 2 ? 10 : 12.5}
            fill="#f4f2ec"
          >
            {badge}
          </text>
        </g>
      ) : null}
    </svg>
  );
});
