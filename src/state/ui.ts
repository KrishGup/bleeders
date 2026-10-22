import { useSyncExternalStore } from 'react';

/** Ephemeral UI state: toasts and which global sheet is open. */
export type Sheet = 'help' | 'stats' | 'settings' | null;

export interface Toast {
  id: number;
  message: string;
  tone: 'info' | 'success' | 'error' | 'achievement';
  title?: string;
  kanji?: string;
}

interface UIState {
  toasts: Toast[];
  sheet: Sheet;
  sheetMode?: string;
}

let state: UIState = { toasts: [], sheet: null };
const listeners = new Set<() => void>();
let nextId = 1;

function set(next: UIState) {
  state = next;
  for (const listener of listeners) listener();
}

export const ui = {
  toast(message: string, tone: Toast['tone'] = 'info', extra: Partial<Toast> = {}, duration = 2600): void {
    const toast: Toast = { id: nextId++, message, tone, ...extra };
    set({ ...state, toasts: [...state.toasts.slice(-3), toast] });
    window.setTimeout(() => ui.dismiss(toast.id), duration);
  },
  dismiss(id: number): void {
    set({ ...state, toasts: state.toasts.filter((t) => t.id !== id) });
  },
  open(sheet: Exclude<Sheet, null>, sheetMode?: string): void {
    set({ ...state, sheet, ...(sheetMode ? { sheetMode } : { sheetMode: undefined }) });
  },
  close(): void {
    set({ ...state, sheet: null });
  },
};

export function useUI<T>(selector: (s: UIState) => T): T {
  return useSyncExternalStore(
    (callback) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    () => selector(state),
    () => selector(state),
  );
}
