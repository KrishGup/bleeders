import { describe, expect, it } from 'vitest';
import { CHARACTERS, EMOJIS, QUOTES, RELEASES, characterById, hasCharacter } from '../data';
import { ARCS, HAIR_COLOR, RACE_STYLE, RANK_GROUP } from '../data/taxonomy';
import type { Character } from '../data/types';
import { ATTRIBUTES, compareCharacters } from '../lib/compare';

const nameParts = (c: Character) =>
  [c.name, ...c.name.split(/\s+/)].filter((part) => part.replace(/[^\p{L}]/gu, '').length > 3);

/** Whole-word, case-insensitive mention check (matches how hints are redacted). */
const mentions = (text: string, part: string) =>
  new RegExp(`(^|[^\\p{L}])${part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^\\p{L}])`, 'iu').test(text);

describe('character roster', () => {
  it('has a large roster', () => {
    expect(CHARACTERS.length).toBeGreaterThanOrEqual(200);
  });

  it('uses unique kebab-case ids and unique names', () => {
    const ids = CHARACTERS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    const names = CHARACTERS.map((c) => c.name.toLowerCase());
    expect(new Set(names).size).toBe(names.length);
  });

  it('fills every attribute with known values', () => {
    const arcIds = new Set(ARCS.map((a) => a.id));
    for (const c of CHARACTERS) {
      expect(c.race.length, c.id).toBeGreaterThan(0);
      expect(c.affiliation.length, c.id).toBeGreaterThan(0);
      expect(c.hair.length, c.id).toBeGreaterThan(0);
      expect(new Set(c.race).size, `${c.id} race dupes`).toBe(c.race.length);
      expect(new Set(c.affiliation).size, `${c.id} affiliation dupes`).toBe(c.affiliation.length);
      expect(new Set(c.hair).size, `${c.id} hair dupes`).toBe(c.hair.length);
      for (const race of c.race) expect(RACE_STYLE[race], `${c.id} race ${race}`).toBeDefined();
      for (const hair of c.hair) expect(HAIR_COLOR[hair], `${c.id} hair ${hair}`).toBeDefined();
      expect(RANK_GROUP[c.rank], `${c.id} rank`).toBeDefined();
      expect(arcIds.has(c.debut), `${c.id} debut`).toBe(true);
      expect([1, 2, 3, 4]).toContain(c.tier);
      if (c.division !== null) {
        expect(Number.isInteger(c.division), c.id).toBe(true);
        expect(c.division, c.id).toBeGreaterThanOrEqual(0);
        expect(c.division, c.id).toBeLessThanOrEqual(13);
      }
      if (c.affiliation.includes('None')) expect(c.affiliation, c.id).toEqual(['None']);
      if (c.hair.includes('None') || c.hair.includes('Bald')) expect(c.hair.length, c.id).toBe(1);
    }
  });

  it('keeps hybrid races consistent', () => {
    for (const c of CHARACTERS) {
      if (c.race.includes('Visored')) expect(c.race, c.id).toEqual(expect.arrayContaining(['Shinigami', 'Hollow']));
      if (c.race.includes('Arrancar')) expect(c.race, c.id).toContain('Hollow');
      if (c.race.includes('Fullbringer')) expect(c.race, c.id).toContain('Human');
    }
  });

  it('gives the Royal Guard division Zero and only them', () => {
    for (const c of CHARACTERS) {
      expect(c.division === 0, c.id).toBe(c.affiliation.includes('Royal Guard'));
    }
  });

  it('writes epithets and bios as proper sentences without the character’s own name', () => {
    for (const c of CHARACTERS) {
      expect(c.epithet.trim().length, c.id).toBeGreaterThan(2);
      expect(c.bio, c.id).toMatch(/[.!?]$/);
      expect(c.bio.length, c.id).toBeLessThanOrEqual(200);
      for (const part of nameParts(c)) {
        expect(mentions(c.bio, part), `${c.id} bio mentions "${part}"`).toBe(false);
      }
    }
  });

  it('does not repeat aliases or the name itself', () => {
    for (const c of CHARACTERS) {
      const aliases = (c.aliases ?? []).map((a) => a.toLowerCase());
      expect(new Set(aliases).size, `${c.id} duplicate aliases`).toBe(aliases.length);
      expect(aliases, c.id).not.toContain(c.name.toLowerCase());
    }
  });

  it('includes plenty of filler and film characters', () => {
    const filler = CHARACTERS.filter((c) => c.origin !== 'canon');
    expect(filler.length).toBeGreaterThanOrEqual(40);
    expect(CHARACTERS.filter((c) => c.origin === 'movie').length).toBeGreaterThanOrEqual(5);
  });

  it('only has fully identical attribute rows for known twins', () => {
    const known = new Set(['loyd-lloyd|royd-lloyd']);
    const collisions: string[] = [];
    for (let i = 0; i < CHARACTERS.length; i++) {
      for (let j = i + 1; j < CHARACTERS.length; j++) {
        const a = CHARACTERS[i]!;
        const b = CHARACTERS[j]!;
        if (compareCharacters(a, b).every((cell) => cell.verdict === 'correct')) {
          collisions.push([a.id, b.id].sort().join('|'));
        }
      }
    }
    const unexpected = collisions.filter((pair) => !known.has(pair));
    // A handful of look-alikes is unavoidable; keep it rare so Classic stays fair.
    expect(unexpected.length, unexpected.join('\n')).toBeLessThanOrEqual(12);
  });

  it('defines every Classic attribute', () => {
    expect(ATTRIBUTES.map((a) => a.key)).toEqual([
      'gender',
      'race',
      'affiliation',
      'rank',
      'insignia',
      'hair',
      'debut',
    ]);
  });
});

