import type { ModeId } from '../data/types';
import { formatDay, puzzleNumber } from '../lib/date';
import { dailyKey, type GameRecord } from '../state/model';
import { useStore } from '../state/store';
import { Icon } from './Icon';

function resultOf(live: GameRecord | undefined, replay: GameRecord | undefined) {
  const record = live && live.status !== 'playing' ? live : (replay ?? live);
  if (!record || record.guesses.length === 0) return { tone: 'new', label: 'Unplayed' } as const;
  const n = record.guesses.length;
  if (record.status === 'won') {
    return {
      tone: 'won',
      label: `${n} ${n === 1 ? 'guess' : 'guesses'}`,
      live: record.kind === 'daily',
    } as const;
  }
  if (record.status === 'lost') return { tone: 'lost', label: 'Retreated' } as const;
  return { tone: 'playing', label: `${n} so far` } as const;
}

/** Every past daily for a mode, newest first. Replays never touch your streak. */
export function ArchiveList({ mode, today }: { mode: ModeId; today: number }) {
  const daily = useStore((s) => s.daily);
  const archive = useStore((s) => s.archive);

  if (today === 0) {
    return (
      <div className="archive-empty">
        <span className="kanji archive-empty__kanji">暦</span>
        <p>
          <strong>The archive opens tomorrow.</strong> Bleedle #1 is today’s puzzle — once a day passes, it
          lands here so you can replay anything you missed.
        </p>
        <a className="btn" href={`#/${mode}`}>
          Play today’s puzzle
        </a>
      </div>
    );
  }

  const days = Array.from({ length: today }, (_, i) => today - 1 - i);
  const solved = days.filter((day) => {
    const key = dailyKey(mode, day);
    return daily[key]?.status === 'won' || archive[key]?.status === 'won';
  }).length;

  return (
    <section className="archive" aria-label="Past puzzles">
      <p className="archive__summary">
        <Icon name="calendar" size={16} /> {solved} of {days.length} past puzzles solved · replays don’t
        affect your streak
      </p>
      <ul className="archive__grid">
        {days.map((day) => {
          const key = dailyKey(mode, day);
          const result = resultOf(daily[key], archive[key]);
          return (
            <li key={day}>
              <a className={`archive-day is-${result.tone}`} href={`#/${mode}/archive/${puzzleNumber(day)}`}>
                <span className="archive-day__num">#{puzzleNumber(day)}</span>
                <span className="archive-day__date">{formatDay(day)}</span>
                <span className="archive-day__result">
                  {result.tone === 'won' ? <Icon name="check" size={13} strokeWidth={3} /> : null}
                  {result.tone === 'lost' ? <Icon name="flag" size={13} /> : null}
                  {result.label}
                  {result.tone === 'won' && result.live ? (
                    <span className="archive-day__live">live</span>
                  ) : null}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
