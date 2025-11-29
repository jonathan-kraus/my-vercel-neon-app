'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { getDbStatus } from '@/app/utils/getDbStatus';
import { useRequestId } from '@/app/contexts/RequestIdContext';
import { createLogger } from '@/app/utils/logger';
import { isFeatureEnabled } from '@/app/utils/featureFlags';
import { generateUUID } from '@/uuidj';

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

type EnvInfoType = {
  deploymentUrl: string;
  environment: string;
  vercelRegion: string;
  gitCommitSha: string;
  gitCommitMessage: string;
  gitCommitAuthor: string;
  VERCEL_DEPLOYMENT_ID: string;
  VERCEL_GIT_PROVIDER: string;
  VERCEL_GIT_REPO_SLUG: string;
  VERCEL_GIT_REPO_OWNER: string;
  databaseHost: string;
  databaseName: string;
};

type ConsumptionPeriod = {
  period_id: string;
  consumption: Array<{
    timeframe_start: string;
    timeframe_end: string;
    active_time_seconds: number;
    compute_time_seconds: number;
    written_data_bytes: number;
    synthetic_storage_size_bytes: number;
  }>;
  data_storage_bytes_hour: number;
  data_transfer_bytes: number;
  written_data_bytes: number;
  compute_time_seconds: number;
  active_time_seconds: number;
};

type ConsumptionData = {
  periods: ConsumptionPeriod[];
  pagination?: {
    cursor: string;
  };
};

// 🛠️ New Type: Define Health Check result type for non-null initial state
type HealthResult = {
  ok: boolean | null;
  latencyMs?: number;
  error?: string;
};

console.log('[DbStatus] DbStatus component loaded');

const MDiv = motion.div as unknown as any;
const MPanel = motion.div as unknown as any;

function RegionBadge({ region }: { region: string }) {
  return (
    <span className="inline-block px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded">
      Region: {region}
    </span>
  );
}

