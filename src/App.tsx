import { useEffect } from 'react';
import { MODES, modeInfo } from './data/taxonomy';
import type { ModeId } from './data/types';
import { useHashRoute } from './hooks/useHashRoute';
import { useSettingsEffects } from './hooks/useSettingsEffects';
import { store } from './state/store';
import { ui } from './state/ui';
import { Backdrop } from './components/Backdrop';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { Sheets } from './components/Sheets';
import { Toasts } from './components/Toasts';
import { AchievementsPage } from './pages/AchievementsPage';
import { HomePage } from './pages/HomePage';
import { ModePage } from './pages/ModePage';
import { RegistryPage } from './pages/RegistryPage';

const MODE_IDS = new Set<string>(MODES.map((m) => m.id));

function useRoute() {
  const { path, segments } = useHashRoute();
  const [first, second] = segments;
  if (first && MODE_IDS.has(first)) {
    return {
      path,
      page: 'mode' as const,
      mode: first as ModeId,
      kind: second === 'endless' ? ('endless' as const) : ('daily' as const),
    };
  }
  if (first === 'registry') return { path, page: 'registry' as const, selected: second };
  if (first === 'achievements') return { path, page: 'achievements' as const };
  return { path, page: 'home' as const };
}

const TITLES: Record<string, string> = {
  home: 'Bleedle — the daily Bleach character guessing game',
  registry: 'Soul Registry · Bleedle',
  achievements: 'Achievements · Bleedle',
};

export function App() {
  const route = useRoute();
  const { reducedMotion } = useSettingsEffects();

  useEffect(() => {
    document.title =
      route.page === 'mode'
        ? `${modeInfo(route.mode).title} · Bleedle`
        : (TITLES[route.page] ?? TITLES.home!);
    window.scrollTo({ top: 0 });
  }, [route.page, route.page === 'mode' ? route.mode : null, route.page === 'mode' ? route.kind : null]); // eslint-disable-line react-hooks/exhaustive-deps

  // First visit: show the rules once.
  useEffect(() => {
    if (!store.get().seenIntro) {
      const timer = window.setTimeout(() => {
        ui.open('help', route.page === 'mode' ? route.mode : 'classic');
        store.update((s) => ({ ...s, seenIntro: true }));
      }, 900);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const kanji =
    route.page === 'mode'
      ? modeInfo(route.mode).kanji
      : route.page === 'registry'
        ? '魂'
        : route.page === 'achievements'
          ? '章'
          : '卍';

  return (
    <div className="app" data-mode={route.page === 'mode' ? route.mode : 'classic'}>
      <Backdrop kanji={kanji} animate={!reducedMotion} />
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Header path={route.path} {...(route.page === 'mode' ? { mode: route.mode } : {})} />
      <main id="main" className="main">
        {route.page === 'home' ? <HomePage /> : null}
        {route.page === 'mode' ? (
          <ModePage key={`${route.mode}:${route.kind}`} mode={route.mode} kind={route.kind} />
        ) : null}
        {route.page === 'registry' ? (
          <RegistryPage {...(route.selected ? { selected: route.selected } : {})} />
        ) : null}
        {route.page === 'achievements' ? <AchievementsPage /> : null}
      </main>
      <Footer />
      <Sheets />
      <Toasts />
    </div>
  );
}
