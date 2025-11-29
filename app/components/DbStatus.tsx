'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { getDbStatus } from '@/app/utils/getDbStatus';
import { useRequestId } from '@/app/contexts/RequestIdContext';
import { createLogger } from '@/app/utils/logger';

/* --- Helpers: formatting and tiny sparkline --- */
const fmt = {
  num: (n?: number, d = 0) => (typeof n === 'number' ? n.toFixed(d) : 'N/A'),
  timeAgo: (ts?: number) => (ts ? `${Math.round((Date.now() - ts) / 1000)}s ago` : 'never'),
  dateShort: (iso?: string) => (iso ? new Date(iso).toLocaleString() : 'N/A'),
};

type DbStatusType = {
  version: string;
  postCount: number;
  latestPostDate: string | null;
  latestPostTitle?: string;
  latestPostContent?: string;
  logCount: number;
  region?: string;
  latencyMs?: number;
  lastActivity?: {
    activeConnections: number;
    lastActivity: Date | null;
    lastVacuum: Date | null;
    lastAutoVacuum: Date | null;
    totalOperations: number;
  };
};

// 🛠️ New Type: Define Health Check result type for non-null initial state
type HealthResult = {
  ok: boolean | null;
  latencyMs?: number;
  error?: string;
};

console.log('[DbStatus] DbStatus component loaded');

