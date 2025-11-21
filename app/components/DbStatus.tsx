/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { getDbStatus } from '@/app/utils/getDbStatus';
import { useRequestId } from '@/app/contexts/RequestIdContext';
import { createLogger } from '@/app/utils/logger';
import { isFeatureEnabled } from '@/app/utils/featureFlags';
import { generateUUID } from '@/uuidj';

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
  const [healthResult, setHealthResult] = useState<{
    ok: boolean;
    latencyMs?: number;
    error?: string;
  } | null>(null);
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

  // Health check action
  const runHealthCheck = useCallback(async () => {
    try {
      setHealthResult(null);
      const headers: Record<string, string> = {};
      if (neonRequestId) headers['x-request-id'] = neonRequestId;
      const res = await fetch('/api/neon/health', { headers });
      if (res.ok) {
        const data = await res.json();
        setHealthResult(data);
        toast.success(`Health OK — ${data.latencyMs} ms`);
        await log.current.info('Health check executed', {
          neonRequestId,
          latencyMs: data.latencyMs,
        });
      } else {
        const data = await res.json();
        setHealthResult(data);
        toast.error('Health check failed');
        await log.current.error('Health check failed', { neonRequestId, error: data.error });
      }
    } catch (err) {
      console.error('Health check error', err);
      setHealthResult({ ok: false, error: String(err) });
      toast.error('Health check error');
      await log.current.error('Health check exception', { neonRequestId, error: String(err) });
    }
  }, [neonRequestId]);

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

  // Determine an overall status for a cloud-style header
  const overallStatus = (() => {
    if (healthResult && !healthResult.ok) return { label: 'Degraded', color: 'yellow' };
    if (neonLimits && neonLimits.utilization >= 80) return { label: 'Degraded', color: 'yellow' };
    return { label: 'Operational', color: 'green' };
  })();

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Database Status</h2>
          <p className="text-sm text-gray-600">Live metrics and health for your Neon database</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span
              className={
                overallStatus.color === 'green'
                  ? 'inline-block w-3 h-3 rounded-full bg-green-500'
                  : 'inline-block w-3 h-3 rounded-full bg-yellow-500'
              }
            />
            <span className="font-semibold">{overallStatus.label}</span>
          </div>
          <RegionBadge region={region} />
        </div>
      </header>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white border rounded shadow-sm">
          <div className="text-sm text-gray-500">PostgreSQL</div>
          <div className="mt-1 text-lg font-medium">{status.version}</div>
          <div className="text-xs text-gray-500 mt-2">
            Latest:{' '}
            {status.latestPostDate ? new Date(status.latestPostDate).toLocaleString() : 'N/A'}
          </div>
        </div>

        <div className="p-4 bg-white border rounded shadow-sm">
          <div className="text-sm text-gray-500">Traffic</div>
          <div className="mt-1 text-lg font-medium">{status.postCount.toLocaleString()} posts</div>
          <div className="text-xs text-gray-500 mt-2">Logs: {status.logCount.toLocaleString()}</div>
        </div>

        <div className="p-4 bg-white border rounded shadow-sm">
          <div className="text-sm text-gray-500">Latency</div>
          <div className="mt-1 text-lg font-medium">{status.latencyMs ?? 'N/A'} ms</div>
          <div className="text-xs text-gray-500 mt-2">
            Active Connections:{' '}
            {neonLimits?.activeConnections ?? status.lastActivity?.activeConnections ?? 0}
          </div>
        </div>
      </div>

      {/* Metrics grid - avoid duplicating active connections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white border rounded shadow-sm">
          <h3 className="text-sm font-semibold">Compute</h3>
          <p className="text-sm text-gray-600 mt-1">Size: 0.5 ↔ 2 CU</p>
          <p className="text-sm text-gray-600">History retention: 1 day</p>
        </div>

        <div className="p-4 bg-white border rounded shadow-sm">
          <h3 className="text-sm font-semibold">Vacuum / Activity</h3>
          <p className="text-sm text-gray-600 mt-1">
            Last Activity:{' '}
            {status.lastActivity?.lastActivity
              ? new Date(status.lastActivity.lastActivity).toLocaleString()
              : 'N/A'}
          </p>
          <p className="text-sm text-gray-600">
            Last Vacuum:{' '}
            {status.lastActivity?.lastVacuum
              ? new Date(status.lastActivity.lastVacuum).toLocaleString()
              : 'Never'}
          </p>
          <p className="text-sm text-gray-600">
            Total ops: {status.lastActivity?.totalOperations ?? 0}
          </p>
        </div>

        <div className="p-4 bg-white border rounded shadow-sm">
          <h3 className="text-sm font-semibold">Limits</h3>
          <p className="text-sm text-gray-600 mt-1">
            Max Conns: {neonLimits?.maxConnections ?? 'N/A'}
          </p>
          <p className="text-sm text-gray-600">
            Utilization: {neonLimits?.utilization != null ? `${neonLimits.utilization}%` : 'N/A'}
          </p>
        </div>
      </div>

      {/* Environment */}
      <section className="mt-6">
        <h3 className="text-lg font-semibold">Environment</h3>
        {envInfo ? (
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-white border rounded">
              <p className="text-sm text-gray-600">Deployment</p>
              <p className="font-medium">{envInfo.deploymentUrl}</p>
              <p className="text-xs text-gray-500">Region: {envInfo.vercelRegion}</p>
            </div>
            <div className="p-3 bg-white border rounded">
              <p className="text-sm text-gray-600">Git</p>
              <p className="font-medium">
                {envInfo.gitCommitSha !== 'N/A' ? envInfo.gitCommitSha : 'N/A'}
              </p>
              <p className="text-xs text-gray-500">{envInfo.gitCommitMessage}</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">Loading environment information...</p>
        )}
      </section>

      {/* Consumption */}
      {consumption && consumption.periods && consumption.periods.length > 0 && (
        <section className="mt-6">
          <h3 className="text-lg font-semibold">Consumption (recent)</h3>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
            {consumption.periods.slice(0, 1).map((period) => (
              <div key={period.period_id} className="p-3 bg-white border rounded">
                <p className="text-sm text-gray-600">Active Time</p>
                <p className="font-medium">{(period.active_time_seconds / 3600).toFixed(2)} h</p>
                <p className="text-sm text-gray-600">Compute</p>
                <p className="font-medium">{(period.compute_time_seconds / 3600).toFixed(2)} h</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Incidents / Slow Queries */}
      {slowQueries && slowQueries.length > 0 && (
        <section className="mt-6">
          <h3 className="text-lg font-semibold">Incidents & Slow Queries</h3>
          <div className="mt-3 space-y-2">
            {slowQueries.map((q: any, idx: number) => (
              <MDiv key={idx} className="p-3 border rounded bg-white shadow-sm">
                <div className="flex justify-between">
                  <div className="flex-1">
                    <pre className="whitespace-pre-wrap text-sm overflow-hidden max-h-28">
                      {q.query?.length > 800 ? q.query.slice(0, 800) + '…' : q.query}
                    </pre>
                  </div>
                  <div className="text-right text-xs text-gray-600 ml-4">
                    <div>
                      <strong>Mean:</strong>{' '}
                      {q.mean_time
                        ? Number(q.mean_time).toFixed(2) + ' ms'
                        : q.duration_ms
                          ? `${Math.round(q.duration_ms)} ms`
                          : 'N/A'}
                    </div>
                    <div>
                      <strong>Calls:</strong> {q.calls ?? 'N/A'}
                    </div>
                  </div>
                </div>
              </MDiv>
            ))}
          </div>
        </section>
      )}

      {healthResult && (
        <section className="mt-6 p-4 bg-white border rounded">
          <h3 className="text-lg font-semibold">Health Check Result</h3>
          <div className="mt-2">
            <p className="text-sm text-gray-600">
              Status:{' '}
              <span
                className={
                  healthResult.ok ? 'text-green-600 font-semibold' : 'text-yellow-600 font-semibold'
                }
              >
                {healthResult.ok ? 'OK' : 'Degraded'}
              </span>
            </p>
            <p className="text-sm text-gray-600">Latency: {healthResult.latencyMs ?? 'N/A'} ms</p>
            {healthResult.error && (
              <p className="text-sm text-red-600">Error: {healthResult.error}</p>
            )}
          </div>
        </section>
      )}

      <div className="mt-6 flex gap-3">
        <button onClick={runHealthCheck} className="px-3 py-2 bg-indigo-600 text-white rounded">
          Run DB Health Check
        </button>
        <button
          onClick={sendStatusEmail}
          disabled={emailLoading}
          className="px-3 py-2 bg-blue-500 text-white rounded"
        >
          {emailLoading ? 'Sending…' : 'Send Status Email'}
        </button>
      </div>
    </div>
  );
}
