'use client';

import { useState } from 'react';
import { createLogger } from '@/app/utils/logger';
import { generateUUID } from '@/uuidj';
import {
  FEATURE_FLAGS,
  FeatureFlag,
  isFeatureEnabled,
  setFeatureFlagOverride,
  clearFeatureFlagOverrides,
} from '@/app/utils/featureFlags';

const log = createLogger('app/admin/feature-flags/page.tsx');

export default function FeatureFlagsPage() {
  const [featureStates, setFeatureStates] = useState<Record<FeatureFlag, boolean>>(() => {
    // Initialize with current values
    const states: Record<FeatureFlag, boolean> = {} as Record<FeatureFlag, boolean>;
    Object.keys(FEATURE_FLAGS).forEach((flag) => {
      states[flag as FeatureFlag] = isFeatureEnabled(flag as FeatureFlag);
    });
    return states;
  });

  const requestId = generateUUID();
  log.info('FeatureFlagsPage rendered', { featureStates });
  const enabledCount = Object.values(featureStates).filter(Boolean).length;

  const toggleFlag = (flag: FeatureFlag) => {
    const newValue = !featureStates[flag];
    setFeatureFlagOverride(flag, newValue);
    setFeatureStates((prev) => ({
      ...prev,
      [flag]: newValue,
    }));
  };

  const resetToDefaults = () => {
    clearFeatureFlagOverrides();
    // Reset to environment variable defaults
    const defaultStates: Record<FeatureFlag, boolean> = {} as Record<FeatureFlag, boolean>;
    Object.keys(FEATURE_FLAGS).forEach((flag) => {
      defaultStates[flag as FeatureFlag] = FEATURE_FLAGS[flag as FeatureFlag];
    });
    setFeatureStates(defaultStates);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Feature Flags</h1>
        <p className="text-gray-600">
          Control application features without code deployments. Currently {enabledCount} of{' '}
          {Object.keys(FEATURE_FLAGS).length} features are enabled.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {Object.entries(featureStates).map(([flag, enabled]) => (
          <div key={flag} className="border rounded-lg p-4 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg">{flag.replace(/_/g, ' ')}</h3>
              <button
                onClick={() => toggleFlag(flag as FeatureFlag)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  enabled
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {enabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-3">{getFlagDescription(flag as FeatureFlag)}</p>
            <div className="text-xs text-gray-500">
              Environment variable: <code className="bg-gray-100 px-1 rounded">FEATURE_{flag}</code>
              {FEATURE_FLAGS[flag as FeatureFlag] !== enabled && (
                <span className="ml-2 text-orange-600">(overridden)</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Feature Flag Management</h2>
          <button
            onClick={resetToDefaults}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm"
          >
            Reset to Defaults
          </button>
        </div>
        <div className="text-sm space-y-2">
          <p>
            <strong>How it works:</strong> Feature flags are stored in localStorage and override
            environment variables. Changes persist across page reloads but are reset when you clear
            browser data.
          </p>
          <p>
            <strong>In your code:</strong>
          </p>
          <pre className="bg-white p-2 rounded text-xs overflow-x-auto">
            {`import { isFeatureEnabled } from '@/app/utils/featureFlags';

if (isFeatureEnabled('WEATHER_AUTO_REFRESH')) {
  // Enable auto-refresh logic
  log.info('Auto-refresh is enabled', featureStates);
}`}
          </pre>
          <p>
            <strong>Environment variables (for production):</strong>
          </p>
          <pre className="bg-white p-2 rounded text-xs">
            {`FEATURE_WEATHER_AUTO_REFRESH=true
FEATURE_VERBOSE_LOGGING=false
FEATURE_ADMIN_TOOLS=true`}
          </pre>
        </div>
      </div>
    </div>
  );
}

function getFlagDescription(flag: FeatureFlag): string {
  const descriptions: Record<FeatureFlag, string> = {
    WEATHER_AUTO_REFRESH: 'Automatically refresh weather data every few minutes',
    WEATHER_LOCATION_DISPLAY: 'Show detailed location information with weather data',
    WEATHER_MOCK_DATA:
      'Use mock weather data instead of API calls (for development/testing). Note: Enable at least one location flag to see weather.',
    LOCATION_KOP: 'Enable King of Prussia as an available weather location',
    LOCATION_NEW_YORK: 'Enable New York City as an available weather location',
    LOCATION_SAN_FRANCISCO: 'Enable San Francisco as an available weather location',
    LOCATION_BROOKLINE: 'Enable Brookline as an available weather location :)',
    LOCATION_WILLIAMSTOWN: 'Enable Williamstown, MA as an available weather location',
    VERBOSE_LOGGING: 'Enable detailed logging for debugging and monitoring',
    LOG_REQUEST_TRACING: 'Add request IDs to all log entries for better tracing',
    ADMIN_TOOLS: 'Enable advanced administrative features and tools',
    ADVANCED_ANALYTICS: 'Show detailed analytics and performance metrics',
    EMAIL_NOTIFICATIONS: 'Send email notifications for important events',
    EMAIL_TEMPLATES: 'Use enhanced email templates with better styling',
    DARK_MODE: 'Enable dark mode theme for the application',
    NEW_UI_COMPONENTS: 'Use new experimental UI components',
    CACHING: 'Enable aggressive caching for better performance',
    LAZY_LOADING: 'Load components and data lazily for faster initial page loads',
  };
  return descriptions[flag] || 'No description available';
}
