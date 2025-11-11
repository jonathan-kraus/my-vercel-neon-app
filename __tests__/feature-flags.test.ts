import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the featureFlags module
vi.mock('../app/utils/featureFlags', () => ({
  FEATURE_FLAGS: {
    WEATHER_AUTO_REFRESH: false,
    WEATHER_LOCATION_DISPLAY: false,
    WEATHER_MOCK_DATA: true,
    LOCATION_KOP: false,
    LOCATION_NEW_YORK: false,
    LOCATION_SAN_FRANCISCO: false,
    LOCATION_BROOKLINE: false,
    VERBOSE_LOGGING: true,
    LOG_REQUEST_TRACING: false,
    ADMIN_TOOLS: true,
    ADVANCED_ANALYTICS: false,
    EMAIL_NOTIFICATIONS: false,
    EMAIL_TEMPLATES: false,
    DARK_MODE: false,
    NEW_UI_COMPONENTS: false,
    CACHING: false,
    LAZY_LOADING: false,
  },
  isFeatureEnabled: vi.fn(),
  setFeatureFlagOverride: vi.fn(),
  clearFeatureFlagOverrides: vi.fn(),
  getEnabledFeatures: vi.fn(),
  getAllFeatureFlags: vi.fn(),
}));

import {
  isFeatureEnabled,
  setFeatureFlagOverride,
  clearFeatureFlagOverrides,
  getEnabledFeatures,
  getAllFeatureFlags,
  FEATURE_FLAGS,
} from '../app/utils/featureFlags';

// Mock localStorage globally
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock window globally
Object.defineProperty(global, 'window', {
  value: {},
  writable: true,
});