export default function DbStatus() {
  const [status, setStatus] = useState<DbStatusType | null>(null);
  const [neonLimits] = useState<any | null>(null);

  // 🛠️ Updated State: Initialize to non-null object for persistent display
  const [healthResult, setHealthResult] = useState<HealthResult>({
    ok: null, // null means not yet checked/pending
    latencyMs: undefined,
    error: undefined,
  });

  // 🛠️ New State: For animation and change tracking
  const [latencyDirection, setLatencyDirection] = useState<'up' | 'down' | 'none'>('none');
  const [healthCheckTimestamp, setHealthCheckTimestamp] = useState<number | null>(null);
  // Derived state for 'last checked' time
  const [lastCheckedAgo, setLastCheckedAgo] = useState<string>('');

  // ...removed unused states...

  // 🆔 Get the SHARED requestId from context!
  const requestId = useRequestId();

  const log = useRef(createLogger('app/components/DbStatus.tsx', requestId));

  console.log(`🔍 DbStatus using requestId: ${requestId}`);

  // Log event once on mount
  useEffect(() => {
    const baseUrl =
      (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
      'https://www.kraus.my.id';
    const jck = async () => {
      try {
        await log.current.info(`Retrieving database status baseUrl: ${baseUrl}`, {
          userAction: 'fetch',
          source: 'DbStatus',
          email: 'bypass_throttle',
        });
      } catch (error) {
        console.error('Failed to log event:', error);
      }
    };
    jck();
  }, []);

  // Update lastCheckedAgo every second if healthCheckTimestamp is set
  useEffect(() => {
    if (!healthCheckTimestamp) return;
    const update = () => {
      setLastCheckedAgo(`${Math.round((Date.now() - healthCheckTimestamp) / 1000)}s ago`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [healthCheckTimestamp]);

  // Health check handler
  const runHealthCheck = useCallback(async () => {
    setHealthResult((prev) => ({ ...prev, ok: null }));
    setHealthCheckTimestamp(Date.now());
    try {
      const result = await getDbStatus();
      setHealthResult({
        ok: typeof result.latencyMs === 'number',
        latencyMs: result.latencyMs,
      });
      if (healthResult.latencyMs != null && result.latencyMs != null) {
        setLatencyDirection(
          result.latencyMs > healthResult.latencyMs
            ? 'up'
            : result.latencyMs < healthResult.latencyMs
              ? 'down'
              : 'none'
        );
      } else {
        setLatencyDirection('none');
      }
    } catch {
      setHealthResult({ ok: false });
      setLatencyDirection('none');
    }
  }, [healthResult.latencyMs]);

  // Fetch DB status on mount if not already loaded
  useEffect(() => {
    if (status === null) {
      (async () => {
        try {
          const result = await getDbStatus();
          // Convert latestPostDate to string if it's a Date
          setStatus({
            ...result,
            latestPostDate:
              result.latestPostDate instanceof Date
                ? result.latestPostDate.toISOString()
                : (result.latestPostDate ?? null),
          });
        } catch (err) {
          console.error('Failed to fetch DB status:', err);
        }
      })();
    }
  }, [status]);

  if (!status) return <p>Loading DB status...</p>;

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold">Database Status</h2>
      {/* Health Check Section (animated) */}
      <section className="p-4 bg-white border rounded shadow-md">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2">
            Database Health Check
            <button
              onClick={runHealthCheck}
              className="px-2 py-1 text-xs bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors"
            >
              Run Check
            </button>
          </h3>
          {healthCheckTimestamp && (
            <p className="text-xs text-gray-500">Last checked {lastCheckedAgo}</p>
          )}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-4">
          <motion.div
            key={healthResult.latencyMs}
            initial={{ scale: 0.9, color: '#333' }}
            animate={{ scale: 1.1, color: healthResult.ok ? '#059669' : '#dc2626' }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="p-3 rounded bg-gray-50 border flex flex-col items-center justify-center"
          >
            <span className="text-xs text-gray-500">Latency</span>
            <span className="text-2xl font-bold">
              {healthResult.latencyMs != null ? `${healthResult.latencyMs} ms` : 'N/A'}
              {latencyDirection === 'up' && <span className="ml-2 text-green-600">↑</span>}
              {latencyDirection === 'down' && <span className="ml-2 text-red-600">↓</span>}
            </span>
            <span
              className={`mt-1 text-sm font-semibold ${healthResult.ok ? 'text-green-600' : 'text-red-600'}`}
            >
              {healthResult.ok === null ? 'Pending' : healthResult.ok ? 'Healthy' : 'Unhealthy'}
            </span>
          </motion.div>
          <div className="p-3 rounded bg-gray-50 border flex flex-col items-center justify-center">
            <span className="text-xs text-gray-500">Utilization</span>
            <span
              className={`text-xl font-bold ${neonLimits.utilization >= 80 ? 'text-red-600' : neonLimits.utilization >= 50 ? 'text-yellow-600' : 'text-green-600'}`}
            >
              {neonLimits.utilization != null ? `${neonLimits.utilization}%` : 'N/A'}
            </span>
          </div>
        </div>
      </section>
      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="p-4 bg-white border rounded shadow flex flex-col items-center"
        >
          <span className="text-xs text-gray-500">Post Count</span>
          <span className="text-xl font-bold">{fmt.num(status.postCount)}</span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="p-4 bg-white border rounded shadow flex flex-col items-center"
        >
          <span className="text-xs text-gray-500">Log Count</span>
          <span className="text-xl font-bold">{fmt.num(status.logCount)}</span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="p-4 bg-white border rounded shadow flex flex-col items-center"
        >
          <span className="text-xs text-gray-500">Latest Post</span>
          <span className="text-sm font-semibold">{status.latestPostTitle || 'N/A'}</span>
          <span className="text-xs text-gray-400">
            {fmt.dateShort(status.latestPostDate ?? undefined)}
          </span>
        </motion.div>
      </div>
      {/* Environment Information */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-2">Environment Information</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-3 bg-gray-50 border rounded">
            <span className="text-xs text-gray-500">Region</span>
            <span className="text-sm font-semibold">{status.region || 'Unknown'}</span>
          </div>
          <div className="p-3 bg-gray-50 border rounded">
            <span className="text-xs text-gray-500">Version</span>
            <span className="text-sm font-semibold">{status.version}</span>
          </div>
          <div className="p-3 bg-gray-50 border rounded">
            <span className="text-xs text-gray-500">Active Connections</span>
            <span className="text-sm font-semibold">
              {status.lastActivity?.activeConnections ?? 'N/A'}
            </span>
          </div>
          <div className="p-3 bg-gray-50 border rounded">
            <span className="text-xs text-gray-500">Last Activity</span>
            <span className="text-sm font-semibold">
              {status.lastActivity?.lastActivity
                ? fmt.dateShort(status.lastActivity.lastActivity.toString())
                : 'N/A'}
            </span>
          </div>
          <div className="p-3 bg-gray-50 border rounded">
            <span className="text-xs text-gray-500">Last Vacuum</span>
            <span className="text-sm font-semibold">
              {status.lastActivity?.lastVacuum
                ? fmt.dateShort(status.lastActivity.lastVacuum.toString())
                : 'N/A'}
            </span>
          </div>
          <div className="p-3 bg-gray-50 border rounded">
            <span className="text-xs text-gray-500">Last Auto-Vacuum</span>
            <span className="text-sm font-semibold">
              {status.lastActivity?.lastAutoVacuum
                ? fmt.dateShort(status.lastActivity.lastAutoVacuum.toString())
                : 'N/A'}
            </span>
          </div>
          <div className="p-3 bg-gray-50 border rounded">
            <span className="text-xs text-gray-500">Total Table Operations</span>
            <span className="text-sm font-semibold">
              {status.lastActivity?.totalOperations ?? 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Consumption Metrics (example, adapt as needed) */}
      {/*
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-2">Consumption Metrics</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-3 bg-gray-50 border rounded">
            <span className="text-xs text-gray-500">Compute Size</span>
            <span className="text-sm font-semibold">0.5 → 2 CU</span>
          </div>
          <div className="p-3 bg-gray-50 border rounded">
            <span className="text-xs text-gray-500">History Retention</span>
            <span className="text-sm font-semibold">1 day</span>
          </div>
          <div className="p-3 bg-gray-50 border rounded">
            <span className="text-xs text-gray-500">Max Connections</span>
            <span className="text-sm font-semibold">901</span>
          </div>
        </div>
      </div>
      */}

      {/* Slow Queries (example, adapt as needed) */}
      {/*
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-2">Slow Queries</h2>
        <div className="space-y-2">
          <div className="p-3 border rounded bg-white shadow-sm">
            <pre className="whitespace-pre-wrap text-sm">SELECT ...</pre>
            <div className="text-xs text-gray-600">Mean: 18 ms | Calls: 4</div>
          </div>
        </div>
      </div>
      */}

      {/* Action Buttons (example, adapt as needed) */}
      <div className="flex gap-4 mt-8">
        <button className="px-3 py-1 bg-gray-200 rounded">Make me a toast!</button>
        <button className="px-3 py-1 bg-blue-500 text-white rounded">Send Status Email</button>
      </div>
    </div>
  );
}
