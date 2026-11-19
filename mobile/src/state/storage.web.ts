/**
 * Web persistence through localStorage. Mirrors the async API of `storage.ts`
 * so callers do not care which platform they run on.
 */
export async function loadJson<T>(key: string): Promise<T | null> {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function saveJson(key: string, value: unknown): Promise<void> {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode or blocked storage: keep going with in-memory state.
  }
}
