import { useRef, useState, type ReactNode } from 'react';
import { CHARACTERS } from '../data';
import { MODES, modeInfo, type ModeInfo } from '../data/taxonomy';
import type { ModeId } from '../data/types';
import { ACHIEVEMENTS } from '../game/achievements';
import { RELEASE_STEPS } from '../game/engine';
import { useToday } from '../hooks/useToday';
import { ATTRIBUTES } from '../lib/compare';
import { formatDay, puzzleNumber } from '../lib/date';
import { sfx } from '../lib/sound';
import { displayStreak } from '../state/actions';
import {
  dailyKey,
  emptyStats,
  hydrate,
  initialState,
  statsKey,
  type PersistedState,
  type Settings,
} from '../state/model';
import { dailyStatus } from '../state/status';
import { STORAGE_KEY, store, useStore } from '../state/store';
import { ui, useUI } from '../state/ui';
import { Icon, type IconName } from './Icon';
import { ConfirmDialog, Modal } from './Modal';
import { Segmented } from './Segmented';

const APP_VERSION = '1.0.0';

function Switch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: ReactNode;
}) {
  return (
    <div className="setting">
      <span className="setting__text">
        <span className="setting__label">{label}</span>
        {description ? <span className="setting__desc">{description}</span> : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={`switch${checked ? ' is-on' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span className="switch__thumb" />
      </button>
    </div>
  );
}

// — How to play ———————————————————————————————————————————————————————————

function HelpBody({ mode }: { mode: ModeId }) {
  if (mode === 'classic') {
    return (
      <>
        <p className="help__lead">
          Guess today’s hidden character. Each guess flips seven tiles comparing your pick with the answer.
        </p>
        <div className="help__legend">
          <span className="help__tile is-correct">Exact</span>
          <span className="help__tile is-partial">Partial</span>
          <span className="help__tile is-wrong">Wrong</span>
          <span className="help__tile is-wrong">
            <Icon name="up" size={16} /> Higher
          </span>
        </div>
        <ul className="help__rules">
          {ATTRIBUTES.map((attribute) => (
            <li key={attribute.key}>
              <strong>{attribute.label}</strong> — {attribute.rule}
            </li>
          ))}
        </ul>
        <p className="help__note">
          <Icon name="hint" size={16} />
          <span>
            Stuck? After 5 misses you can reveal the answer’s <em>epithet</em>, and after 9 a redacted{' '}
            <em>dossier</em>. Hints are optional and show up in your share.
          </span>
        </p>
        <p className="help__note">
          <Icon name="users" size={16} />
          <span>
            A few souls share every attribute (twins, look-alike Fracción…). If your guess turns all green but
            isn’t the answer, Bleedle lists its look-alikes for you.
          </span>
        </p>
      </>
    );
  }
  if (mode === 'release') {
    return (
      <>
        <p className="help__lead">
          A Zanpakutō release command, Bankai, Resurrección, Quincy Schrift, Fullbring or Bount doll is
          revealed. Name its wielder.
        </p>
        <ul className="help__rules">
          <li>
            The opener is a release command (with the name hidden), a Schrift letter or the name’s meaning.
          </li>
          <li>
            More clues unlock after {RELEASE_STEPS.slice(1).join(', ')} wrong guesses: what the power does,
            its meaning or wielder, a masked name, and finally a stronger extra clue.
          </li>
          <li>Only characters who have a release clue appear in the suggestions.</li>
        </ul>
      </>
    );
  }
  if (mode === 'quote') {
    return (
      <>
        <p className="help__lead">Who said it? Guess the speaker of one memorable line.</p>
        <ul className="help__rules">
          <li>After 3 misses you learn the arc, after 6 the context, and after 9 the speaker’s initials.</li>
          <li>Quotes follow the common English translations.</li>
        </ul>
      </>
    );
  }
  return (
    <>
      <p className="help__lead">Five emoji describe one character. One is shown at the start.</p>
      <ul className="help__rules">
        <li>Every wrong guess reveals another emoji — they get more obvious as they go.</li>
        <li>After 7 misses you learn the debut arc, and after 10 the initials.</li>
      </ul>
    </>
  );
}

function HelpSheet({ initial }: { initial: ModeId }) {
  const [mode, setMode] = useState<ModeId>(initial);
  return (
    <div className="help" data-mode={mode}>
      <Segmented
        label="Mode"
        value={mode}
        onChange={setMode}
        options={MODES.map((m) => ({
          value: m.id,
          label: (
            <>
              {m.kanji} {m.title}
            </>
          ),
        }))}
      />
      <div className="help__body">
        <HelpBody mode={mode} />
      </div>
      <hr className="divider" />
      <ul className="help__general">
        <li>
          <Icon name="sparkles" size={16} />
          <span>
            <strong>Classic</strong> is the main daily puzzle. Release, Quote and Emoji are quick bonus modes
            with their own streaks.
          </span>
        </li>
        <li>
          <Icon name="calendar" size={16} />
          <span>New souls arrive every day at your local midnight — the same puzzles for everyone.</span>
        </li>
        <li>
          <Icon name="infinity" size={16} />
          <span>Guesses are unlimited. Giving up reveals the answer but breaks your streak.</span>
        </li>
        <li>
          <Icon name="clock" size={16} />
          <span>
            Missed a day? Replay any past puzzle from the <strong>Archive</strong>, or train forever in{' '}
            <strong>Endless</strong>. Neither touches your streak.
          </span>
        </li>
        <li>
          <Icon name="flame" size={16} />
          <span>
            Solve all four daily modes in one day to achieve <strong>Bankai</strong>.
          </span>
        </li>
        <li>
          <Icon name="book" size={16} />
          <span>
            {CHARACTERS.length} souls, including anime-only filler and film characters (marked with a badge).
          </span>
        </li>
      </ul>
    </div>
  );
}

// — Statistics ——————————————————————————————————————————————————————————————

function StatsSheet({ initial }: { initial: ModeId }) {
  const [mode, setMode] = useState<ModeId>(initial);
  const [kind, setKind] = useState<'daily' | 'endless' | 'archive'>('daily');
  const state = useStore((s) => s);
  const today = useToday();
  const stats = state.stats[statsKey(mode, kind)] ?? emptyStats();
  const todays = state.daily[dailyKey(mode, today)];
  const winRate = stats.played ? Math.round((stats.won / stats.played) * 100) : 0;
  const average = stats.won ? (stats.totalGuesses / Math.max(1, stats.played)).toFixed(1) : '—';
  const streak = kind === 'daily' ? displayStreak(state, mode, today) : stats.currentStreak;
  // Replays have no streaks; show how much of the back catalogue is cleared instead.
  const pastSolved =
    kind === 'archive'
      ? Array.from({ length: today }, (_, day) => dailyKey(mode, day)).filter(
          (key) => state.daily[key]?.status === 'won' || state.archive[key]?.status === 'won',
        ).length
      : 0;

  const buckets = Array.from({ length: 10 }, (_, i) => {
    const n = i + 1;
    const value =
      n < 10
        ? (stats.distribution[n] ?? 0)
        : Object.entries(stats.distribution)
            .filter(([k]) => Number(k) >= 10)
            .reduce((sum, [, v]) => sum + v, 0);
    return { label: n < 10 ? String(n) : '10+', value, n };
  });
  const max = Math.max(1, ...buckets.map((b) => b.value));
  const todayBucket =
    kind === 'daily' && todays?.status === 'won' ? Math.min(10, todays.guesses.length) : undefined;

  return (
    <div className="stats" data-mode={mode}>
      <Segmented
        label="Mode"
        value={mode}
        onChange={setMode}
        options={MODES.map((m) => ({
          value: m.id,
          label: (
            <>
              {m.kanji} {m.title}
            </>
          ),
        }))}
      />
      <Segmented
        label="Puzzle type"
        size="sm"
        value={kind}
        onChange={setKind}
        options={[
          { value: 'daily', label: 'Daily' },
          { value: 'endless', label: 'Endless' },
          { value: 'archive', label: 'Archive' },
        ]}
      />
      <div className="stats__tiles">
        <div className="stat">
          <span className="stat__value">{stats.played}</span>
          <span className="stat__label">Played</span>
        </div>
        <div className="stat">
          <span className="stat__value">{winRate}%</span>
          <span className="stat__label">Win rate</span>
        </div>
        {kind === 'archive' ? (
          <>
            <div className="stat">
              <span className="stat__value">
                {pastSolved}
                <small>/{today}</small>
              </span>
              <span className="stat__label">Past solved</span>
            </div>
            <div className="stat">
              <span className="stat__value">{stats.hintsUsed}</span>
              <span className="stat__label">Hints used</span>
            </div>
          </>
        ) : (
          <>
            <div className="stat">
              <span className="stat__value">{streak}</span>
              <span className="stat__label">{kind === 'daily' ? 'Streak' : 'In a row'}</span>
            </div>
            <div className="stat">
              <span className="stat__value">{stats.maxStreak}</span>
              <span className="stat__label">Best streak</span>
            </div>
          </>
        )}
        <div className="stat">
          <span className="stat__value">{average}</span>
          <span className="stat__label">Avg. guesses</span>
        </div>
        <div className="stat">
          <span className="stat__value">{stats.best ?? '—'}</span>
          <span className="stat__label">Fewest</span>
        </div>
      </div>
      <h3 className="stats__heading">Guess distribution</h3>
      <ol className="dist">
        {buckets.map((bucket) => (
          <li key={bucket.label} className={`dist__row${bucket.n === todayBucket ? ' is-today' : ''}`}>
            <span className="dist__label">{bucket.label}</span>
            <span className="dist__track">
              <span className="dist__bar" style={{ width: `${Math.max(6, (bucket.value / max) * 100)}%` }}>
                {bucket.value}
              </span>
            </span>
          </li>
        ))}
      </ol>
      <p className="stats__footer faint">
        {Object.keys(state.collection).length} / {CHARACTERS.length} souls collected ·{' '}
        {state.perfectDays.length} Bankai {state.perfectDays.length === 1 ? 'day' : 'days'}
      </p>
    </div>
  );
}

// — Settings ————————————————————————————————————————————————————————————————

function SettingsSheet() {
  const settings = useStore((s) => s.settings);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (patch: Partial<Settings>) =>
    store.update((s) => ({ ...s, settings: { ...s.settings, ...patch } }));

  const exportSave = () => {
    const blob = new Blob([JSON.stringify(store.get(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bleedle-save-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    ui.toast('Save file downloaded.', 'success');
  };

  const importSave = async (file: File) => {
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!parsed || typeof parsed !== 'object' || (parsed as { version?: number }).version !== 1) {
        throw new Error('Not a Bleedle save');
      }
      const next: PersistedState = hydrate(parsed);
      store.set(next);
      ui.toast('Save restored. Welcome back!', 'success');
    } catch {
      ui.toast('That file isn’t a Bleedle save.', 'error');
    }
  };

  return (
    <div className="settings">
      <section className="settings__group">
        <h3 className="settings__heading">Appearance</h3>
        <div className="setting">
          <span className="setting__text">
            <span className="setting__label">Theme</span>
            <span className="setting__desc">Hueco Mundo night or Seireitei paper.</span>
          </span>
          <Segmented
            label="Theme"
            size="sm"
            value={settings.theme}
            onChange={(theme) => set({ theme })}
            options={[
              { value: 'system', label: 'Auto' },
              { value: 'dark', label: <Icon name="moon" size={16} title="Dark" /> },
              { value: 'light', label: <Icon name="sun" size={16} title="Light" /> },
            ]}
          />
        </div>
        <Switch
          label="Colour-blind palette"
          description="Orange and blue instead of green and yellow."
          checked={settings.colors === 'colorblind'}
          onChange={(on) => set({ colors: on ? 'colorblind' : 'default' })}
        />
        <div className="setting">
          <span className="setting__text">
            <span className="setting__label">Motion</span>
            <span className="setting__desc">Tile flips, reishi particles and victory bursts.</span>
          </span>
          <Segmented
            label="Motion"
            size="sm"
            value={settings.motion}
            onChange={(motion) => set({ motion })}
            options={[
              { value: 'system', label: 'Auto' },
              { value: 'full', label: 'Full' },
              { value: 'reduced', label: 'Reduced' },
            ]}
          />
        </div>
      </section>

      <section className="settings__group">
        <h3 className="settings__heading">Gameplay</h3>
        <Switch
          label="Sound effects"
          description="Synthesised flips, chimes and a sword-draw on victory."
          checked={settings.sound}
          onChange={(sound) => set({ sound })}
        />
        <Switch
          label="Filler badges"
          description="Tag anime-only and film characters in suggestions and results."
          checked={settings.fillerBadges}
          onChange={(fillerBadges) => set({ fillerBadges })}
        />
        <Switch
          label="Hard mode"
          description="Hide Classic hints until they unlock — no peeking at what’s coming."
          checked={settings.hardMode}
          onChange={(hardMode) => set({ hardMode })}
        />
      </section>

      <section className="settings__group">
        <h3 className="settings__heading">Your data</h3>
        <p className="setting__desc">
          Progress lives only in this browser. Export a save to move it to another device.
        </p>
        <div className="settings__buttons">
          <button type="button" className="btn btn--sm" onClick={exportSave}>
            <Icon name="download" size={16} /> Export save
          </button>
          <button type="button" className="btn btn--sm" onClick={() => fileRef.current?.click()}>
            <Icon name="upload" size={16} /> Import save
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void importSave(file);
              event.target.value = '';
            }}
          />
          <button type="button" className="btn btn--sm btn--danger" onClick={() => setConfirmReset(true)}>
            Reset everything
          </button>
        </div>
      </section>

      <p className="settings__about faint">
        Bleedle v{APP_VERSION} · storage key <code>{STORAGE_KEY}</code> · Made with reiatsu.
      </p>

      <ConfirmDialog
        open={confirmReset}
        title="Erase all progress?"
        message={<p>Stats, streaks, your Soul Registry and achievements will be wiped from this browser.</p>}
        confirmLabel="Erase"
        danger
        onConfirm={() => {
          store.set({ ...initialState(), settings: store.get().settings, seenIntro: true });
          ui.toast('Progress erased. A fresh start.', 'info');
        }}
        onClose={() => setConfirmReset(false)}
      />
    </div>
  );
}

/** The three global sheets, opened from the header. */
// — Menu (phones) ——————————————————————————————————————————————————————————

function MenuSheet({ current }: { current?: ModeId }) {
  const state = useStore((s) => s);
  const today = useToday();
  const target = current ?? 'classic';
  const collected = Object.keys(state.collection).length;
  const unlocked = Object.keys(state.achievements).length;
  const close = () => ui.close();

  const modeLink = (m: ModeInfo, featured: boolean) => {
    const status = dailyStatus(state.daily[dailyKey(m.id, today)]);
    const streak = displayStreak(state, m.id, today);
    return (
      <a
        key={m.id}
        href={`#/${m.id}`}
        className={`menu-mode${featured ? ' menu-mode--featured' : ''}`}
        data-mode={m.id}
        aria-current={current === m.id ? 'page' : undefined}
        onClick={close}
      >
        <span className="menu-mode__kanji kanji" aria-hidden="true">
          {m.kanji}
        </span>
        <span className="menu-mode__text">
          <span className="menu-mode__title">{m.title}</span>
          <span className={`menu-mode__status is-${status.tone}`}>
            {status.tone === 'won' ? <Icon name="check" size={13} strokeWidth={3} /> : null}
            {status.label}
          </span>
        </span>
        {streak > 0 ? (
          <span className="chip chip--gold" title="Daily streak">
            <Icon name="flame" size={13} /> {streak}
          </span>
        ) : null}
        <Icon name="next" size={18} className="menu-mode__go" />
      </a>
    );
  };

  const links: { href: string; icon: IconName; label: string; meta?: string }[] = [
    { href: '#/', icon: 'home', label: 'Home' },
    { href: `#/${target}/endless`, icon: 'infinity', label: 'Endless training' },
    { href: `#/${target}/archive`, icon: 'calendar', label: 'Puzzle archive' },
    { href: '#/registry', icon: 'book', label: 'Soul Registry', meta: `${collected}/${CHARACTERS.length}` },
    {
      href: '#/achievements',
      icon: 'trophy',
      label: 'Achievements',
      meta: `${unlocked}/${ACHIEVEMENTS.length}`,
    },
  ];

  return (
    <nav className="menu" aria-label="Site">
      <p className="menu__date">
        <Icon name="calendar" size={14} /> Bleedle #{puzzleNumber(today)} · {formatDay(today)}
      </p>
      {modeLink(modeInfo('classic'), true)}
      <h3 className="menu__heading">
        <span className="kanji">外伝</span> Bonus modes
      </h3>
      <div className="menu__bonus">
        {MODES.filter((m) => m.id !== 'classic').map((m) => modeLink(m, false))}
      </div>
      <h3 className="menu__heading">More</h3>
      <ul className="menu__links">
        {links.map((link) => (
          <li key={link.label}>
            <a href={link.href} className="menu-link" onClick={close}>
              <Icon name={link.icon} size={19} />
              <span className="menu-link__label">{link.label}</span>
              {link.meta ? <span className="menu-link__meta">{link.meta}</span> : null}
            </a>
          </li>
        ))}
      </ul>
      <hr className="divider" />
      <Switch
        checked={state.settings.sound}
        onChange={(sound) => {
          store.update((s) => ({ ...s, settings: { ...s.settings, sound } }));
          if (sound) window.setTimeout(() => sfx.tap(), 30);
        }}
        label="Sound effects"
        description="Tile flips, wins and little reishi chimes."
      />
    </nav>
  );
}

export function Sheets() {
  const sheet = useUI((s) => s.sheet);
  const sheetMode = useUI((s) => s.sheetMode) as ModeId | undefined;
  const initial: ModeId = sheetMode && MODES.some((m) => m.id === sheetMode) ? sheetMode : 'classic';
  return (
    <>
      <Modal open={sheet === 'menu'} onClose={ui.close} title="Menu" kanji="門" size="md" mode={initial}>
        <MenuSheet current={sheetMode && MODES.some((m) => m.id === sheetMode) ? initial : undefined} />
      </Modal>
      <Modal
        open={sheet === 'help'}
        onClose={ui.close}
        title="How to play"
        kanji="道"
        size="md"
        mode={initial}
      >
        <HelpSheet key={`help-${initial}`} initial={initial} />
      </Modal>
      <Modal
        open={sheet === 'stats'}
        onClose={ui.close}
        title="Statistics"
        kanji="戦績"
        size="md"
        mode={initial}
      >
        <StatsSheet key={`stats-${initial}`} initial={initial} />
      </Modal>
      <Modal open={sheet === 'settings'} onClose={ui.close} title="Settings" kanji="設定" size="md">
        <SettingsSheet />
      </Modal>
    </>
  );
}
