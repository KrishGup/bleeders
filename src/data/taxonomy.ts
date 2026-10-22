import type { Affiliation, ArcId, Character, Hair, ModeId, Race, Rank } from './types';

export interface ArcInfo {
  id: ArcId;
  name: string;
  /** Compact label for tiles. */
  short: string;
  span: string;
  kind: 'canon' | 'filler' | 'movie';
}

/**
 * Story arcs in real-world release order (anime broadcast order, with films
 * slotted where they premiered). Classic mode's Debut arrows compare positions
 * in this list, so the order matters.
 */
export const ARCS: readonly ArcInfo[] = [
  { id: 'substitute', name: 'Substitute Shinigami', short: 'Substitute', span: 'Ep. 1–20', kind: 'canon' },
  { id: 'soul-society', name: 'Soul Society', short: 'Soul Society', span: 'Ep. 21–63', kind: 'canon' },
  { id: 'bount', name: 'Bount', short: 'Bount', span: 'Ep. 64–109 · filler', kind: 'filler' },
  { id: 'memories', name: 'Memories of Nobody', short: 'Memories', span: 'Film · 2006', kind: 'movie' },
  { id: 'arrancar', name: 'Arrancar', short: 'Arrancar', span: 'Ep. 110–131', kind: 'canon' },
  { id: 'hueco-mundo', name: 'Hueco Mundo', short: 'Hueco Mundo', span: 'Ep. 132–167', kind: 'canon' },
  {
    id: 'diamonddust',
    name: 'The DiamondDust Rebellion',
    short: 'DiamondDust',
    span: 'Film · 2007',
    kind: 'movie',
  },
  { id: 'amagai', name: 'New Captain Amagai', short: 'Amagai', span: 'Ep. 168–189 · filler', kind: 'filler' },
  {
    id: 'fake-karakura',
    name: 'Fake Karakura Town',
    short: 'Fake Karakura',
    span: 'Ep. 190–229, 266–316',
    kind: 'canon',
  },
  { id: 'fade-to-black', name: 'Fade to Black', short: 'Fade to Black', span: 'Film · 2008', kind: 'movie' },
  {
    id: 'zanpakuto',
    name: 'Zanpakutō Unknown Tales',
    short: 'Zanpakutō Tales',
    span: 'Ep. 230–265 · filler',
    kind: 'filler',
  },
  { id: 'hell-verse', name: 'Hell Verse', short: 'Hell Verse', span: 'Film · 2010', kind: 'movie' },
  {
    id: 'invasion',
    name: 'Gotei 13 Invading Army',
    short: 'Gotei Invasion',
    span: 'Ep. 317–342 · filler',
    kind: 'filler',
  },
  {
    id: 'lost-substitute',
    name: 'Lost Substitute Shinigami',
    short: 'Lost Substitute',
    span: 'Ep. 343–366',
    kind: 'canon',
  },
  { id: 'tybw', name: 'Thousand-Year Blood War', short: 'Blood War', span: 'TYBW', kind: 'canon' },
];

const ARC_INDEX = new Map(ARCS.map((arc, index) => [arc.id, index]));

export function arcOrder(id: ArcId): number {
  const index = ARC_INDEX.get(id);
  if (index === undefined) throw new Error(`Unknown arc: ${id}`);
  return index;
}

export function arcInfo(id: ArcId): ArcInfo {
  return ARCS[arcOrder(id)]!;
}

/**
 * Ranks that belong to the same group score a partial (yellow) match in Classic
 * mode — e.g. "Captain" vs "Former Captain". Ranks in `solo` groups only ever
 * match exactly.
 */
