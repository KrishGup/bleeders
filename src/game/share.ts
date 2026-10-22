import { characterById } from '../data';
import { modeInfo } from '../data/taxonomy';
import { compareCharacters, type CellResult } from '../lib/compare';
import { puzzleNumber } from '../lib/date';
import type { GameRecord } from '../state/model';

export interface ShareOptions {
  colorblind: boolean;
  streak: number;
  url: string;
}

function cellEmoji(cell: CellResult, colorblind: boolean): string {
  if (cell.verdict === 'correct') return colorblind ? '🟧' : '🟩';
  if (cell.verdict === 'partial') return colorblind ? '🟦' : '🟨';
  if (cell.arrow === 'up') return '⬆️';
  if (cell.arrow === 'down') return '⬇️';
  return colorblind ? '⬛' : '🟥';
}

const MAX_ROWS = 6;

export function classicGrid(record: GameRecord, colorblind: boolean): string[] {
  const answer = characterById(record.answer);
  const rows = record.guesses.map((id) =>
    compareCharacters(characterById(id), answer)
      .map((cell) => cellEmoji(cell, colorblind))
      .join(''),
  );
  if (rows.length <= MAX_ROWS) return rows;
  const hidden = rows.length - (MAX_ROWS - 1);
  return [`⋯ ${hidden} earlier ${hidden === 1 ? 'guess' : 'guesses'}`, ...rows.slice(-(MAX_ROWS - 1))];
}

export function streakLine(record: GameRecord, colorblind: boolean): string {
  const hit = colorblind ? '🟧' : '🟩';
  const miss = colorblind ? '⬛' : '🟥';
  const misses = record.status === 'won' ? record.guesses.length - 1 : record.guesses.length;
  const tail = record.status === 'won' ? hit : '🏳️';
  if (misses <= 12) return miss.repeat(misses) + tail;
  return `${miss.repeat(10)} ⋯ +${misses - 10} ${tail}`;
}

export function buildShareText(record: GameRecord, options: ShareOptions): string {
  const mode = modeInfo(record.mode);
  const title =
    record.kind === 'daily'
      ? `Bleedle #${puzzleNumber(record.day ?? 0)} · ${mode.title} ${mode.kanji}`
      : `Bleedle Endless · ${mode.title} ${mode.kanji}`;
  const count = record.guesses.length;
  const result =
    record.status === 'won'
      ? `⚔️ Found in ${count} ${count === 1 ? 'guess' : 'guesses'}`
      : `🏳️ Retreated after ${count} ${count === 1 ? 'guess' : 'guesses'}`;
  const extras = [
    record.mode === 'classic' && record.hints.length > 0 ? `💡${record.hints.length}` : '',
    options.streak > 1 && record.kind === 'daily' ? `🔥${options.streak}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  const body =
    record.mode === 'classic'
      ? classicGrid(record, options.colorblind)
      : [streakLine(record, options.colorblind)];
  return [title, extras ? `${result} ${extras}` : result, ...body, options.url].join('\n');
}
