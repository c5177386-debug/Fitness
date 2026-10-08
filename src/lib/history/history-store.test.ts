import { describe, it, expect } from 'vitest';
import {
  appendRecord,
  omitRecord,
  deserializeCollection,
  MAX_ENTRIES,
  type HistoryAdapter,
  type HistoryEntry,
} from './history-store';

/** In-memory adapter — same interface a future API client would implement. */
function memoryAdapter(initial: Record<string, string> = {}): HistoryAdapter & {
  data: Record<string, string>;
} {
  const data: Record<string, string> = { ...initial };
  return {
    data,
    loadCollection: (key = 'k') => data[key] ?? null,
    persistCollection(raw) {
      data.k = raw;
    },
    deleteCollection() {
      delete data.k;
    },
  };
}

describe('deserializeCollection', () => {
  const valid: HistoryEntry = {
    id: 'a1',
    timestamp: '2026-09-30T10:00:00.000Z',
    inputs: { weight: '100' },
    result: { average: 122 },
  };

  it('empty key → empty collection', () => {
    const r = deserializeCollection(null);
    expect(r.ok).toBe(true);
    expect(r.entries).toEqual([]);
  });

  it('valid JSON array passes through', () => {
    const r = deserializeCollection(JSON.stringify([valid]));
    expect(r.ok).toBe(true);
    expect(r.entries).toHaveLength(1);
  });

  it('corrupt JSON → failure so the key is rebuilt', () => {
    const r = deserializeCollection('{not json');
    expect(r.ok).toBe(false);
  });

  it('non-array payload → failure', () => {
    const r = deserializeCollection(JSON.stringify({ id: 'x' }));
    expect(r.ok).toBe(false);
  });

  it('malformed individual records are filtered', () => {
    const r = deserializeCollection(
      JSON.stringify([valid, { id: 'no-timestamp' }, 'junk', null])
    );
    expect(r.ok).toBe(true);
    expect(r.entries).toHaveLength(1);
  });
});

describe('appendRecord', () => {
  const fixed = { now: () => '2026-09-30T10:00:00.000Z', id: () => 'id-1' };

  it('prepends newest first with a defensive snapshot', () => {
    const inputs = { weight: '100' };
    const result = { average: 122 };
    const next = appendRecord([], inputs, result, fixed);

    expect(next[0]).toMatchObject({
      id: 'id-1',
      timestamp: '2026-09-30T10:00:00.000Z',
    });

    // Mutating the source objects must not change stored history
    inputs.weight = '999';
    result.average = 0;
    expect(next[0].inputs).toEqual({ weight: '100' });
    expect(next[0].result).toEqual({ average: 122 });
  });

  it('caps at MAX_ENTRIES, discarding the oldest', () => {
    let seed: HistoryEntry[] = [];
    for (let i = 0; i < MAX_ENTRIES; i++) {
      seed = appendRecord(
        seed,
        { n: i },
        { v: i },
        { now: () => `2026-01-01T00:00:${String(i).padStart(2, '0')}.000Z`, id: () => `old-${i}` }
      );
    }
    const next = appendRecord(seed, { n: 99 }, { v: 99 }, fixed);

    expect(next).toHaveLength(MAX_ENTRIES);
    expect(next[0].id).toBe('id-1');
    expect(next[MAX_ENTRIES - 1].id).toBe('old-1'); // old-0 dropped
  });
});

describe('omitRecord', () => {
  it('removes only the matching id', () => {
    const entries = [
      { id: 'a', timestamp: 't', inputs: {}, result: {} },
      { id: 'b', timestamp: 't', inputs: {}, result: {} },
    ];
    expect(omitRecord(entries, 'a')).toHaveLength(1);
    expect(omitRecord(entries, 'a')[0].id).toBe('b');
    expect(omitRecord(entries, 'missing')).toHaveLength(2);
  });
});

describe('HistoryAdapter contract (in-memory)', () => {
  it('load / persist / delete behave like the localStorage adapter', () => {
    const adapter = memoryAdapter();
    expect(adapter.loadCollection()).toBe(null);

    adapter.persistCollection(JSON.stringify([{ id: 'a' }]));
    expect(JSON.parse(adapter.data.k)).toEqual([{ id: 'a' }]);

    adapter.deleteCollection();
    expect('k' in adapter.data).toBe(false);
  });
});
