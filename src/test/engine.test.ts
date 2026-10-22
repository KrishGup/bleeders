import { describe, expect, it } from 'vitest';
import { characterById, EMOJIS, QUOTES, RELEASES } from '../data';
import {
  classicHints,
  emojiClues,
  initials,
  maskName,
  quoteClues,
  randomPuzzle,
  redact,
  releaseClues,
  releaseEntry,
} from '../game/engine';
import { buildShareText, classicGrid, streakLine } from '../game/share';
import { mulberry32 } from '../lib/hash';
import { initialsOf } from '../lib/monogram';
import type { GameRecord } from '../state/model';

describe('clue ladders', () => {
  it('masks names but keeps word shapes', () => {
    expect(maskName('Sode no Shirayuki')).toBe('S••• n• S••••••••');
    expect(maskName("Ruri'iro Kujaku")).toBe("R•••'••• K•••••");
    expect(initials('Ichigo Kurosaki')).toBe('I. K.');
    expect(initialsOf('Nelliel Tu Odelschwanck')).toBe('NO');
    expect(initialsOf('Kon')).toBe('K');
  });

  it('redacts every part of a name from hint text', () => {
    const ichigo = characterById('ichigo-kurosaki');
    expect(redact('Kurosaki fights. Ichigo wins. Strawberry!', ichigo)).toBe('▇▇▇ fights. ▇▇▇ wins. ▇▇▇!');
  });

  it('builds a four-step ladder for zanpakutō with commands', () => {
    const clues = releaseClues(releaseEntry('byakuya-kuchiki:shikai'));
    expect(clues.map((c) => c.at)).toEqual([0, 3, 6, 9]);
    expect(clues[0]!.text).toBe('“Scatter, S•••••••••••!”');
    expect(clues.some((c) => c.text.includes('Senbonzakura') && c.at === 0)).toBe(false);
  });

  it('opens Schrift clues with the letter', () => {
    const clues = releaseClues(releaseEntry('as-nodt:schrift'));
    expect(clues[0]).toMatchObject({ label: 'Schrift', text: '“F”', at: 0 });
    expect(clues[2]!.text).toBe('T•• F•••');
  });

  it('never leaks the release name before the masked step', () => {
    for (const entry of RELEASES) {
      const clues = releaseClues(entry);
      const early = clues.filter((c) => c.at < 6 && c.tone !== 'name');
      for (const clue of early) expect(clue.text.includes(entry.name), entry.id).toBe(false);
    }
  });

  it('reveals emoji one by one, then debut and initials', () => {
    const entry = EMOJIS[0]!;
    const clues = emojiClues(entry, characterById(entry.character));
    expect(clues.slice(0, 5).map((c) => c.at)).toEqual([0, 1, 2, 3, 4]);
    expect(clues.at(-1)!.label).toBe('Initials');
  });

  it('builds quote ladders and classic hints', () => {
    const quote = QUOTES[0]!;
    expect(quoteClues(quote, characterById(quote.character)).map((c) => c.label)).toEqual([
      'Quote',
      'Arc',
      'Context',
      'Initials',
    ]);
    const hints = classicHints(characterById('kenpachi-zaraki'));
    expect(hints.map((h) => h.at)).toEqual([5, 9]);
    expect(hints[1]!.text).not.toMatch(/Kenpachi|Zaraki/);
  });

  it('draws endless puzzles from the requested pool', () => {
    const random = mulberry32(7);
    for (let i = 0; i < 50; i++) {
      const puzzle = randomPuzzle('emoji', 'filler', random);
      expect(characterById(puzzle.answer).origin).not.toBe('canon');
      expect(puzzle.clue).toBe(`${puzzle.answer}:emoji`);
    }
  });
});

describe('share text', () => {
  const base: GameRecord = {
    mode: 'classic',
    kind: 'daily',
    day: 0,
    answer: 'renji-abarai',
    guesses: ['kenpachi-zaraki', 'byakuya-kuchiki', 'renji-abarai'],
    status: 'won',
    hints: [0],
    startedAt: 0,
  };

  it('renders the classic grid with arrows', () => {
    const rows = classicGrid(base, false);
    expect(rows).toHaveLength(3);
    expect(rows.at(-1)).toBe('🟩'.repeat(7));
    expect(rows[0]).toContain('⬇️');
  });

  it('collapses long games', () => {
    const long = { ...base, guesses: [...Array(12).fill('kon'), 'renji-abarai'] };
    const rows = classicGrid(long, false);
    expect(rows).toHaveLength(6);
    expect(rows[0]).toMatch(/^⋯ 8 earlier guesses/);
  });

  it('uses the colour-blind palette when asked', () => {
    expect(classicGrid(base, true).at(-1)).toBe('🟧'.repeat(7));
    expect(streakLine({ ...base, mode: 'quote', guesses: ['kon', 'renji-abarai'] }, false)).toBe('🟥🟩');
  });

  it('builds the full message', () => {
    const text = buildShareText(base, { colorblind: false, streak: 4, url: 'https://bleedle.test/' });
    expect(text.split('\n')[0]).toBe('Bleedle #1 · Classic 魂');
    expect(text).toContain('Found in 3 guesses 💡1 🔥4');
    expect(text.endsWith('https://bleedle.test/')).toBe(true);
  });
});
