'use client';

import { useState, useEffect } from 'react';
import { createLogger } from '@/app/utils/logger';
import { generateUUID } from '@/uuidj';

const requestId = generateUUID();
const log = createLogger('app/admin/feature-flags/page.tsx', requestId);

type FeatureFlag = {
  id: number;
  name: string;
  enabled: boolean;
  description: string | null;
  category: string | null;
  updatedAt: Date;
  createdAt: Date;
};

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFlags = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/feature-flags');
      if (!response.ok) throw new Error('Failed to fetch feature flags');
      const data = await response.json();
      setFlags(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      log.error('Failed to fetch feature flags', { error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  const toggleFlag = async (name: string, currentValue: boolean) => {
    try {
      const response = await fetch('/api/admin/feature-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, enabled: !currentValue }),
      });

      if (!response.ok) throw new Error('Failed to update feature flag');

      // Optimistically update UI
      setFlags((prev) => prev.map((f) => (f.name === name ? { ...f, enabled: !currentValue } : f)));

      log.info('Feature flag toggled', { name, enabled: !currentValue });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      log.error('Failed to toggle feature flag', { error: String(err) });
    }
  };

  const enabledCount = flags.filter((f) => f.enabled).length;

  // Group flags by category
  const groupedFlags = flags.reduce(
    (acc, flag) => {
      const category = flag.category || 'other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(flag);
      return acc;
    },
    {} as Record<string, FeatureFlag[]>
  );

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <svg
            className="animate-spin h-5 w-5 text-gray-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          <span>Loading feature flags...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <h2 className="text-red-800 font-semibold mb-2">Error</h2>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => fetchFlags()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Feature Flags</h1>
        <p className="text-gray-600">
          Control application features without code deployments. Currently {enabledCount} of{' '}
          {flags.length} features are enabled. Changes take effect immediately across all server and
          client components.
        </p>
      </div>

      {Object.entries(groupedFlags).map(([category, categoryFlags]) => (
        <div key={category} className="mb-8">
          <h2 className="text-xl font-semibold mb-4 capitalize">{category} Features</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categoryFlags.map((flag) => (
              <div
                key={flag.id}
                className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm">{flag.name.replace(/_/g, ' ')}</h3>
                  <button
                    onClick={() => toggleFlag(flag.name, flag.enabled)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      flag.enabled
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {flag.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
                {flag.description && (
                  <p className="text-sm text-gray-600 mb-2">{flag.description}</p>
                )}
                <div className="text-xs text-gray-500">
                  <div>Updated: {new Date(flag.updatedAt).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h2 className="font-semibold mb-4">How Feature Flags Work</h2>
        <div className="text-sm space-y-2">
          <p>
            <strong>Database-backed:</strong> All feature flags are now stored in the database with
            a 60-second cache. Changes are immediately reflected across all instances without
            requiring a redeploy.
          </p>
          <p>
            <strong>Server-side usage (async):</strong>
          </p>
          <pre className="bg-white p-2 rounded text-xs overflow-x-auto">
            {`import { isFeatureEnabled } from '@/app/utils/featureFlags';

// API routes and server components
if (await isFeatureEnabled('VERBOSE_LOGGING')) {
  log.info('Detailed logging enabled');
}`}
          </pre>
          <p>
            <strong>Client-side usage:</strong> The client fetches flags from{' '}
            <code>/api/feature-flags</code> with automatic caching.
          </p>
        </div>
      </div>
    </div>
  );
}