describe('mode data', () => {
  it('links every release, quote and emoji entry to a real character', () => {
    for (const entry of [...RELEASES, ...QUOTES, ...EMOJIS]) {
      expect(hasCharacter(entry.character), entry.id).toBe(true);
    }
  });

  it('uses unique entry ids', () => {
    for (const list of [RELEASES, QUOTES, EMOJIS]) {
      const ids = list.map((e) => e.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('has healthy pool sizes', () => {
    expect(new Set(RELEASES.map((e) => e.character)).size).toBeGreaterThanOrEqual(80);
    expect(new Set(QUOTES.map((e) => e.character)).size).toBeGreaterThanOrEqual(25);
    expect(new Set(EMOJIS.map((e) => e.character)).size).toBeGreaterThanOrEqual(120);
  });

  it('gives every Schrift a letter, and every opener something to show', () => {
    for (const r of RELEASES) {
      if (r.kind === 'Schrift') expect(r.letter, r.id).toMatch(/^[A-Z]$/);
      expect(r.ability.length, r.id).toBeGreaterThan(10);
      expect(r.ability, r.id).toMatch(/[.!?]$/);
    }
  });

  it('never names the wielder inside a release ability', () => {
    for (const r of RELEASES) {
      for (const part of nameParts(characterById(r.character))) {
        expect(mentions(r.ability, part), `${r.id}: ${part}`).toBe(false);
      }
    }
  });

  it('never names the speaker inside a quote or its context', () => {
    for (const quote of QUOTES) {
      const speaker = characterById(quote.character);
      for (const part of nameParts(speaker)) {
        expect(mentions(quote.context, part), `${quote.id} context: ${part}`).toBe(false);
        expect(mentions(quote.text, part), `${quote.id} text: ${part}`).toBe(false);
      }
    }
  });

  it('uses five distinct emoji per character', () => {
    for (const entry of EMOJIS) {
      expect(entry.emoji).toHaveLength(5);
      expect(new Set(entry.emoji).size, entry.id).toBe(5);
    }
  });
});
