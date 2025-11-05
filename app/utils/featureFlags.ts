// utils/featureFlags.ts
const FEATURE_FLAG_STORAGE_KEY = 'feature-flag-overrides';

/**
 * Get feature flag overrides from localStorage
 */
function getFeatureFlagOverrides(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  
  try {
    const stored = localStorage.getItem(FEATURE_FLAG_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Set a feature flag override in localStorage
 */
export function setFeatureFlagOverride(flag: FeatureFlag, enabled: boolean): void {
  if (typeof window === 'undefined') return;
  
  try {
    const overrides = getFeatureFlagOverrides();
    overrides[flag] = enabled;
    localStorage.setItem(FEATURE_FLAG_STORAGE_KEY, JSON.stringify(overrides));
  } catch (error) {
    console.warn('Failed to save feature flag override:', error);
  }
}

/**
 * Clear all feature flag overrides
 */
export function clearFeatureFlagOverrides(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(FEATURE_FLAG_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear feature flag overrides:', error);
  }
}
export const FEATURE_FLAGS = {
  // Weather features
  WEATHER_AUTO_REFRESH: process.env.FEATURE_WEATHER_AUTO_REFRESH === 'true',
  WEATHER_LOCATION_DISPLAY: process.env.FEATURE_WEATHER_LOCATION_DISPLAY === 'true',
  WEATHER_MOCK_DATA: process.env.FEATURE_WEATHER_MOCK_DATA === 'true',

  // Location features
  LOCATION_PHILADELPHIA: process.env.FEATURE_LOCATION_PHILADELPHIA === 'true',
  LOCATION_NEW_YORK: process.env.FEATURE_LOCATION_NEW_YORK === 'true',
  LOCATION_SAN_FRANCISCO: process.env.FEATURE_LOCATION_SAN_FRANCISCO === 'true',
  LOCATION_CHICAGO: process.env.FEATURE_LOCATION_CHICAGO === 'true',

  // Logging features
  VERBOSE_LOGGING: process.env.FEATURE_VERBOSE_LOGGING === 'true',
  LOG_REQUEST_TRACING: process.env.FEATURE_LOG_REQUEST_TRACING === 'true',

  // Admin features
  ADMIN_TOOLS: process.env.FEATURE_ADMIN_TOOLS === 'true',
  ADVANCED_ANALYTICS: process.env.FEATURE_ADVANCED_ANALYTICS === 'true',

  // Email features
  EMAIL_NOTIFICATIONS: process.env.FEATURE_EMAIL_NOTIFICATIONS === 'true',
  EMAIL_TEMPLATES: process.env.FEATURE_EMAIL_TEMPLATES === 'true',

  // UI features
  DARK_MODE: process.env.FEATURE_DARK_MODE === 'true',
  NEW_UI_COMPONENTS: process.env.FEATURE_NEW_UI_COMPONENTS === 'true',

  // Performance features
  CACHING: process.env.FEATURE_CACHING === 'true',
  LAZY_LOADING: process.env.FEATURE_LAZY_LOADING === 'true',
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

/**
 * Check if a feature flag is enabled
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  // Check localStorage overrides first (client-side only)
  if (typeof window !== 'undefined') {
    const overrides = getFeatureFlagOverrides();
    if (flag in overrides) {
      return overrides[flag];
    }
  }
  
  // Fall back to environment variable default
  return FEATURE_FLAGS[flag];
}

/**
 * Get all enabled feature flags
 */
export function getEnabledFeatures(): FeatureFlag[] {
  return Object.keys(FEATURE_FLAGS).filter(
    (flag) => FEATURE_FLAGS[flag as FeatureFlag]
  ) as FeatureFlag[];
}

/**
 * Get all feature flags with their status
 */
export function getAllFeatureFlags() {
  return FEATURE_FLAGS;
}
