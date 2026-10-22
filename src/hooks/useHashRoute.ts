import { useCallback, useSyncExternalStore } from 'react';

/**
 * Hash routing (#/classic, #/registry/ichigo-kurosaki, …) keeps the site
 * deployable to any static host — no server rewrites needed.
 */
function read(): string {
  const hash = typeof window === 'undefined' ? '' : window.location.hash;
  const path = hash.replace(/^#/, '') || '/';
  return path.startsWith('/') ? path : `/${path}`;
}

function subscribe(callback: () => void) {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
}

export function navigate(path: string): void {
  const target = `#${path}`;
  if (window.location.hash === target) return;
  window.location.hash = target;
}

export function useHashRoute(): { path: string; segments: string[]; go: (path: string) => void } {
  const path = useSyncExternalStore(subscribe, read, () => '/');
  const go = useCallback((next: string) => navigate(next), []);
  return { path, segments: path.split('/').filter(Boolean), go };
}
