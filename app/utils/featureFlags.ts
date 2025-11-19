// utils/featureFlags.ts
import { db } from '@/app/lib/db';
import { createLogger } from './logger';
import { generateUUID } from '@/uuidj';

const log = createLogger('app/utils/featureFlags.ts', generateUUID());

const FEATURE_FLAG_STORAGE_KEY = 'feature-flag-overrides';

// Cache for database flags (server-side only)
let cachedFlags: Record<string, boolean> = {};
let lastFetch = 0;
const CACHE_TTL = 60000; // 60 seconds

/**
 * Clear the feature flags cache (for server-side cache invalidation)
 */
export function clearFeatureFlagsCache(): void {
  cachedFlags = {};
  lastFetch = 0;
  log.info('Feature flags cache cleared');
}

/**
 * Fetch feature flags from database with caching
 */
async function fetchFlagsFromDB(): Promise<Record<string, boolean>> {
  const now = Date.now();

  // Return cached flags if still fresh
  if (now - lastFetch < CACHE_TTL && Object.keys(cachedFlags).length > 0) {
    return cachedFlags;
  }

  try {
    const flags = await db.featureFlag.findMany({
      select: { name: true, enabled: true },
    });

    cachedFlags = flags.reduce((acc, f) => ({ ...acc, [f.name]: f.enabled }), {});
    lastFetch = now;

    return cachedFlags;
  } catch (error) {
    console.error('Failed to fetch feature flags from database:', error);
    // Return cached flags even if stale, or empty object
    return cachedFlags;
  }
}

/**
 * Get all feature flags from database (for API routes)
 */
export async function getAllFeatureFlagsFromDB(): Promise<Record<string, boolean>> {
  return fetchFlagsFromDB();
}

/**
 * Get feature flag overrides from localStorage (client-side only)
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
 * Set a feature flag override in localStorage (client-side only)
 */
export function setFeatureFlagOverride(flag: string, enabled: boolean): void {
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
 * Clear all feature flag overrides from localStorage
 */
export function clearFeatureFlagOverrides(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(FEATURE_FLAG_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear feature flag overrides:', error);
  }
}

/**
 * Environment variable fallback (legacy support)
 * @deprecated - Now using database-backed flags
 */
export const FEATURE_FLAGS = {
  // Weather features
  WEATHER_AUTO_REFRESH: process.env.FEATURE_WEATHER_AUTO_REFRESH === 'true',
  WEATHER_LOCATION_DISPLAY: process.env.FEATURE_WEATHER_LOCATION_DISPLAY === 'true',
  WEATHER_MOCK_DATA: process.env.FEATURE_WEATHER_MOCK_DATA === 'true',

  // Location features
  LOCATION_KOP: process.env.FEATURE_LOCATION_KOP === 'true',
  LOCATION_NEW_YORK: process.env.FEATURE_LOCATION_NEW_YORK !== 'false', // Default to true
  LOCATION_SAN_FRANCISCO: process.env.FEATURE_LOCATION_SAN_FRANCISCO === 'true',
  LOCATION_BROOKLINE: process.env.FEATURE_LOCATION_BROOKLINE === 'true',
  LOCATION_WILLIAMSTOWN: process.env.FEATURE_LOCATION_WILLIAMSTOWN === 'true',

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
 * - Client-side: checks localStorage overrides first, then fetches from DB via API
 * - Server-side: fetches from database with 60-second cache
 */
export async function isFeatureEnabled(flag: FeatureFlag): Promise<boolean> {
  // Client-side: check localStorage overrides first
  if (typeof window !== 'undefined') {
    const overrides = getFeatureFlagOverrides();
    if (flag in overrides) {
      return overrides[flag];
    }

    // Fetch from API (which will query the database)
    try {
      const response = await fetch('/api/feature-flags');
      if (response.ok) {
        const flags = await response.json();

        return flags[flag] ?? FEATURE_FLAGS[flag] ?? false;
      }
    } catch (error) {
      console.warn('Failed to fetch feature flags from API:', error);
    }

    // Fall back to environment variables
    return FEATURE_FLAGS[flag] ?? false;
  }

  // Server-side: fetch from database with caching
  try {
    const dbFlags = await fetchFlagsFromDB();
    return dbFlags[flag] ?? FEATURE_FLAGS[flag] ?? false;
  } catch (error) {
    console.error('Failed to check feature flag:', error);
    // Fall back to environment variables
    return FEATURE_FLAGS[flag] ?? false;
  }
}

/**
 * Synchronous version for backward compatibility
 * Only works with localStorage overrides or environment variables
 * @deprecated - Use async isFeatureEnabled() for database-backed flags
 */
export function isFeatureEnabledSync(flag: FeatureFlag): boolean {
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
 * Get all enabled feature flags (synchronous, uses cache or env vars)
 */
export function getEnabledFeatures(): FeatureFlag[] {
  // Server-side: use cached DB flags if available
  if (typeof window === 'undefined' && Object.keys(cachedFlags).length > 0) {
    return Object.entries(cachedFlags)
      .filter(([_, enabled]) => enabled)
      .map(([name]) => name as FeatureFlag);
  }

  // Fall back to environment variables
  return Object.keys(FEATURE_FLAGS).filter(
    (flag) => FEATURE_FLAGS[flag as FeatureFlag]
  ) as FeatureFlag[];
}

/**
 * Get all feature flags with their status (synchronous)
 */
export function getAllFeatureFlags() {
  return FEATURE_FLAGS;
}
