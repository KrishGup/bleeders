/** Offline support: a tiny service worker caches the app shell and assets as you play. */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {
      // Offline support is a nice-to-have; the game works without it.
    });
  });
}
