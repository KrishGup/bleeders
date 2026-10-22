import { useEffect } from 'react';
import { setSoundEnabled } from '../lib/sound';
import { useSettings } from '../state/store';
import { useMediaQuery } from './useMediaQuery';

/** Mirrors settings onto <html> data attributes so CSS can react to them. */
export function useSettingsEffects(): { reducedMotion: boolean } {
  const settings = useSettings();
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const prefersReduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const theme = settings.theme === 'system' ? (prefersDark ? 'dark' : 'light') : settings.theme;
  const reducedMotion = settings.motion === 'reduced' || (settings.motion === 'system' && prefersReduced);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.dataset.colors = settings.colors;
    root.dataset.motion = reducedMotion ? 'reduced' : 'full';
    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute('content', theme === 'dark' ? '#08080c' : '#f1ece2');
  }, [theme, settings.colors, reducedMotion]);

  useEffect(() => setSoundEnabled(settings.sound), [settings.sound]);

  return { reducedMotion };
}
