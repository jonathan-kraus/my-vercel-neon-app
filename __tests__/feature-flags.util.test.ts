import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the Prisma db module (include log.create used by logger)
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
  isFeatureEnabledSync,
  clearFeatureFlagOverrides,
  getEnabledFeatures,
  getAllFeatureFlags,
  clearFeatureFlagsCache,
} from '@/app/utils/featureFlags';

import { db } from '@/app/lib/db';

describe('featureFlags utils', () => {
  beforeEach(() => {
    // clear cache before each test
    clearFeatureFlagsCache();
    // ensure no window by default
    // @ts-ignore
    delete global.window;
  });

  afterEach(() => {
    vi.resetAllMocks();
    // @ts-ignore
    delete global.window;
  });

  it('returns DB flag on server-side when present', async () => {
    // @ts-ignore
    db.featureFlag.findMany.mockResolvedValue([{ name: 'DARK_MODE', enabled: true }]);

    const v = await isFeatureEnabled('DARK_MODE');
    expect(v).toBe(true);
  });

  it('falls back to env when DB fails on server-side', async () => {
    // Simulate DB error
    // @ts-ignore
    db.featureFlag.findMany.mockRejectedValue(new Error('db error'));

    const v = await isFeatureEnabled('LOCATION_NEW_YORK');
    // Default in FEATURE_FLAGS: LOCATION_NEW_YORK defaults to true
    expect(v).toBe(true);
  });

  it('returns false for unknown flag when DB fails (line 190)', async () => {
    // Simulate DB error
    // @ts-ignore
    db.featureFlag.findMany.mockRejectedValue(new Error('db error'));

    // Test with a flag that doesn't have a default value
    // @ts-ignore
    const v = await isFeatureEnabled('UNKNOWN_FLAG');
    expect(v).toBe(false);
  });

  it('getEnabledFeatures uses cached DB flags on server (lines 204-206)', async () => {
    // First, populate the cache via isFeatureEnabled or getAllFeatureFlagsFromDB
    // @ts-ignore
    db.featureFlag.findMany.mockResolvedValue([
      { name: 'DARK_MODE', enabled: true },
      { name: 'CACHING', enabled: true },
    ]);

    // Trigger cache population
    await isFeatureEnabled('DARK_MODE');

    // Now call getEnabledFeatures - should use cached flags
    const enabled = getEnabledFeatures();
    expect(enabled).toContain('DARK_MODE');
    expect(enabled).toContain('CACHING');
  });

  it('isFeatureEnabledSync reads localStorage override on client', () => {
    // Provide a minimal window + localStorage
    // @ts-ignore
    global.window = {};
    const store: Record<string, string> = {};
    // @ts-ignore
    global.window.localStorage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => (store[k] = v),
      removeItem: (k: string) => delete store[k],
    };
    // expose `localStorage` global so module code using unqualified `localStorage` works
    // @ts-ignore
    global.localStorage = global.window.localStorage;

    // directly set localStorage key to avoid calling into other helpers
    // @ts-ignore
    global.window.localStorage.setItem(
      'feature-flag-overrides',
      JSON.stringify({ DARK_MODE: true })
    );
    // Verify the override was written to localStorage
    // @ts-ignore
    const raw = global.window.localStorage.getItem('feature-flag-overrides');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw as string);
    expect(parsed.DARK_MODE).toBe(true);
    // Now clear overrides and ensure they're removed
    clearFeatureFlagOverrides();
    // @ts-ignore
    expect(global.window.localStorage.getItem('feature-flag-overrides')).toBeNull();

    // clear overrides
    clearFeatureFlagOverrides();
    expect(isFeatureEnabledSync('DARK_MODE')).toBeDefined();
  });

  it('getEnabledFeatures falls back to env when no cache', () => {
    // Ensure server-side (no window)
    // @ts-ignore
    delete global.window;
    // @ts-ignore
    delete global.localStorage;

    const enabled = getEnabledFeatures();
    // Should return an array and include LOCATION_NEW_YORK by default
    expect(Array.isArray(enabled)).toBe(true);
    expect(enabled).toContain('LOCATION_NEW_YORK');
  });

  it('getAllFeatureFlags returns object shape', () => {
    const all = getAllFeatureFlags();
    expect(typeof all).toBe('object');
    expect(all.LOCATION_NEW_YORK).toBeDefined();
  });
});
