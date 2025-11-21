import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the Prisma db module used by server-side helpers
vi.mock('@/app/lib/db', () => {
  return {
    db: {
      featureFlag: {
        findMany: vi.fn(),
      },
      log: {
        create: vi.fn(),
      },
    },
  };
});

import {
  isFeatureEnabled,
  setFeatureFlagOverride,
  clearFeatureFlagOverrides,
  getAllFeatureFlagsFromDB,
  clearFeatureFlagsCache,
} from '@/app/utils/featureFlags';

import { db } from '@/app/lib/db';

describe('featureFlags client & server focused tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // ensure clean globals
    // @ts-ignore
    delete global.window;
    // @ts-ignore
    delete global.localStorage;
    // @ts-ignore
    delete global.fetch;
    clearFeatureFlagsCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('client: returns override from localStorage without fetching', async () => {
    // set up client environment
    // @ts-ignore
    global.window = {};
    const store: Record<string, string> = {};
    // @ts-ignore
    global.window.localStorage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => (store[k] = v),
      removeItem: (k: string) => delete store[k],
    };
    // ensure unqualified localStorage works too
    // @ts-ignore
    global.localStorage = global.window.localStorage;

    // write override
    global.window.localStorage.setItem(
      'feature-flag-overrides',
      JSON.stringify({ DARK_MODE: true })
    );

    const v = await isFeatureEnabled('DARK_MODE');
    expect(v).toBe(true);
  });

  it('client: fetches from API when no override and returns API value', async () => {
    // set up client environment
    // @ts-ignore
    global.window = {};
    // simple localStorage with no overrides
    // @ts-ignore
    global.window.localStorage = { getItem: () => null };
    // @ts-ignore
    global.localStorage = global.window.localStorage;

    // mock fetch to return flags
    // @ts-ignore
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ DARK_MODE: false }) })
    );

    const v = await isFeatureEnabled('DARK_MODE');
    expect(v).toBe(false);
    // ensure fetch was called
    // @ts-ignore
    expect(global.fetch).toHaveBeenCalled();
  });

  it('client: fetch failure falls back to env', async () => {
    // @ts-ignore
    global.window = {};
    // @ts-ignore
    global.window.localStorage = { getItem: () => null };
    // @ts-ignore
    global.localStorage = global.window.localStorage;

    // mock fetch to throw
    // @ts-ignore
    global.fetch = vi.fn(() => Promise.reject(new Error('network')));

    const v = await isFeatureEnabled('LOCATION_NEW_YORK');
    // LOCATION_NEW_YORK defaults to true in FEATURE_FLAGS
    expect(v).toBe(true);
  });

  it('setFeatureFlagOverride handles localStorage.setItem errors gracefully', () => {
    // @ts-ignore
    global.window = {};
    // simulate setItem throwing
    // @ts-ignore
    global.window.localStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('Storage quota exceeded');
      },
      removeItem: () => {},
    };
    // @ts-ignore
    global.localStorage = global.window.localStorage;

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() => setFeatureFlagOverride('DARK_MODE', true)).not.toThrow();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('clearFeatureFlagOverrides handles localStorage.removeItem errors gracefully', () => {
    // @ts-ignore
    global.window = {};
    // simulate removeItem throwing
    // @ts-ignore
    global.window.localStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {
        throw new Error('Storage error');
      },
    };
    // @ts-ignore
    global.localStorage = global.window.localStorage;

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() => clearFeatureFlagOverrides()).not.toThrow();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('server: getAllFeatureFlagsFromDB caches results and clearFeatureFlagsCache invalidates', async () => {
    // @ts-ignore
    db.featureFlag.findMany.mockResolvedValue([{ name: 'DARK_MODE', enabled: true }]);

    const first = await getAllFeatureFlagsFromDB();
    expect(first.DARK_MODE).toBe(true);
    // call again; db.findMany should not be called again because of cache
    const second = await getAllFeatureFlagsFromDB();
    expect(second.DARK_MODE).toBe(true);
    // findMany should have been called exactly once
    // @ts-ignore
    expect(db.featureFlag.findMany).toHaveBeenCalledTimes(1);

    // clear cache and call again -> triggers a second DB call
    clearFeatureFlagsCache();
    // @ts-ignore
    db.featureFlag.findMany.mockResolvedValue([{ name: 'DARK_MODE', enabled: false }]);
    const third = await getAllFeatureFlagsFromDB();
    expect(third.DARK_MODE).toBe(false);
    // @ts-ignore
    expect(db.featureFlag.findMany).toHaveBeenCalledTimes(2);
  });
});