export const RANK_GROUP: Record<Rank, string> = {
  'Captain-Commander': 'captain',
  Captain: 'captain',
  'Former Captain': 'captain',
  Lieutenant: 'lieutenant',
  'Former Lieutenant': 'lieutenant',
  'Seated Officer': 'seated',
  'Unseated Officer': 'seated',
  'Royal Guard': 'solo:royal',
  'Substitute Shinigami': 'solo:substitute',
  Espada: 'espada',
  'Former Espada': 'espada',
  Fracción: 'arrancar',
  Numeros: 'arrancar',
  Exequias: 'arrancar',
  Emperor: 'leader',
  Leader: 'leader',
  Grandmaster: 'sternritter',
  Schutzstaffel: 'sternritter',
  Sternritter: 'sternritter',
  'Clan Head': 'noble',
  Noble: 'noble',
  Retainer: 'noble',
  Member: 'solo:member',
  Gatekeeper: 'solo:gatekeeper',
  Student: 'civilian',
  Civilian: 'civilian',
  None: 'solo:none',
};

export const RANK_NOTE: Partial<Record<Rank, string>> = {
  'Former Captain': 'Held a captaincy in the past',
  'Former Lieutenant': 'Was a lieutenant in the past',
  'Former Espada': 'Privarón Espada or a demoted Espada',
  Numeros: 'Rank-and-file numbered Arrancar',
  Schutzstaffel: "Yhwach's personal guard",
  Grandmaster: 'Leader of the Sternritter',
};

/** Swatches for the hair tile and the avatar crest. */
export const HAIR_COLOR: Record<Hair, { fill: string; ink: string }> = {
  Black: { fill: '#22232a', ink: '#f5f5f7' },
  Brown: { fill: '#7b4a2a', ink: '#fff7ef' },
  Blonde: { fill: '#f2d06b', ink: '#2b2209' },
  Orange: { fill: '#ff8a2b', ink: '#2a1503' },
  Red: { fill: '#d42f3a', ink: '#fff2f2' },
  Pink: { fill: '#ff8fc6', ink: '#3a0f24' },
  Purple: { fill: '#8d5cf6', ink: '#f6f0ff' },
  Blue: { fill: '#3b9cff', ink: '#06182c' },
  Green: { fill: '#3fbf73', ink: '#04210f' },
  White: { fill: '#f3f3f0', ink: '#1d1d22' },
  Silver: { fill: '#b9bfca', ink: '#15171c' },
  Bald: { fill: '#e2bb93', ink: '#2c1a0b' },
  None: { fill: '#55575f', ink: '#f2f2f2' },
};

export interface RaceStyle {
  ring: string;
  accent: string;
  glyph: string;
}

/** Ring colour + tiny glyph for each race, used by the avatar crest. */
export const RACE_STYLE: Record<Race, RaceStyle> = {
  Shinigami: { ring: '#0c0c10', accent: '#f4f4f6', glyph: '死' },
  Human: { ring: '#f59e0b', accent: '#fff7e6', glyph: '人' },
  Hollow: { ring: '#efe9dc', accent: '#c2272d', glyph: '虚' },
  Arrancar: { ring: '#e7e5e4', accent: '#0f766e', glyph: '破' },
  Visored: { ring: '#e9e6df', accent: '#111114', glyph: '仮' },
  Quincy: { ring: '#2f7bf6', accent: '#e6f0ff', glyph: '滅' },
  Fullbringer: { ring: '#a855f7', accent: '#f5ecff', glyph: '完' },
  'Mod Soul': { ring: '#facc15', accent: '#2a2205', glyph: '改' },
  Bount: { ring: '#10b981', accent: '#eafff6', glyph: '霊' },
  Soul: { ring: '#94a3b8', accent: '#0f172a', glyph: '魂' },
  'Zanpakutō Spirit': { ring: '#14b8a6', accent: '#effffc', glyph: '刀' },
  Shinenju: { ring: '#f472b6', accent: '#2a0a1b', glyph: '珠' },
  Sinner: { ring: '#b91c1c', accent: '#fff0f0', glyph: '罪' },
  Unknown: { ring: '#6b7280', accent: '#f3f4f6', glyph: '謎' },
};

