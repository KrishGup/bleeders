import type { ModeId } from '../data/types';
import { sfx } from '../lib/sound';
import { store, useSettings } from '../state/store';
import { ui } from '../state/ui';
import { Icon } from './Icon';
import { Logo } from './Logo';

export function Header({ path, mode }: { path: string; mode?: ModeId }) {
  const settings = useSettings();
  const isHome = path === '/';

  const toggleSound = () => {
    store.update((s) => ({ ...s, settings: { ...s.settings, sound: !s.settings.sound } }));
    window.setTimeout(() => sfx.tap(), 30);
  };

  return (
    <header className="header">
      <div className="header__inner">
        <nav className="header__side" aria-label="Primary">
          {isHome ? null : (
            <a href="#/" className="icon-btn" aria-label="Home" title="Home">
              <Icon name="home" />
            </a>
          )}
          <a
            href="#/registry"
            className="icon-btn"
            aria-label="Soul Registry"
            title="Soul Registry"
            aria-current={path.startsWith('/registry') ? 'page' : undefined}
          >
            <Icon name="book" />
          </a>
          <a
            href="#/achievements"
            className="icon-btn hide-xs"
            aria-label="Achievements"
            title="Achievements"
            aria-current={path === '/achievements' ? 'page' : undefined}
          >
            <Icon name="trophy" />
          </a>
        </nav>

        <a href="#/" className={`header__logo${isHome ? ' is-home' : ''}`} aria-label="Bleedle — home">
          <Logo size="sm" />
        </a>

        <div className="header__side header__side--end">
          <button
            type="button"
            className="icon-btn"
            aria-label="How to play"
            title="How to play"
            onClick={() => ui.open('help', mode)}
          >
            <Icon name="help" />
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label="Statistics"
            title="Statistics"
            onClick={() => ui.open('stats', mode)}
          >
            <Icon name="chart" />
          </button>
          <button
            type="button"
            className="icon-btn hide-xs"
            aria-label={settings.sound ? 'Mute sound effects' : 'Enable sound effects'}
            title={settings.sound ? 'Sound on' : 'Sound off'}
            aria-pressed={settings.sound}
            onClick={toggleSound}
          >
            <Icon name={settings.sound ? 'volume' : 'mute'} />
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label="Settings"
            title="Settings"
            onClick={() => ui.open('settings')}
          >
            <Icon name="settings" />
          </button>
        </div>
      </div>
    </header>
  );
}
