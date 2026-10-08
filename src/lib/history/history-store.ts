/**
 * Local history store — storage-agnostic core.
 *
 * The React hook talks only to the `HistoryAdapter` interface, so swapping
 * localStorage for a remote sync API later does not change call sites:
 *
 *   loadCollection / persistCollection / deleteCollection
 *
 * Conventions:
 * - Storage key: fitkit_history_{toolSlug}
 * - Entries: [{ id, timestamp, inputs, result }], newest first, max 50
 * - Corrupt payloads are detected by the hook and rebuilt, never thrown.
 */

export const STORAGE_PREFIX = 'fitkit_history_';
export const MAX_ENTRIES = 50;

export interface HistoryEntry<I = unknown, R = unknown> {
  id: string;
  /** ISO 8601 */
  timestamp: string;
  inputs: I;
  result: R;
}

/**
 * Persistence port. A cloud-sync implementation would expose the same
 * three methods (the async variants are awaited by a future hook).
 */
export interface HistoryAdapter {
  loadCollection(): string | null;
  persistCollection(raw: string): void;
  deleteCollection(): void;
}

export function storageKey(toolSlug: string): string {
  return `${STORAGE_PREFIX}${toolSlug}`;
}

/**
 * Returns an adapter backed by window.localStorage, or null when storage
 * is unavailable (private mode, disabled cookies, security policy).
 */
export function createLocalStorageAdapter(toolSlug: string): HistoryAdapter | null {
  if (typeof window === 'undefined') return null;

  let store: Storage;
  try {
    store = window.localStorage;
    const probe = `${STORAGE_PREFIX}probe`;
    store.setItem(probe, '1');
    store.removeItem(probe);
  } catch {
    return null;
  }

  const key = storageKey(toolSlug);

  return {
    loadCollection() {
      try {
        return store.getItem(key);
      } catch {
        return null;
      }
    },
    persistCollection(raw: string) {
      try {
        store.setItem(key, raw);
      } catch {
        // Quota / write rejection — state remains the in-memory truth;
        // the next write is retried. Never blocks the calculation.
      }
    },
    deleteCollection() {
      try {
        store.removeItem(key);
      } catch {
        /* noop */
      }
    },
  };
}

export type ParseOutcome =
  | { ok: true; entries: HistoryEntry[] }
  | { ok: false; entries: [] };

/**
 * Defensive parse.
 * - Unparseable / non-array payload → failure (caller deletes the key)
 * - Malformed individual records are filtered out
 */
export function deserializeCollection(raw: string | null): ParseOutcome {
  if (raw === null) return { ok: true, entries: [] };

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false, entries: [] };
  }

  if (!Array.isArray(data)) return { ok: false, entries: [] };

  const entries = data.filter(isWellFormedEntry);
  return { ok: true, entries };
}

function isWellFormedEntry(value: unknown): value is HistoryEntry {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const e = value as Record<string, unknown>;
  return (
    typeof e.id === 'string' &&
    typeof e.timestamp === 'string' &&
    e.inputs !== undefined &&
    e.result !== undefined
  );
}

/** Default unique id: crypto.randomUUID with a fallback. */
export function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export interface AppendOptions {
  now?: () => string;
  id?: () => string;
}

/** New record prepended; oldest entries discarded past MAX_ENTRIES. */
export function appendRecord<I, R>(
  entries: readonly HistoryEntry<I, R>[],
  inputs: I,
  result: R,
  options: AppendOptions = {}
): HistoryEntry<I, R>[] {
  const now = options.now ?? (() => new Date().toISOString());
  const id = options.id ?? createId;

  const entry: HistoryEntry<I, R> = {
    id: id(),
    timestamp: now(),
    // Snapshot defensively so later form edits never mutate saved history
    inputs: cloneJson(inputs),
    result: cloneJson(result),
  };

  return [entry, ...entries].slice(0, MAX_ENTRIES);
}

export function omitRecord<I, R>(
  entries: readonly HistoryEntry<I, R>[],
  id: string
): HistoryEntry<I, R>[] {
  return entries.filter((entry) => entry.id !== id);
}

function cloneJson<T>(value: T): T {
  return typeof structuredClone === 'function'
    ? structuredClone(value)
    : (JSON.parse(JSON.stringify(value)) as T);
}