/** Short labels so long affiliations fit inside a tile. */
export const AFFILIATION_SHORT: Partial<Record<Affiliation, string>> = {
  "Aizen's Army": "Aizen's Army",
  'Karakura Town': 'Karakura',
  'Kasumiōji Clan': 'Kasumiōji',
  'Kuchiki Clan': 'Kuchiki Clan',
  'Shihōin Clan': 'Shihōin Clan',
};

export const KANJI_NUMBERS = [
  '零',
  '一',
  '二',
  '三',
  '四',
  '五',
  '六',
  '七',
  '八',
  '九',
  '十',
  '十一',
  '十二',
  '十三',
];

export type InsigniaKind = 'division' | 'espada' | 'schrift';

/**
 * Classic mode's Insignia column folds three numbering systems into one: a
 * Gotei 13 division (0 = Royal Guard), an Espada number (Fracción share their
 * master's), or a Sternritter's Schrift letter. Arrows only compare within
 * the same kind.
 */
export interface Insignia {
  kind: InsigniaKind;
  order: number;
  /** Compact tile label. */
  label: string;
  /** Full description for tooltips. */
  long: string;
}

const ORDINAL_SUFFIX = ['th', 'st', 'nd', 'rd'];
export function ordinal(n: number): string {
  const mod100 = n % 100;
  const suffix = mod100 >= 11 && mod100 <= 13 ? 'th' : (ORDINAL_SUFFIX[n % 10] ?? 'th');
  return `${n}${suffix}`;
}

export function insigniaOf(character: Character): Insignia | null {
  const { division, espada, schrift, rank } = character;
  if (division !== null) {
    return division === 0
      ? { kind: 'division', order: 0, label: 'Squad 0', long: 'Royal Guard — Squad Zero' }
      : {
          kind: 'division',
          order: division,
          label: `Div. ${division}`,
          long: `${ordinal(division)} Division`,
        };
  }
  if (espada !== undefined) {
    if (espada > 100)
      return { kind: 'espada', order: espada, label: `#${espada}`, long: `Privarón Espada #${espada}` };
    const serves = rank === 'Fracción' || rank === 'None';
    return {
      kind: 'espada',
      order: espada,
      label: `Espada ${espada}`,
      long: serves ? `Serves the ${ordinal(espada)} Espada` : `${ordinal(espada)} Espada`,
    };
  }
  if (schrift) {
    return {
      kind: 'schrift',
      order: schrift.charCodeAt(0) - 64,
      label: `“${schrift}”`,
      long: `Schrift “${schrift}”`,
    };
  }
  return null;
}

export function insigniaLabel(character: Character): string {
  return insigniaOf(character)?.label ?? 'None';
}

export interface ModeInfo {
  id: ModeId;
  title: string;
  kanji: string;
  reading: string;
  tagline: string;
  /** CSS custom property suffix: --mode-classic etc. */
  accent: string;
}

export const MODES: readonly ModeInfo[] = [
  {
    id: 'classic',
    title: 'Classic',
    kanji: '魂',
    reading: 'tamashii · soul',
    tagline: 'Deduce the soul from race, rank, insignia and more.',
    accent: 'classic',
  },
  {
    id: 'release',
    title: 'Release',
    kanji: '解',
    reading: 'kai · release',
    tagline: 'Name the wielder from a release command or power.',
    accent: 'release',
  },
  {
    id: 'quote',
    title: 'Quote',
    kanji: '言',
    reading: 'koto · words',
    tagline: 'Who said it? One line, a whole lot of attitude.',
    accent: 'quote',
  },
  {
    id: 'emoji',
    title: 'Emoji',
    kanji: '絵',
    reading: 'e · picture',
    tagline: 'Five emoji. One character. Each miss reveals another.',
    accent: 'emoji',
  },
];

export function modeInfo(id: ModeId): ModeInfo {
  const mode = MODES.find((m) => m.id === id);
  if (!mode) throw new Error(`Unknown mode: ${id}`);
  return mode;
}