export default function DbStatus() {
  const [status, setStatus] = useState<DbStatusType | null>(null);
  const [envInfo, setEnvInfo] = useState<EnvInfoType | null>(null);
  const [consumption, setConsumption] = useState<ConsumptionData | null>(null);
  const [neonMeta, setNeonMeta] = useState<any | null>(null);
  const [neonLimits, setNeonLimits] = useState<any | null>(null);

  // 🛠️ Updated State: Initialize to non-null object for persistent display
  const [healthResult, setHealthResult] = useState<HealthResult>({
    ok: null, // null means not yet checked/pending
    latencyMs: undefined,
    error: undefined,
  });

  // 🛠️ New State: For animation and change tracking
  const [prevLatency, setPrevLatency] = useState<number | null>(null);
  const [latencyDirection, setLatencyDirection] = useState<'up' | 'down' | 'none'>('none');
  const [healthCheckTimestamp, setHealthCheckTimestamp] = useState<number | null>(null);

  const [neonRequestId, setNeonRequestId] = useState<string | null>(null);
  const [slowQueries, setSlowQueries] = useState<any[] | null>(null);
  const [explainLoading, setExplainLoading] = useState<Record<number, boolean>>({});
  const [explainPlans, setExplainPlans] = useState<Record<number, string[]>>({});
  const [explainErrors, setExplainErrors] = useState<Record<number, string>>({});

  // 🆔 Get the SHARED requestId from context!
  const requestId = useRequestId();

  const log = useRef(createLogger('app/components/DbStatus.tsx', requestId));
  const emailSentRef = useRef(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{
    type: 'success' | 'throttled' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const region = status?.region || 'Unknown';

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

  // Fetch DB status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await getDbStatus(requestId);
        const formattedData: DbStatusType = {
          ...data,
          latestPostDate: data.latestPostDate ? data.latestPostDate.toISOString() : null,
          logCount: data.logCount,
        };
        setStatus(formattedData);
      } catch (err) {
        console.error('Failed to fetch DB status:', err);
      }
    };

    fetchStatus();
  }, [requestId]);

  // Fetch environment info
  useEffect(() => {
    const fetchEnvInfo = async () => {
      try {
        const response = await fetch('/api/env-info');
        if (response.ok) {
          const data = await response.json();
          setEnvInfo(data);
        }
      } catch (err) {
        console.error('Failed to fetch environment info:', err);
      }
    };

    fetchEnvInfo();
  }, []);

  // Fetch consumption metrics
  useEffect(() => {
    const fetchConsumption = async () => {
      try {
        const response = await fetch('/api/neon-consumption');
        if (response.ok) {
          const data = await response.json();
          setConsumption(data);
        } else {
          console.log('Consumption metrics not available (may require paid plan)');
        }
      } catch (err) {
        console.error('Failed to fetch consumption metrics:', err);
      }
    };

    fetchConsumption();
  }, []);

  // Fetch neon metadata
  useEffect(() => {
    // Generate a single neonRequestId and reuse it for all neon-related calls
    const id = generateUUID();
    setNeonRequestId(id);

    const fetchMeta = async () => {
      try {
        await log.current.info('Fetching neon metadata', { neonRequestId: id });
        const res = await fetch('/api/neon/metadata', { headers: { 'x-request-id': id } });
        if (res.ok) {
          const data = await res.json();
          setNeonMeta(data);
          await log.current.info('Neon metadata received', { neonRequestId: id, host: data.host });
        }
      } catch (err) {
        console.error('Failed to fetch neon metadata:', err);
        await log.current.error('Failed to fetch neon metadata', {
          neonRequestId: id,
          error: String(err),
        });
      }
    };

    const fetchLimits = async () => {
      try {
        await log.current.info('Fetching neon limits', { neonRequestId: id });
        const res = await fetch('/api/neon/limits', { headers: { 'x-request-id': id } });
        if (res.ok) {
          const data = await res.json();
          setNeonLimits(data);
          await log.current.info('Neon limits received', {
            neonRequestId: id,
            utilization: data.utilization,
          });
        }
      } catch (err) {
        console.error('Failed to fetch neon limits:', err);
        await log.current.error('Failed to fetch neon limits', {
          neonRequestId: id,
          error: String(err),
        });
      }
    };

    const fetchSlow = async () => {
      try {
        await log.current.info('Fetching slow queries', { neonRequestId: id });
        const res = await fetch('/api/neon/slow-queries', { headers: { 'x-request-id': id } });
        if (res.ok) {
          const data = await res.json();
          setSlowQueries(data.queries || []);
          await log.current.info('Slow queries received', {
            neonRequestId: id,
            source: data.source,
          });
        }
      } catch (err) {
        console.error('Failed to fetch slow queries:', err);
        await log.current.error('Failed to fetch slow queries', {
          neonRequestId: id,
          error: String(err),
        });
      }
    };

    fetchMeta();
    fetchLimits();
    fetchSlow();
  }, []);

  // Email sender
  const sendStatusEmail = useCallback(async () => {
    // Only send emails in browser environment
    if (typeof window === 'undefined') {
      console.log('Skipping email send during build/static generation');
      return;
    }

    if (!status) {
      toast.error('Status not loaded yet');
      return;
    }

    setEmailLoading(true);
    setEmailStatus({ type: null, message: '' });

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmail: 'jonathan@kraus.my.id',
          toName: 'Jonathan',
          subject: `DbStatus Report - ${new Date().toISOString()}`,
          message: `Database Status Report:
- Neon Region: ${region}
- PostgreSQL Version: ${status.version}
- Total Posts: ${status.postCount}
- Latest Post Date: ${status.latestPostDate ? new Date(status.latestPostDate).toLocaleString() : 'N/A'}
- Latest Post Title: ${status.latestPostTitle}
- Latest Post Content: ${status.latestPostContent}
- Total Logs: ${status.logCount}
- Latency: ${status.latencyMs} ms
- Active Connections: ${status.lastActivity?.activeConnections || 0}
- Last Database Activity: ${status.lastActivity?.lastActivity ? new Date(status.lastActivity.lastActivity).toLocaleString() : 'No recent activity detected'}
- Last Vacuum: ${status.lastActivity?.lastVacuum ? new Date(status.lastActivity.lastVacuum).toLocaleString() : 'Never'}
- Last Auto-Vacuum: ${status.lastActivity?.lastAutoVacuum ? new Date(status.lastActivity.lastAutoVacuum).toLocaleString() : 'Never'}
- Total Table Operations: ${status.lastActivity?.totalOperations || 0}
- Generated at: ${new Date().toISOString()}`,
          requestId,
          metadata: 'bypass_throttle',
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }

      const result = await response.json();
      console.log('Email API result:', result);
      await log.current.info(`Database email status: ${result.status}`, {
        userAction: 'fetch',
        source: 'DbStatus',
      });
      // Handle different response types
      if (result.status === 'success') {
        setEmailStatus({ type: 'success', message: 'Email sent successfully!' });
        toast.success('Status report email sent!');
      } else if (result.status === 'skipped' && result.reason === 'throttled') {
        setEmailStatus({
          type: 'throttled',
          message: 'Email throttled - too soon since last send',
        });
        toast('Email throttled - please wait before sending again', { icon: '⏱️' });
      } else {
        setEmailStatus({ type: 'error', message: 'Email send failed' });
        toast.error('Email send failed');
      }
    } catch (err) {
      console.error('Failed to send status email:', err);
      setEmailStatus({
        type: 'error',
        message: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
      });
      toast.error('Failed to send status email');
    } finally {
      setEmailLoading(false);
    }
  }, [status, region, requestId]);

  // Auto-send once after status loads (only in browser, not during build)
  useEffect(() => {
    (async () => {
      if (
        status &&
        !emailSentRef.current &&
        typeof window !== 'undefined' &&
        (await isFeatureEnabled('EMAIL_NOTIFICATIONS'))
      ) {
        emailSentRef.current = true;
        sendStatusEmail();
      }
    })();
  }, [status, sendStatusEmail]);

  // 🛠️ Updated Health check action with animation logic
  const runHealthCheck = useCallback(async () => {
    // 1. Store old latency before we update the loading state
    const oldLatency = healthResult.latencyMs;

    // 2. Set to loading state (ok:null) and reset animation
    setHealthResult((s) => ({ ...s, ok: null, latencyMs: undefined }));
    setLatencyDirection('none');

    try {
      const headers: Record<string, string> = {};
      if (neonRequestId) headers['x-request-id'] = neonRequestId;
      const res = await fetch('/api/neon/health', { headers });

      if (!res.ok) {
        const data = await res.json();
        setHealthResult({ ok: false, error: data.error });
        setHealthCheckTimestamp(Date.now());
        toast.error('Health check failed');
        await log.current.error('Health check failed', { neonRequestId, error: data.error });
        return;
      }

      const data = await res.json();
      const newLatency = data.latencyMs;

      // 3. Logic to determine latency delta and animation direction
      if (typeof newLatency === 'number' && typeof oldLatency === 'number') {
        setPrevLatency(oldLatency);
        if (newLatency > oldLatency) {
          setLatencyDirection('up');
        } else if (newLatency < oldLatency) {
          setLatencyDirection('down');
        } else {
          setLatencyDirection('none');
        }
      } else {
        setPrevLatency(null);
        setLatencyDirection('none');
      }

      setHealthResult(data);
      setHealthCheckTimestamp(Date.now()); // Set timestamp
      toast.success(`Health OK — ${newLatency} ms`);
      await log.current.info('Health check executed', {
        neonRequestId,
        latencyMs: newLatency,
      });
    } catch (err) {
      console.error('Health check error', err);
      setHealthResult({ ok: false, error: String(err) });
      setHealthCheckTimestamp(Date.now());
      setLatencyDirection('none');
      toast.error('Health check error');
      await log.current.error('Health check exception', { neonRequestId, error: String(err) });
    }
  }, [neonRequestId, healthResult.latencyMs]); // Dependency array updated

  // Explain query
  const runExplain = useCallback(
    async (query: string, idx: number) => {
      try {
        setExplainLoading((s) => ({ ...s, [idx]: true }));
        setExplainErrors((s) => ({ ...s, [idx]: '' }));
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (neonRequestId) headers['x-request-id'] = neonRequestId;

        await log.current.info('Requesting explain plan', {
          neonRequestId,
          idx,
          preview: query.slice(0, 200),
        });

        const res = await fetch('/api/neon/explain', {
          method: 'POST',
          headers,
          body: JSON.stringify({ query }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Unknown' }));
          setExplainErrors((s) => ({ ...s, [idx]: err.error || 'Explain failed' }));
          await log.current.error('Explain failed', {
            neonRequestId,
            idx,
            error: err.error || 'Explain failed',
          });
        } else {
          const data = await res.json();
          setExplainPlans((s) => ({ ...s, [idx]: data.plan || [] }));
          await log.current.info('Explain succeeded', {
            neonRequestId,
            idx,
            lines: (data.plan || []).length,
          });
        }
      } catch (err) {
        setExplainErrors((s) => ({ ...s, [idx]: String(err) }));
        await log.current.error('Explain exception', { neonRequestId, idx, error: String(err) });
      } finally {
        setExplainLoading((s) => ({ ...s, [idx]: false }));
      }
    },
    [neonRequestId]
  );

  if (!status) return <p>Loading DB status...</p>;

  return (
    <div className="space-y-4 animate-fade-in delay-[index * 100]">
      <h2 className="text-xl font-bold">Database Status</h2>
      {/* 🛠️ New: Always Display Health Check Section */}
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
            <p className="text-xs text-gray-500">
              Last checked {Math.round((Date.now() - healthCheckTimestamp) / 1000)}s ago
            </p>
          )}
        </div>

        <div className="mt-3 space-y-2">
          <p className="text-sm text-gray-600">
            <strong>Status:</strong>{' '}
            <span
              className={`font-semibold ${
                healthResult.ok === true
                  ? 'text-green-600'
                  : healthResult.ok === false
                    ? 'text-red-600'
                    : 'text-gray-500' // Pending/Not Checked
              }`}
            >
              {healthResult.ok === true ? 'OK' : healthResult.ok === false ? 'Failed' : 'Pending'}
            </span>
          </p>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              <strong>Latency:</strong>
            </span>

            {/* 🛠️ Animated Latency Display (scale animation) */}
            <MDiv
              initial={{ scale: 1 }}
              // Animate scale if direction is not 'none'
              animate={{ scale: latencyDirection !== 'none' ? 1.2 : 1 }}
              // Animation parameters for a 'pop' effect
              transition={{ type: 'spring', stiffness: 300, damping: 20, duration: 0.3 }}
              className="inline-flex items-center font-bold text-lg"
              // Set base color
              style={{
                color:
                  healthResult.ok === true
                    ? '#16a34a'
                    : healthResult.ok === false
                      ? '#dc2626'
                      : '#6b7280',
              }}
            >
              {healthResult.latencyMs !== undefined ? `${healthResult.latencyMs} ms` : 'N/A'}

              {/* Animation Indicators (fade and slide) */}
              <AnimatePresence>
                {latencyDirection === 'up' && (
                  <motion.span
                    key="up"
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 5 }}
                    className="ml-1 text-red-600 text-sm"
                    title="Latency increased"
                  >
                    ▲
                  </motion.span>
                )}
                {latencyDirection === 'down' && (
                  <motion.span
                    key="down"
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 5 }}
                    className="ml-1 text-green-600 text-sm"
                    title="Latency decreased"
                  >
                    ▼
                  </motion.span>
                )}
              </AnimatePresence>
            </MDiv>

            {/* Display previous latency */}
            {typeof prevLatency === 'number' && latencyDirection !== 'none' && (
              <span className="text-xs text-gray-500 ml-2">(was {prevLatency} ms)</span>
            )}
          </div>

          {healthResult.error && (
            <p className="text-sm text-red-600">
              <strong>Error:</strong> {healthResult.error}
            </p>
          )}
        </div>
      </section>
      {/* End Health Check Section */}
      {/* --- Consumption cards (compact) --- */}
      {consumption && consumption.periods && consumption.periods.length > 0 && (
        <section className="mt-6">
          <h3 className="text-lg font-semibold">Consumption (recent)</h3>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {consumption.periods.slice(0, 3).map((period: any) => (
              <motion.div
                key={period.period_id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                className="p-3 bg-white border rounded shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500">Period</div>
                    <div className="text-sm font-medium text-gray-800">{period.period_id}</div>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <div>
                      {period.start_time ? new Date(period.start_time).toLocaleString() : '—'}
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-xs text-gray-500">Active time</div>
                    <div className="font-semibold">
                      {(period.active_time_seconds / 3600).toFixed(2)} h
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Compute</div>
                    <div className="font-semibold">
                      {(period.compute_time_seconds / 3600).toFixed(2)} h
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Queries</div>
                    <div className="font-semibold">{period.query_count ?? 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Errors</div>
                    <div className="font-semibold text-red-600">{period.error_count ?? 0}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}
      {/* --- Incidents & Slow Queries (compact list) --- */}
      {slowQueries && slowQueries.length > 0 && (
        <section className="mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Incidents & Slow Queries</h3>
            <div className="text-xs text-gray-500">{slowQueries.length} items</div>
          </div>

          <div className="mt-3 space-y-2">
            {slowQueries.map((q: any, idx: number) => {
              const mean = q.mean_time ?? q.duration_ms ?? 0;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.12, delay: idx * 0.02 }}
                  className="p-3 border rounded bg-white shadow-sm flex gap-3"
                >
                  <div className="w-12 shrink-0 flex flex-col items-center justify-center">
                    <div className="text-xs text-gray-500">Avg</div>
                    <div className="text-sm font-semibold">{fmt.num(mean, 0)} ms</div>
                  </div>

                  <div className="flex-1">
                    <div className="text-xs text-gray-500">Query</div>
                    <pre className="whitespace-pre-wrap text-sm max-h-20 overflow-auto text-gray-800">
                      {q.query?.length > 400 ? q.query.slice(0, 400) + '…' : q.query}
                    </pre>
                    <div className="mt-2 text-xs text-gray-500 flex items-center gap-3">
                      <div>
                        <strong>Calls:</strong> {q.calls ?? 'N/A'}
                      </div>
                      <div>
                        <strong>Max:</strong> {q.max_time ? `${fmt.num(q.max_time, 0)} ms` : 'N/A'}
                      </div>
                      <div>
                        <strong>Last:</strong>{' '}
                        {q.last_seen ? new Date(q.last_seen).toLocaleString() : 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="w-28 flex flex-col items-end gap-2">
                    <div className="text-xs text-gray-500">Trend</div>
                    <div className="text-sm font-medium text-gray-800">{fmt.num(mean, 0)} ms</div>
                    <div className="text-xs text-gray-400">{q.calls ?? 0} calls</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}
      <p className="flex items-center gap-2">
        <strong>Neon Region:</strong>
        <RegionBadge region={region} />
      </p>
      <p>
        <strong>Compute Size:</strong> 0.5 ↔ 2 CU
      </p>
      <p>
        <strong>History Retention:</strong> 1 day
      </p>
      <p>
        <strong>PostgreSQL Version:</strong> {status.version}
      </p>
      <p>
        <strong>Total Posts:</strong> {status.postCount}
      </p>
      <p>
        <strong>Latest Post Date:</strong>{' '}
        {status.latestPostDate ? new Date(status.latestPostDate).toLocaleString() : 'N/A'}
      </p>
      <p>
        <strong>Latest Post Title:</strong> {status.latestPostTitle}
      </p>
      <p>
        <strong>Latest Post Content:</strong> {status.latestPostContent}
      </p>
      <p>
        <strong>Total Logs:</strong> {status.logCount}
      </p>
      <p>
        <strong>Latency (API):</strong> {status.latencyMs} ms
      </p>
      {neonLimits && (
        <>
          <h3 className="mt-4 font-semibold">Connection Limits</h3>
          <p>
            <strong>Max Connections:</strong> {neonLimits.maxConnections ?? 'N/A'}
          </p>
          <p>
            <strong>Active Connections:</strong> {neonLimits.activeConnections ?? 0}
          </p>
          <p>
            <strong>Utilization:</strong>{' '}
            <span
              className={`px-2 py-1 rounded text-xs font-semibold ${
                neonLimits.utilization >= 80
                  ? 'bg-red-100 text-red-800'
                  : neonLimits.utilization >= 50
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
              }`}
            >
              {neonLimits.utilization != null ? `${neonLimits.utilization}%` : 'N/A'}
            </span>
          </p>
        </>
      )}
      <p>
        <strong>Active Connections:</strong> {status.lastActivity?.activeConnections || 0}
      </p>
      <p>
        <strong>Last Database Activity:</strong>{' '}
        {status.lastActivity?.lastActivity
          ? new Date(status.lastActivity.lastActivity).toLocaleString()
          : 'No recent activity detected'}
      </p>
      <p>
        <strong>Last Vacuum:</strong>{' '}
        {status.lastActivity?.lastVacuum
          ? new Date(status.lastActivity.lastVacuum).toLocaleString()
          : 'Never'}
      </p>
      <p>
        <strong>Last Auto-Vacuum:</strong>{' '}
        {status.lastActivity?.lastAutoVacuum
          ? new Date(status.lastActivity.lastAutoVacuum).toLocaleString()
          : 'Never'}
      </p>
      <p>
        <strong>Total Table Operations:</strong> {status.lastActivity?.totalOperations || 0}
      </p>
      <h2 className="text-xl font-bold mt-6 pt-6 border-t border-gray-300">
        Environment Information
      </h2>
      {envInfo ? (
        <>
          <p>
            <strong>Deployment URL:</strong> {envInfo.deploymentUrl}
          </p>
          <p className="flex items-center gap-2">
            <strong>Environment:</strong>
            <span
              className={`px-2 py-1 rounded text-xs font-semibold ${
                envInfo.environment === 'production'
                  ? 'bg-green-100 text-green-800'
                  : envInfo.environment === 'preview'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-blue-100 text-blue-800'
              }`}
            >
              {envInfo.environment}
            </span>
          </p>
          <p>
            <strong>Vercel Region:</strong> {envInfo.vercelRegion}
          </p>
          {envInfo.gitCommitSha !== 'N/A' && (
            <p>
              <strong>Git Commit:</strong> {envInfo.gitCommitSha}
            </p>
          )}
          {envInfo.gitCommitMessage !== 'N/A' && (
            <p>
              <strong>Commit Message:</strong> {envInfo.gitCommitMessage}
            </p>
          )}
          {envInfo.gitCommitAuthor !== 'N/A' && (
            <p>
              <strong>Author:</strong> {envInfo.gitCommitAuthor}
            </p>
          )}
          {envInfo.VERCEL_DEPLOYMENT_ID !== 'N/A' && (
            <p>
              <strong>Deployment ID:</strong> {envInfo.VERCEL_DEPLOYMENT_ID}
            </p>
          )}
          {envInfo.VERCEL_GIT_PROVIDER !== 'N/A' && (
            <p>
              <strong>Git Provider:</strong> {envInfo.VERCEL_GIT_PROVIDER}
            </p>
          )}
          {envInfo.VERCEL_GIT_REPO_OWNER !== 'N/A' && envInfo.VERCEL_GIT_REPO_SLUG !== 'N/A' && (
            <p>
              <strong>Repository:</strong> {envInfo.VERCEL_GIT_REPO_OWNER}/
              {envInfo.VERCEL_GIT_REPO_SLUG}
            </p>
          )}
          <p>
            <strong>Database Host:</strong> {envInfo.databaseHost}
          </p>
          {envInfo.databaseName !== 'N/A' && (
            <p>
              <strong>Database Name:</strong> {envInfo.databaseName}
            </p>
          )}
          {neonMeta && (
            <>
              <h3 className="mt-4 font-semibold">Neon Metadata</h3>
              <p>
                <strong>Host:</strong> {neonMeta.host}
              </p>
              <p>
                <strong>Branch:</strong> {neonMeta.branch || 'N/A'}
              </p>
              <p>
                <strong>User:</strong> {neonMeta.username}
              </p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={async () => {
                    const toCopy = `${neonMeta.username}@${neonMeta.host}/${neonMeta.database}`;
                    try {
                      await navigator.clipboard.writeText(toCopy);
                      toast.success('Connection info copied to clipboard');
                      await log.current.info('Masked connection copied', {
                        neonRequestId,
                        host: neonMeta.host,
                      });
                    } catch (err) {
                      toast.error('Failed to copy');
                      await log.current.error('Failed copying masked connection', {
                        neonRequestId,
                        error: String(err),
                      });
                    }
                  }}
                  className="px-3 py-1 bg-gray-200 rounded"
                >
                  Copy masked connection
                </button>
                <a
                  href={neonMeta.neonConsoleUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1 bg-blue-500 text-white rounded"
                >
                  Open Neon Console
                </a>
              </div>
            </>
          )}
        </>
      ) : (
        <p className="text-gray-500">Loading environment information...</p>
      )}
      {consumption && consumption.periods && consumption.periods.length > 0 && (
        <>
          <h2 className="text-xl font-bold mt-6 pt-6 border-t border-gray-300">
            Consumption Metrics (Last 7 Days)
          </h2>
          {consumption.periods.slice(0, 1).map((period) => (
            <div key={period.period_id} className="space-y-2">
              <p>
                <strong>Active Time:</strong> {(period.active_time_seconds / 3600).toFixed(2)} hours
              </p>
              <p>
                <strong>Compute Time:</strong> {(period.compute_time_seconds / 3600).toFixed(2)}{' '}
                hours
              </p>
              <p>
                <strong>Data Written:</strong>{' '}
                {(period.written_data_bytes / 1024 / 1024).toFixed(2)} MB
              </p>
              <p>
                <strong>Data Transfer:</strong>{' '}
                {(period.data_transfer_bytes / 1024 / 1024).toFixed(2)} MB
              </p>
              <p>
                <strong>Storage (avg):</strong>{' '}
                {(period.data_storage_bytes_hour / 1024 / 1024 / 1024).toFixed(4)} GB-hours
              </p>
            </div>
          ))}
        </>
      )}
      {slowQueries && slowQueries.length > 0 && (
        <>
          <h2 className="text-xl font-bold mt-6 pt-6 border-t border-gray-300">Slow Queries</h2>
          <div className="space-y-2">
            {slowQueries.map((q: any, idx: number) => (
              <MDiv
                key={idx}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.28, delay: idx * 0.06 }}
                className="p-3 border rounded bg-white shadow-sm"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <pre className="whitespace-pre-wrap text-sm overflow-hidden text-ellipsis max-h-28">
                      {q.query?.length > 800 ? q.query.slice(0, 800) + '…' : q.query}
                    </pre>
                  </div>
                  <div className="text-right text-xs text-gray-600 flex flex-col items-end gap-2">
                    {q.mean_time != null ? (
                      <div>
                        <div>
                          <strong>Mean:</strong> {Number(q.mean_time).toFixed(2)} ms
                        </div>
                        <div>
                          <strong>Calls:</strong> {q.calls}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div>
                          <strong>Duration:</strong>{' '}
                          {q.duration_ms ? `${Math.round(q.duration_ms)} ms` : 'N/A'}
                        </div>
                        <div>
                          <strong>State:</strong> {q.state || 'N/A'}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => runExplain(q.query, idx)}
                        disabled={!!explainLoading[idx]}
                        className={`px-2 py-1 rounded text-sm ${
                          explainLoading[idx]
                            ? 'bg-gray-300 text-gray-700'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                      >
                        {explainLoading[idx] ? 'Explaining…' : 'Explain'}
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const copy = q.query?.slice(0, 1000) || '';
                            await navigator.clipboard.writeText(copy);
                            toast.success('Query copied');
                            await log.current.info('Slow query copied', { neonRequestId, idx });
                          } catch (err) {
                            toast.error('Copy failed');
                            try {
                              await log.current.error('Failed to copy slow query', {
                                neonRequestId,
                                error: String(err),
                              });
                            } catch (logErr) {
                              console.warn('Failed to log copy error', logErr);
                            }
                          }
                        }}
                        className="px-2 py-1 rounded text-sm bg-gray-200"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {(explainPlans[idx] && explainPlans[idx].length > 0) ||
                  explainLoading[idx] ||
                  explainErrors[idx] ? (
                    <MPanel
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-3 p-3 bg-gray-50 border rounded text-sm text-gray-800"
                    >
                      {explainLoading[idx] ? (
                        <div>Running explain...</div>
                      ) : explainErrors[idx] ? (
                        <div className="text-red-600">Error: {explainErrors[idx]}</div>
                      ) : (
                        <pre className="whitespace-pre-wrap text-xs">
                          {explainPlans[idx].join('\n')}
                        </pre>
                      )}
                    </MPanel>
                  ) : null}
                </AnimatePresence>
              </MDiv>
            ))}
          </div>
        </>
      )}
      <div className="flex gap-4">
        <button onClick={() => toast('DbStatus toast!')} className="px-3 py-1 bg-gray-200 rounded">
          Make me a toast!
        </button>
        {/* Removed redundant Run DB Health Check button as it's now in the new section */}
        <div className="flex flex-col gap-2">
          <button
            onClick={sendStatusEmail}
            disabled={emailLoading}
            className={`px-3 py-1 rounded flex items-center gap-2 transition-colors ${
              emailLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : emailStatus.type === 'success'
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : emailStatus.type === 'throttled'
                    ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                    : emailStatus.type === 'error'
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {emailLoading ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>Sending...</span>
              </>
            ) : emailStatus.type === 'success' ? (
              <>
                <span>✓</span>
                <span>Email Sent</span>
              </>
            ) : emailStatus.type === 'throttled' ? (
              <>
                <span>⏱️</span>
                <span>Throttled</span>
              </>
            ) : emailStatus.type === 'error' ? (
              <>
                <span>✗</span>
                <span>Send Failed</span>
              </>
            ) : (
              'Send Status Email'
            )}
          </button>
          {emailStatus.type && emailStatus.message && (
            <p
              className={`text-sm ${
                emailStatus.type === 'success'
                  ? 'text-green-600'
                  : emailStatus.type === 'throttled'
                    ? 'text-yellow-600'
                    : 'text-red-600'
              }`}
            >
              {emailStatus.message}
            </p>
          )}
        </div>
      </div>
      {/* 🛠️ Removed old conditional healthResult display 
        {healthResult && (
          <div className="mt-2">
            <strong>Health:</strong>{' '}
            {healthResult.ok ? (
              <span className="text-green-600">OK — {healthResult.latencyMs} ms</span>
            ) : (
              <span className="text-red-600">Failed — {healthResult.error}</span>
            )}
          </div>
        )}
      */}
    </div>
  );
}
