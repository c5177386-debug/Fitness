import { describe, it, expect, afterEach } from 'vitest';
import { createLocalStorageAdapter } from './history-store';

const g = globalThis as unknown as { window?: unknown };

afterEach(() => {
  delete g.window;
});

describe('createLocalStorageAdapter — private / disabled storage', () => {
  it('returns null when window is undefined (SSR)', () => {
    delete g.window;
    expect(createLocalStorageAdapter('tdee-calculator')).toBeNull();
  });

  it('returns null when setItem throws (private mode / cookies blocked)', () => {
    g.window = {
      localStorage: {
        setItem: () => {
          throw new Error('Access denied');
        },
        getItem: () => null,
        removeItem: () => {},
      },
    };
    expect(createLocalStorageAdapter('tdee-calculator')).toBeNull();
  });

  it('returns null when accessing localStorage throws (security policy)', () => {
    g.window = {
      get localStorage() {
        throw new Error('SecurityError');
      },
    };
    expect(createLocalStorageAdapter('tdee-calculator')).toBeNull();
  });

  it('exposes the adapter contract when storage works', () => {
    const store = new Map<string, string>();
    g.window = {
      localStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, v),
        removeItem: (k: string) => void store.delete(k),
      },
    };
    const adapter = createLocalStorageAdapter('tdee-calculator');
    expect(adapter).not.toBeNull();

    adapter!.persistCollection('[{"id":"a"}]');
    expect(adapter!.loadCollection()).toBe('[{"id":"a"}]');

    adapter!.deleteCollection();
    expect(adapter!.loadCollection()).toBeNull();
  });
});
