/**
 * Safe localStorage wrapper. Private browsing modes and embedded webviews can
 * throw on access, so every call is guarded and falls back to memory.
 */
const memory = new Map<string, string>();

function backend(): Storage | null {
  try {
    const storage = globalThis.localStorage;
    const probe = '__bleedle_probe__';
    storage.setItem(probe, probe);
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}

let cached: Storage | null | undefined;
function store(): Storage | null {
  if (cached === undefined) cached = backend();
  return cached;
}

export function readJSON<T>(key: string): T | undefined {
  try {
    const raw = store()?.getItem(key) ?? memory.get(key);
    return raw == null ? undefined : (JSON.parse(raw) as T);
  } catch {
    return undefined;
  }
}

export function writeJSON(key: string, value: unknown): void {
  const raw = JSON.stringify(value);
  memory.set(key, raw);
  try {
    store()?.setItem(key, raw);
  } catch {
    // Quota exceeded or storage revoked: memory copy keeps the session alive.
  }
}

export function removeKey(key: string): void {
  memory.delete(key);
  try {
    store()?.removeItem(key);
  } catch {
    // ignore
  }
}

/** Test hook: forget the cached backend (e.g. after swapping globals). */
export function resetStorageBackend(): void {
  cached = undefined;
  memory.clear();
}
