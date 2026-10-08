'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  appendRecord,
  omitRecord,
  deserializeCollection,
  createLocalStorageAdapter,
  type HistoryAdapter,
  type HistoryEntry,
} from '@/lib/history/history-store';

export interface UseHistoryState<I, R> {
  /** All records, newest first */
  records: HistoryEntry<I, R>[];
  latest: HistoryEntry<I, R> | null;
  /** True after the client-side hydration read */
  isHydrated: boolean;
  /** False when storage is unavailable — UI hides the whole block */
  isStorageAvailable: boolean;
  /** Persist one calculation (newest first, capped at 50) */
  addRecord: (inputs: I, result: R) => void;
  removeRecord: (id: string) => void;
  clearRecords: () => void;
}

/**
 * Shared local-history hook for every calculator.
 *
 * SSR-safe: localStorage is touched only in effects, initial render is
 * identical on server and client. When storage is missing (private mode)
 * the hook degrades silently and calculation never breaks.
 *
 * Method names describe intent (add/remove/clear records) so the backing
 * implementation can later be replaced with an API client without
 * touching the pages.
 */
export function useHistory<I, R>(toolSlug: string): UseHistoryState<I, R> {
  const [records, setRecords] = useState<HistoryEntry<I, R>[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isStorageAvailable, setIsStorageAvailable] = useState(true);
  const adapterRef = useRef<HistoryAdapter | null>(null);

  // ── Hydration: read the collection once on mount ─────────────────
  useEffect(() => {
    const adapter = createLocalStorageAdapter(toolSlug);
    adapterRef.current = adapter;

    if (!adapter) {
      setIsStorageAvailable(false);
      setIsHydrated(true);
      return;
    }

    try {
      const outcome = deserializeCollection(adapter.loadCollection());
      if (!outcome.ok) {
        // Corrupt data → drop and rebuild from scratch
        adapter.deleteCollection();
        setRecords([]);
      } else {
        setRecords(outcome.entries as HistoryEntry<I, R>[]);
      }
    } catch {
      adapterRef.current = null;
      setIsStorageAvailable(false);
    }

    setIsHydrated(true);
  }, [toolSlug]);

  // ── Persistence: state is the single truth, this effect mirrors it
  useEffect(() => {
    if (!isHydrated || !isStorageAvailable) return;
    const adapter = adapterRef.current;
    if (!adapter) return;

    if (records.length === 0) {
      adapter.deleteCollection();
    } else {
      adapter.persistCollection(JSON.stringify(records));
    }
  }, [records, isHydrated, isStorageAvailable]);

  const addRecord = useCallback((inputs: I, result: R) => {
    setRecords((prev) => appendRecord(prev, inputs, result));
  }, []);

  const removeRecord = useCallback((id: string) => {
    setRecords((prev) => omitRecord(prev, id));
  }, []);

  const clearRecords = useCallback(() => {
    setRecords([]);
  }, []);

  return {
    records,
    latest: records.length > 0 ? records[0] : null,
    isHydrated,
    isStorageAvailable,
    addRecord,
    removeRecord,
    clearRecords,
  };
}
