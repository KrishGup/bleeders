import { describe, expect, it } from 'vitest';
import glyphs from '../assets/fonts/glyphs.json';

const CJK = /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uff00-\uffef]/gu;
const JP_FIELD = /\bjp:\s*'([^']*)'/g;

const sources = import.meta.glob(['../**/*.{ts,tsx,css}', '!../test/**', '!../assets/**'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

/**
 * The decorative Japanese fonts are subset to exactly the glyphs Bleedle uses
 * (see scripts/subset-fonts.py). If this fails, run `npm run fonts`.
 */
describe('font subsets', () => {
  it('cover every Japanese character in the source', () => {
    const ui = new Set(glyphs.ui);
    const names = new Set(glyphs.names);
    const missing = new Set<string>();
    for (const [path, text] of Object.entries(sources)) {
      let body = text;
      if (path.includes('/characters/')) {
        for (const match of text.matchAll(JP_FIELD)) {
          for (const ch of match[1]!.match(CJK) ?? []) if (!names.has(ch)) missing.add(ch);
        }
        body = text.replace(JP_FIELD, '');
      }
      for (const ch of body.match(CJK) ?? []) if (!ui.has(ch)) missing.add(ch);
    }
    expect([...missing].join('')).toBe('');
  });
});
