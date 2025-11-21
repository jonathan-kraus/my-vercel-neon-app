import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the Prisma db module
vi.mock('@/app/lib/db', () => {
  return {
    db: {
      featureFlag: {
        findMany: vi.fn(),
      },
    },
  };
});

import {
  isFeatureEnabled,
  isFeatureEnabledSync,
  setFeatureFlagOverride,
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

    // set override
    setFeatureFlagOverride('DARK_MODE', true);
    expect(isFeatureEnabledSync('DARK_MODE')).toBe(true);

    // clear overrides
    clearFeatureFlagOverrides();
    expect(isFeatureEnabledSync('DARK_MODE')).toBeDefined();
  });

  it('getEnabledFeatures falls back to env when no cache', () => {
    // Ensure server-side (no window)
    // @ts-ignore
    delete global.window;

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
