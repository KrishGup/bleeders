/**
 * Core data model for Bleedle.
 *
 * Every character is described by the same seven guessable attributes used in
 * Classic mode, plus flavour fields (epithet, bio, Japanese name) used by the
 * Soul Registry, hints, and the victory screen.
 */

export type Gender = 'Male' | 'Female' | 'Unknown';

export type Race =
  | 'Human'
  | 'Shinigami'
  | 'Hollow'
  | 'Arrancar'
  | 'Visored'
  | 'Quincy'
  | 'Fullbringer'
  | 'Mod Soul'
  | 'Bount'
  | 'Soul'
  | 'Zanpakutō Spirit'
  | 'Shinenju'
  | 'Sinner'
  | 'Unknown';

export type Affiliation =
  | 'Gotei 13'
  | 'Kidō Corps'
  | 'Onmitsukidō'
  | 'Royal Guard'
  | 'Soul Society'
  | 'Kuchiki Clan'
  | 'Shihōin Clan'
  | 'Shiba Clan'
  | 'Kasumiōji Clan'
  | 'Visored'
  | 'Urahara Shop'
  | 'Karakura Town'
  | "Aizen's Army"
  | 'Hueco Mundo'
  | 'Wandenreich'
  | 'Xcution'
  | 'Bount'
  | 'Dark Ones'
  | 'Hell'
  | 'None';

export type Rank =
  | 'Captain-Commander'
  | 'Captain'
  | 'Former Captain'
  | 'Lieutenant'
  | 'Former Lieutenant'
  | 'Seated Officer'
  | 'Unseated Officer'
  | 'Royal Guard'
  | 'Substitute Shinigami'
  | 'Espada'
  | 'Former Espada'
  | 'Fracción'
  | 'Numeros'
  | 'Exequias'
  | 'Emperor'
  | 'Leader'
  | 'Grandmaster'
  | 'Schutzstaffel'
  | 'Sternritter'
  | 'Clan Head'
  | 'Noble'
  | 'Retainer'
  | 'Member'
  | 'Gatekeeper'
  | 'Student'
  | 'Civilian'
  | 'None';

export type Hair =
  | 'Black'
  | 'Brown'
  | 'Blonde'
  | 'Orange'
  | 'Red'
  | 'Pink'
  | 'Purple'
  | 'Blue'
  | 'Green'
  | 'White'
  | 'Silver'
  | 'Bald'
  | 'None';

export type ArcId =
  | 'substitute'
  | 'soul-society'
  | 'bount'
  | 'memories'
  | 'arrancar'
  | 'hueco-mundo'
  | 'diamonddust'
  | 'amagai'
  | 'fake-karakura'
  | 'fade-to-black'
  | 'zanpakuto'
  | 'hell-verse'
  | 'invasion'
  | 'lost-substitute'
  | 'tybw';

/** Where a character comes from: the manga, anime-only filler, or a film. */
export type Origin = 'canon' | 'filler' | 'movie';

/**
 * Prominence tier. Drives how often a character is chosen as the daily answer
 * (main cast shows up more often than one-scene side characters).
 * 1 = main / iconic · 2 = major supporting · 3 = supporting · 4 = deep cut
 */
export type Tier = 1 | 2 | 3 | 4;

export interface Character {
  /** Stable kebab-case id. Never rename: saved games reference it. */
  id: string;
  name: string;
  /** Japanese name, when known. */
  jp?: string;
  /** Extra search terms: given names, nicknames, alternate romanisations. */
  aliases?: string[];
  gender: Gender;
  race: Race[];
  affiliation: Affiliation[];
  rank: Rank;
  /** Gotei 13 division (0 = Royal Guard / Squad Zero), or null if none. */
  division: number | null;
  hair: Hair[];
  debut: ArcId;
  origin: Origin;
  tier: Tier;
  /** A title or role, shown as Classic mode's first hint. */
  epithet: string;
  /** One-sentence dossier, shown as a late hint (with the name redacted). */
  bio: string;
  /**
   * Espada number: their own (Privarón Espada use their 3-digit number), or —
   * for Fracción — the number of the Espada they serve.
   */
  espada?: number;
  /** Sternritter Schrift letter. */
  schrift?: string;
}

export type ModeId = 'classic' | 'release' | 'quote' | 'emoji';

export type ReleaseKind =
  'Shikai' | 'Bankai' | 'Resurrección' | 'Schrift' | 'Fullbring' | 'Bount Doll' | 'Power';

export interface ReleaseEntry {
  /** Unique id for this clue (a character may have several). */
  id: string;
  character: string;
  kind: ReleaseKind;
  /** The release / power name, revealed at the end. */
  name: string;
  /** Release command, without the name (e.g. "Scatter"). */
  command?: string;
  /** Sternritter Schrift letter (Schrift entries only). */
  letter?: string;
  /** Translation of the name. */
  meaning?: string;
  /** What the power does, in a sentence. */
  ability: string;
  /** A later, stronger clue: usually the Bankai or second release name. */
  extra?: string;
}

export interface QuoteEntry {
  id: string;
  character: string;
  text: string;
  /** Arc in which the line is said. */
  arc: ArcId;
  /** Who it's said to / when — a late hint. Must not name the speaker. */
  context: string;
}

export interface EmojiEntry {
  id: string;
  character: string;
  /** Exactly five emoji, revealed one per wrong guess. */
  emoji: [string, string, string, string, string];
}