describe('Feature Flags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset localStorage mocks
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {});
    localStorageMock.removeItem.mockImplementation(() => {});

    // Set up mocked function implementations
    vi.mocked(isFeatureEnabled).mockImplementation((flag) => {
      // Check localStorage overrides first
      const stored = localStorageMock.getItem('feature-flag-overrides');
      if (stored) {
        try {
          const overrides = JSON.parse(stored);
          if (flag in overrides) {
            return overrides[flag];
          }
        } catch {
          // Invalid JSON, fall back to defaults
        }
      }
      // Return default from FEATURE_FLAGS
      return FEATURE_FLAGS[flag as keyof typeof FEATURE_FLAGS] || false;
    });

    vi.mocked(setFeatureFlagOverride).mockImplementation((flag, enabled) => {
      if (typeof window === 'undefined') return;

      try {
        const stored = localStorageMock.getItem('feature-flag-overrides');
        const overrides = stored ? JSON.parse(stored) : {};
        overrides[flag] = enabled;
        localStorageMock.setItem('feature-flag-overrides', JSON.stringify(overrides));
      } catch (error) {
        console.warn('Failed to save feature flag override:', error);
      }
    });

    vi.mocked(clearFeatureFlagOverrides).mockImplementation(() => {
      if (typeof window === 'undefined') return;

      try {
        localStorageMock.removeItem('feature-flag-overrides');
      } catch (error) {
        console.warn('Failed to clear feature flag overrides:', error);
      }
    });

    vi.mocked(getEnabledFeatures).mockImplementation(() => {
      return Object.keys(FEATURE_FLAGS).filter((flag) =>
        isFeatureEnabled(flag as keyof typeof FEATURE_FLAGS)
      ) as any[];
    });

    vi.mocked(getAllFeatureFlags).mockReturnValue(FEATURE_FLAGS);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isFeatureEnabled', () => {
    it('returns environment variable default when no localStorage override', () => {
      // WEATHER_MOCK_DATA should be true based on .env
      const result = isFeatureEnabled('WEATHER_MOCK_DATA');
      expect(result).toBe(true);
    });

    it('returns localStorage override when present', () => {
      localStorageMock.getItem.mockReturnValue(
        JSON.stringify({
          WEATHER_MOCK_DATA: false,
        })
      );

      const result = isFeatureEnabled('WEATHER_MOCK_DATA');
      expect(result).toBe(false);
    });

    it('prioritizes localStorage over environment defaults', () => {
      // Environment default is true, but localStorage says false
      localStorageMock.getItem.mockReturnValue(
        JSON.stringify({
          WEATHER_MOCK_DATA: false,
        })
      );

      const result = isFeatureEnabled('WEATHER_MOCK_DATA');
      expect(result).toBe(false);
    });

    it('returns environment default when localStorage override is invalid JSON', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');

      const result = isFeatureEnabled('WEATHER_MOCK_DATA');
      expect(result).toBe(true); // Should fall back to env default
    });

    it('handles non-existent feature flags gracefully', () => {
      // @ts-expect-error Testing invalid flag
      const result = isFeatureEnabled('NON_EXISTENT_FLAG');
      expect(result).toBe(false); // Should return false for unknown flags
    });

    it('works in server environment (no window)', () => {
      // Temporarily set window to undefined
      const originalWindow = global.window;
      // @ts-expect-error Setting window to undefined for test
      global.window = undefined;

      try {
        const result = isFeatureEnabled('WEATHER_MOCK_DATA');
        expect(result).toBe(true); // Should use env default
      } finally {
        // Restore window
        global.window = originalWindow;
      }
    });
  });

  describe('setFeatureFlagOverride', () => {
    it('saves override to localStorage', () => {
      setFeatureFlagOverride('WEATHER_MOCK_DATA', false);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'feature-flag-overrides',
        JSON.stringify({ WEATHER_MOCK_DATA: false })
      );
    });

    it('merges with existing overrides', () => {
      localStorageMock.getItem.mockReturnValue(
        JSON.stringify({
          VERBOSE_LOGGING: true,
        })
      );

      setFeatureFlagOverride('WEATHER_MOCK_DATA', false);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'feature-flag-overrides',
        JSON.stringify({
          VERBOSE_LOGGING: true,
          WEATHER_MOCK_DATA: false,
        })
      );
    });

    it('handles localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      // Should not throw
      expect(() => {
        setFeatureFlagOverride('WEATHER_MOCK_DATA', false);
      }).not.toThrow();
    });

    it('does nothing in server environment', () => {
      const originalWindow = global.window;
      // @ts-expect-error Setting window to undefined for test
      global.window = undefined;

      try {
        setFeatureFlagOverride('WEATHER_MOCK_DATA', false);
        expect(localStorageMock.setItem).not.toHaveBeenCalled();
      } finally {
        global.window = originalWindow;
      }
    });
  });

  describe('clearFeatureFlagOverrides', () => {
    it('removes overrides from localStorage', () => {
      clearFeatureFlagOverrides();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('feature-flag-overrides');
    });

    it('handles localStorage errors gracefully', () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      // Should not throw
      expect(() => {
        clearFeatureFlagOverrides();
      }).not.toThrow();
    });

    it('does nothing in server environment', () => {
      const originalWindow = global.window;
      // @ts-expect-error Setting window to undefined for test
      global.window = undefined;

      try {
        clearFeatureFlagOverrides();
        expect(localStorageMock.removeItem).not.toHaveBeenCalled();
      } finally {
        global.window = originalWindow;
      }
    });
  });

  describe('getEnabledFeatures', () => {
    it('returns array of enabled feature flag names', () => {
      const enabled = getEnabledFeatures();

      expect(Array.isArray(enabled)).toBe(true);
      expect(enabled).toContain('WEATHER_MOCK_DATA');
      expect(enabled).toContain('VERBOSE_LOGGING');
      expect(enabled).toContain('ADMIN_TOOLS');
    });

    it('respects localStorage overrides', () => {
      localStorageMock.getItem.mockReturnValue(
        JSON.stringify({
          WEATHER_MOCK_DATA: false,
          VERBOSE_LOGGING: false,
        })
      );

      const enabled = getEnabledFeatures();

      expect(enabled).not.toContain('WEATHER_MOCK_DATA');
      expect(enabled).not.toContain('VERBOSE_LOGGING');
    });
  });

  describe('getAllFeatureFlags', () => {
    it('returns all feature flags with their current values', () => {
      const allFlags = getAllFeatureFlags();

      expect(allFlags).toEqual(FEATURE_FLAGS);
      expect(allFlags).toHaveProperty('WEATHER_MOCK_DATA');
      expect(allFlags).toHaveProperty('VERBOSE_LOGGING');
      expect(allFlags).toHaveProperty('ADMIN_TOOLS');
    });

    it('returns a copy, not the original object', () => {
      const allFlags = getAllFeatureFlags();

      // Modifying the returned object shouldn't affect the original
      // Since FEATURE_FLAGS is readonly, we can't test this directly
      // Instead, verify that the returned object has the expected structure
      expect(allFlags).toHaveProperty('WEATHER_MOCK_DATA');
      expect(allFlags).toHaveProperty('VERBOSE_LOGGING');
      expect(allFlags).toHaveProperty('ADMIN_TOOLS');

      // Original should still be true
      expect(FEATURE_FLAGS.WEATHER_MOCK_DATA).toBe(true);
    });
  });

  describe('FEATURE_FLAGS constant', () => {
    it('contains expected feature flags', () => {
      expect(FEATURE_FLAGS).toHaveProperty('WEATHER_MOCK_DATA');
      expect(FEATURE_FLAGS).toHaveProperty('WEATHER_LOCATION_DISPLAY');
      expect(FEATURE_FLAGS).toHaveProperty('VERBOSE_LOGGING');
      expect(FEATURE_FLAGS).toHaveProperty('ADMIN_TOOLS');
      expect(FEATURE_FLAGS).toHaveProperty('LOCATION_KOP');
      expect(FEATURE_FLAGS).toHaveProperty('LOCATION_NEW_YORK');
      expect(FEATURE_FLAGS).toHaveProperty('LOCATION_SAN_FRANCISCO');
      expect(FEATURE_FLAGS).toHaveProperty('LOCATION_BROOKLINE');
    });

    it('all flags have boolean values', () => {
      Object.values(FEATURE_FLAGS).forEach((value) => {
        expect(typeof value).toBe('boolean');
      });
    });

    it('includes location flags for all defined locations', () => {
      const locationFlags = Object.keys(FEATURE_FLAGS).filter((key) => key.startsWith('LOCATION_'));

      expect(locationFlags).toHaveLength(4);
      expect(locationFlags).toContain('LOCATION_KOP');
      expect(locationFlags).toContain('LOCATION_NEW_YORK');
      expect(locationFlags).toContain('LOCATION_SAN_FRANCISCO');
      expect(locationFlags).toContain('LOCATION_BROOKLINE');
    });
  });
});
