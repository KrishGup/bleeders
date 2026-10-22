import { useSyncExternalStore } from 'react';
import { readJSON, writeJSON } from '../lib/storage';
import { hydrate, pruneDaily, type PersistedState } from './model';
import { dayIndexFor } from '../lib/date';

export const STORAGE_KEY = 'bleedle:v1';

type Listener = () => void;

function load(): PersistedState {
  return pruneDaily(hydrate(readJSON(STORAGE_KEY)), dayIndexFor());
}

let state: PersistedState = load();
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener();
}

export const store = {
  get(): PersistedState {
    return state;
  },
  set(next: PersistedState): void {
    if (next === state) return;
    state = next;
    writeJSON(STORAGE_KEY, state);
    emit();
  },
  update(fn: (current: PersistedState) => PersistedState): void {
    store.set(fn(state));
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  /** Re-read from storage (another tab changed it). */
  reload(): void {
    state = load();
    emit();
  },
};

// Keep multiple open tabs in sync.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) store.reload();
  });
}

/**
 * Subscribe to a slice of the store. Selectors must return either primitives or
 * references that already live in the state tree, so renders stay stable.
 */
export function useStore<T>(selector: (s: PersistedState) => T): T {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(state),
    () => selector(state),
  );
}

export function useSettings() {
  return useStore((s) => s.settings);
}
