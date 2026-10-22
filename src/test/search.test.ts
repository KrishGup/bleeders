import { describe, expect, it } from 'vitest';
import { CHARACTERS } from '../data';
import { buildSearchIndex, editDistance, normalize, phonetic, searchCharacters } from '../lib/search';

const index = buildSearchIndex(CHARACTERS);
const top = (query: string) => searchCharacters(index, query)[0]?.id;

describe('search', () => {
  it('normalises macrons and punctuation', () => {
    expect(normalize('Tōshirō Hitsugaya')).toBe('toshiro hitsugaya');
    expect(normalize("Ruri'iro")).toBe('ruri iro');
    expect(phonetic('Toushirou')).toBe(phonetic('Tōshirō'));
  });

  it('finds characters by first name, surname, alias and nickname', () => {
    expect(top('ichigo')).toBe('ichigo-kurosaki');
    expect(top('kurosaki')).toBe('ichigo-kurosaki');
    expect(top('chad')).toBe('yasutora-sado');
    expect(top('shiro-chan')).toBe('toshiro-hitsugaya');
    expect(top('soi fon')).toBe('soi-fon');
    expect(top('sui feng')).toBe('soi-fon');
    expect(top('hichigo')).toBe('hollow-ichigo');
  });

  it('forgives romanisation differences and typos', () => {
    expect(top('toushirou')).toBe('toshiro-hitsugaya');
    expect(top('ulqiorra')).toBe('ulquiorra-cifer');
    expect(top('grimjow')).toBe('grimmjow-jaegerjaquez');
  });

  it('supports multi-word prefixes', () => {
    expect(top('kur ich')).toBe('ichigo-kurosaki');
  });

  it('searches Japanese names', () => {
    expect(top('黒崎 一護')).toBe('ichigo-kurosaki');
  });

  it('excludes guessed characters and respects the limit', () => {
    const results = searchCharacters(index, 'ku', { exclude: new Set(['rukia-kuchiki']), limit: 5 });
    expect(results).toHaveLength(5);
    expect(results.some((c) => c.id === 'rukia-kuchiki')).toBe(false);
  });

  it('measures edit distance with an early exit', () => {
    expect(editDistance('kitten', 'sitting', 3)).toBe(3);
    expect(editDistance('abc', 'abcdefgh', 2)).toBe(3);
  });
});
