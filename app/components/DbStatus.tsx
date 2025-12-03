'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { getDbStatus } from '@/app/utils/getDbStatus';
import { useRequestId } from '@/app/contexts/RequestIdContext';
import { createLogger } from '@/app/utils/logger';
import { isFeatureEnabled } from '@/app/utils/featureFlags';
import { generateUUID } from '@/uuidj';
import LineSparkline from './LineSparkline'; // ⬅️ IMPORT THE LINE CHART

type DbStatusType = {
  version: string;
  postCount: number;
  latestPostDate: string | null;
  latestPostTitle?: string;
  latestPostContent?: string;
  logCount: number;
  weatherHourlyCount?: number;
  region?: string;
  latencyMs?: number;
  mySlowCount?: number;
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
  weatherLogCount?: number;
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

// 🛠️ New Type: Allow 'ok' to be null for 'Pending' state
type HealthResult = {
  ok: boolean | null;
  latencyMs?: number;
  error?: string;
};

// 🛠️ REMOVED redundant global log initialization
// const log = createLogger('app/components/DbStatus.tsx');
// log.info('[DbStatus] DbStatus component loaded', {
//   action: 'init',
//   timestamp: new Date().toISOString(),
// });

// Framer Motion typed components
const MDiv = motion.div as unknown as any;

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

  // 🛠️ FIX: Initialize to a non-null object for persistent display (ok: null is 'Pending')
  const [healthResult, setHealthResult] = useState<HealthResult>({
    ok: null,
    latencyMs: undefined,
    error: undefined,
  });

  const [healthCheckTimestamp, setHealthCheckTimestamp] = useState<number | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);
  const [neonRequestId, setNeonRequestId] = useState<string | null>(null);
  const [slowQueries, setSlowQueries] = useState<any[] | null>(null);
  const [queryTrends, setQueryTrends] = useState<any[] | null>(null);
  const [slowQueryHistory, setSlowQueryHistory] = useState<any[] | null>(null);
  const [explainLoading, setExplainLoading] = useState<Record<number, boolean>>({});
  const [explainPlans, setExplainPlans] = useState<Record<number, string[]>>({});
  const [explainErrors, setExplainErrors] = useState<Record<number, string>>({});

  // 🛠️ FIX: Use dedicated states for animation and direction tracking
  const [prevLatency, setPrevLatency] = useState<number>(0);
  const [latencyDirection, setLatencyDirection] = useState<'up' | 'down' | 'none'>('none');

  const [latencyHistory, setLatencyHistory] = useState<number[]>([]);
  const prevLatencyRef = useRef<number>(0);
  // 🛠️ ADD: Initialize to a non-null object for persistent display (ok: null is 'Pending')
  // New state for tracking the last time the slow query job ran
  const [lastSlowQueryJob, setLastSlowQueryJob] = useState<number | null>(null);
  const [mySlowQueryCount, setMySlowQueryCount] = useState<number | null>(null);
  // 🆔 Get the SHARED requestId from context!
  const requestId = useRequestId();

  // 🛠️ Use local logger instance from ref (as was in previous versions)
  const log = useRef(createLogger('app/components/DbStatus.tsx', requestId));
  // Function to call the slow query recording endpoint
  const recordSlowQueriesJob = useCallback(async () => {
    // Only run if neonRequestId is available for logging
    if (!neonRequestId) return;

    try {
      await log.current.info('Initiating background slow query recording job', {
        neonRequestId,
        lastSlowQueryJob,
        recordSlowQueriesJob,
        status: 'started',
      });

      const headers: Record<string, string> = {};
      if (neonRequestId) headers['x-request-id'] = neonRequestId;

      const res = await fetch('/api/neon/record-slow-queries', {
        method: 'POST',
        headers,
      });

      if (res.ok) {
        const data = await res.json();
        const mySlowQueryCount = data.mySlowCount;
        setMySlowQueryCount(mySlowQueryCount);
        setLastSlowQueryJob(Date.now());
        toast.success(`Slow query job ran successfully, recorded ${data.recorded} queries.`);
        await log.current.info('Slow query recording job succeeded', {
          neonRequestId,
          message: data.message,
          recorded: data.recorded,
          mySlowCount: mySlowQueryCount,
        });

        // OPTIONAL: Re-fetch slow queries immediately after recording a new batch
        // You might have a fetchSlow function or can call the fetch logic here.
        // fetchSlow();
      } else {
        const errorData = await res.json();
        toast.error(`Slow query job failed: ${errorData.error || 'Unknown error'}`);
        await log.current.error('Slow query recording job failed', {
          neonRequestId,
          error: errorData.error,
        });
      }
    } catch (err) {
      console.error('Failed to run slow query job:', err);
      toast.error('Slow query job failed due to network error.');
    }
  }, [neonRequestId, log]);
  // 🛠️ ADD: Initialize to a non-null object for persistent display (ok: null is 'Pending')
  // Ensure slow query history is refreshed before trends are fetched
  useEffect(() => {
    // Call slow-queries endpoint to update history
    fetch('/api/neon/slow-queries').catch(() => {});
  }, []);

  const emailSentRef = useRef(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{
    type: 'success' | 'throttled' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const region = status?.region || 'Unknown';

  log.current.info('Dbstatus region', { region: region });

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
  // Inside DbStatus.tsx, within the DbStatus function component:

  // Ref to hold the interval timer
  const slowQueryInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 1. Run immediately on mount (or when neonRequestId becomes available)
    recordSlowQueriesJob();

    // 2. Set up the interval for repeated calls
    // You mentioned the cron was too slow (once per day).
    // Let's run this job every 5 minutes (300,000 ms) for a better trend view.
    const intervalDuration = 300000; // 5 minutes

    slowQueryInterval.current = setInterval(() => {
      // Only run if the tab is visible to save resources (optional)
      if (document.visibilityState === 'visible') {
        recordSlowQueriesJob();
      }
    }, intervalDuration);
    log.current.info('Set up slow query recording interval', { action: 'setup', intervalDuration });
    // 3. Cleanup function to stop the timer when the component unmounts
    return () => {
      if (slowQueryInterval.current) {
        clearInterval(slowQueryInterval.current);
        slowQueryInterval.current = null;
      }
    };
  }, [recordSlowQueriesJob]); // Dependency array ensures it only restarts if the function changes
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
          console.log('Slow queries API response:', data);
          setSlowQueries(data.queries || []);
          await log.current.info('Slow queries received', {
            neonRequestId: id,
            source: data.source,
            count: (data.queries || []).length,
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

  // Fetch query trends
  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const res = await fetch('/api/neon/query-trends?hours=24');
        if (res.ok) {
          const data = await res.json();
          setQueryTrends(data.trends || []);
          await log.current.info('Query trends received', { count: data.trends?.length || 0 });
        }
      } catch (err) {
        console.error('Failed to fetch query trends:', err);
        await log.current.error('Failed to fetch query trends', { error: String(err) });
      }
    };

    fetchTrends();
  }, []);

  // Fetch slow query history
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/neon/slow-query-history');
        if (res.ok) {
          const data = await res.json();
          setSlowQueryHistory(data.history || []);
          console.log('Slow query history received:', data);
          await log.current.info('Slow query history received', {
            count: data.count,
            uniqueQueries: data.uniqueQueries,
          });
        }
      } catch (err) {
        console.error('Failed to fetch slow query history:', err);
        await log.current.error('Failed to fetch slow query history', { error: String(err) });
      }
    };

    fetchHistory();
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

  // 🛠️ REMOVED redundant log2 initialization
  // const log2 = createLogger('app/components/DbStatus.tsx');
  // log2.info('[DbStatus] Rendering DbStatus component', { emailStatus });

  // 🛠️ Health check action with animation logic fix
  const runHealthCheck = useCallback(async () => {
    // Always use the latest value from the ref, not from closure
    const oldLatency = typeof prevLatencyRef.current === 'number' ? prevLatencyRef.current : 0;
    // Set to loading state (ok:null) and reset animation
    setHealthResult((s) => ({ ...s, ok: null, latencyMs: undefined }));
    setLatencyDirection('none');

    try {
      const headers: Record<string, string> = {};
      if (neonRequestId) headers['x-request-id'] = neonRequestId;
      const res = await fetch('/api/neon/health', { headers });

      const data = await res.json();
      const newLatency = typeof data.latencyMs === 'number' ? data.latencyMs : 0;

      // Update prevLatencyRef and state to the previous value before updating
      setPrevLatency(oldLatency);
      prevLatencyRef.current = newLatency;

      if (!res.ok) {
        setHealthResult({ ok: false, error: data.error });
        setHealthCheckTimestamp(Date.now());
        toast.error('Health check failed');
        await log.current.error('Health check failed', { neonRequestId, error: data.error });
        return;
      }

      // Logic to determine latency delta and animation direction
      if (typeof newLatency === 'number' && typeof oldLatency === 'number') {
        if (newLatency > oldLatency) {
          setLatencyDirection('up');
        } else if (newLatency < oldLatency) {
          setLatencyDirection('down');
        } else {
          setLatencyDirection('none');
        }
      } else {
        setLatencyDirection('none');
      }

      // const sql = neon(process.env.DATABASE_URL?.toString() || '');
      // const countUser = await sql`SELECT COUNT(*)::int as count FROM "User"`;
      // const countWeather = await sql`SELECT COUNT(*)::int as count FROM "WeatherLog"`;
      // await log.current.info('[DbStatus] Executed raw SQL ', {
      //   countUser: countUser,
      //   countWeather: countWeather,
      // });
      // Update latency history for the line sparkline
      if (typeof newLatency === 'number') {
        setLatencyHistory((h) => {
          const nextHistory = [...h, newLatency];
          // Keep only the last 20 samples
          return nextHistory.slice(-20);
        });
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
  }, [neonRequestId]); // Remove healthResult.latencyMs from dependencies

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      runHealthCheck();
      autoRefreshInterval.current = setInterval(() => {
        runHealthCheck();
      }, 30000); // refresh every 30s
    } else {
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
        autoRefreshInterval.current = null;
      }
    }
    return () => {
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
        autoRefreshInterval.current = null;
      }
    };
  }, [autoRefresh]);

  // Export metrics as JSON
  const exportMetrics = useCallback(() => {
    const metricsSnapshot = {
      timestamp: new Date().toISOString(),
      status,
      envInfo,
      consumption,
      neonMeta,
      neonLimits,
      healthResult,
      healthCheckTimestamp: healthCheckTimestamp
        ? new Date(healthCheckTimestamp).toISOString()
        : null,
      slowQueries,
    };
    const blob = new Blob([JSON.stringify(metricsSnapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `db-metrics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Metrics exported!');
  }, [
    status,
    envInfo,
    consumption,
    neonMeta,
    neonLimits,
    healthResult,
    healthCheckTimestamp,
    slowQueries,
  ]);

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
          });
          return;
        }

        const data = await res.json();
        setExplainPlans((s) => ({ ...s, [idx]: data.plan || [] }));
        await log.current.info('Explain plan received', {
          neonRequestId,
          idx,
          planCount: data.plan?.length || 0,
        });
      } catch (err) {
        setExplainErrors((s) => ({ ...s, [idx]: String(err) }));
        await log.current.error('Explain exception', { neonRequestId, idx, error: String(err) });
      } finally {
        setExplainLoading((s) => ({ ...s, [idx]: false }));
      }
    },
    [neonRequestId]
  );

  // Determine an overall status for a cloud-style header
  const overallStatus = (() => {
    if (healthResult?.ok === false) return { label: 'Degraded', color: 'red' };
    if (neonLimits && neonLimits.utilization >= 80) return { label: 'Degraded', color: 'yellow' };
    return { label: 'Operational', color: 'green' };
  })();

  if (!status) return <p>Loading DB status...</p>;

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
                  : overallStatus.color === 'yellow'
                    ? 'inline-block w-3 h-3 rounded-full bg-yellow-500'
                    : 'inline-block w-3 h-3 rounded-full bg-red-500'
              }
            />
            <span className="font-semibold">{overallStatus.label}</span>
          </div>
          <RegionBadge region={region} />
        </div>
      </header>

      {/* Removed old summary cards grid; only blue-themed cards remain */}
      {/* Unified Animated Summary Cards - Blue Theme */}
      <div className="bg-blue-50 rounded-xl p-4 shadow grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MDiv
          key={status?.version}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center justify-center p-6 bg-blue-100 rounded-lg shadow"
        >
          <div className="text-sm font-semibold text-blue-700">PostgreSQL</div>
          <div className="mt-2 text-2xl font-bold text-blue-900">{status?.version}</div>
          <div className="text-xs text-blue-600 mt-2"></div>
        </MDiv>

        <MDiv
          key={status?.postCount}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center justify-center p-6 bg-blue-100 rounded-lg shadow"
        >
          <div className="text-md font-semibold text-blue-700">Traffic</div>
          <div className="text-lg text-blue-600 mt-2">
            Posts: {status?.postCount?.toLocaleString()}
          </div>
          <div className="text-lg text-blue-600 mt-2">
            Logs: {status?.logCount?.toLocaleString()}
          </div>
          <div className="text-lg text-blue-600 mt-1">
            SlowQueryHistory: {mySlowQueryCount || 'N/A'}
            WeatherHourlyCount: {status?.weatherHourlyCount?.toLocaleString() || 'N/A'}
          </div>
          <div className="text-lg text-blue-600 mt-1">
            WeatherLog:{' '}
            {envInfo && typeof envInfo.weatherLogCount === 'number'
              ? envInfo.weatherLogCount.toLocaleString()
              : 'N/A'}
          </div>
        </MDiv>

        <MDiv
          key={status?.latencyMs}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center justify-center p-6 bg-blue-100 rounded-lg shadow"
        >
          <div className="text-md font-semibold text-blue-700">Active Connections</div>
          <div className="mt-2 text-2xl font-bold text-blue-900">
            {neonLimits?.activeConnections ?? status?.lastActivity?.activeConnections ?? 0}
          </div>
        </MDiv>
      </div>

      {/* 🛠️ New: Always Display Health Check Section, with dedicated animation inside */}
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
            <MDiv>
              {/* ... other Latency card content */}
              <div>
                {/* ⬅️ USE THE NEW LINE COMPONENT HERE */}
                <div className="ml-auto">
                  <LineSparkline
                    data={latencyHistory}
                    width={60}
                    height={25}
                    strokeColor="#f97316" // Orange
                    fillColor="#ffedd5" // Light orange area
                  />
                </div>
              </div>
              {/* ... rest of the card */}
            </MDiv>
            {/* Display previous latency whenever direction is not 'none' */}
            {latencyDirection !== 'none' && (
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
            {status?.lastActivity?.lastActivity
              ? new Date(status?.lastActivity.lastActivity).toLocaleString()
              : 'N/A'}
          </p>
          <p className="text-sm text-gray-600">
            Last Vacuum:{' '}
            {status?.lastActivity?.lastVacuum
              ? new Date(status?.lastActivity.lastVacuum).toLocaleString()
              : 'Never'}
          </p>
          <p className="text-sm text-gray-600">
            Total ops: {status?.lastActivity?.totalOperations ?? 0}
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
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <pre className="whitespace-pre-wrap text-sm overflow-hidden max-h-28">
                      {q.query?.length > 800 ? q.query.slice(0, 800) + '…' : q.query}
                    </pre>
                  </div>
                  <div className="text-right text-xs text-gray-600 ml-4 shrink-0">
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
                    <button
                      onClick={() => runExplain(q.explainQuery || q.query, idx)}
                      disabled={explainLoading[idx]}
                      className="mt-2 px-2 py-1 text-xs bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:bg-gray-400 transition-colors"
                    >
                      {explainLoading[idx] ? 'Explaining...' : 'Explain'}
                    </button>
                    {explainErrors[idx] && (
                      <p className="text-red-600 text-xs mt-1">{explainErrors[idx]}</p>
                    )}
                  </div>
                </div>
                {explainPlans[idx] && explainPlans[idx].length > 0 && (
                  <div className="mt-3 p-2 bg-gray-100 rounded text-xs font-mono overflow-x-auto">
                    {explainPlans[idx].map((line: string, lineIdx: number) => (
                      <div key={lineIdx}>{line}</div>
                    ))}
                  </div>
                )}
              </MDiv>
            ))}
          </div>

          {/* Slow Query Trend Chart */}
          <div className="mt-4 p-4 bg-gray-50 border rounded">
            <h4 className="text-sm font-semibold text-gray-700">Query Performance Trend (24h)</h4>
            {queryTrends && queryTrends.length > 0 ? (
              <div className="mt-3 space-y-3">
                {queryTrends.slice(0, 3).map((trend, idx) => (
                  <div key={idx} className="p-3 bg-white border rounded">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <p className="text-xs font-mono text-gray-700 truncate">
                          {trend.query.slice(0, 60)}...
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-xs text-gray-600">
                          Avg: {trend.avgMeanTime.toFixed(2)} ms
                        </p>
                        <p className="text-xs text-gray-600">
                          Max: {trend.maxMeanTime.toFixed(2)} ms
                        </p>
                        <p className="text-xs text-gray-500">{trend.dataPoints.length} samples</p>
                      </div>
                    </div>
                    {/* Simple bar chart visualization */}
                    <div className="mt-2 h-8 bg-gray-100 rounded overflow-hidden flex items-end gap-0.5">
                      {trend.dataPoints.slice(-20).map((point: any, pidx: number) => {
                        const pct = (point.value / trend.maxMeanTime) * 100;
                        return (
                          <div
                            key={pidx}
                            className="flex-1 bg-indigo-500"
                            style={{ height: `${pct}%`, minHeight: '2px' }}
                            title={`${point.value.toFixed(2)}ms at ${new Date(point.timestamp).toLocaleTimeString()}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 mt-2">
                No historical data yet. Trends will appear after slow queries are logged.
              </p>
            )}
          </div>
        </section>
      )}

      {/* Slow Query History */}
      {slowQueryHistory && slowQueryHistory.length > 0 && (
        <section className="mt-6">
          <h3 className="text-lg font-semibold">Slow Query History (Recorded)</h3>
          <p className="text-sm text-gray-600 mt-1">
            Tracks which queries have been slow over time. Use this to identify recurring issues.
          </p>
          <div className="mt-3 space-y-2">
            {slowQueryHistory.slice(0, 10).map((record: any, idx: number) => (
              <MDiv key={idx} className="p-3 border rounded bg-white shadow-sm">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-1">
                      <strong>Source:</strong> {record.source}
                    </p>
                    <p className="text-xs text-gray-500 mb-1">
                      <strong>Hash:</strong> {record.queryHash}
                    </p>
                    <pre className="whitespace-pre-wrap text-xs overflow-hidden max-h-20 bg-gray-50 p-2 rounded">
                      {record.query?.length > 400 ? record.query.slice(0, 400) + '…' : record.query}
                    </pre>
                  </div>
                  <div className="text-right text-xs text-gray-600 shrink-0">
                    {record.meanTime && (
                      <div>
                        <strong>Mean:</strong> {Number(record.meanTime).toFixed(2)} ms
                      </div>
                    )}
                    {record.durationMs && (
                      <div>
                        <strong>Duration:</strong> {Number(record.durationMs).toFixed(2)} ms
                      </div>
                    )}
                    {record.calls && (
                      <div>
                        <strong>Calls:</strong> {record.calls}
                      </div>
                    )}
                    <div className="mt-1">
                      <strong>Recorded:</strong> {new Date(record.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              </MDiv>
            ))}
          </div>
        </section>
      )}

      {/* 🛠️ REMOVED the old, conditionally rendered healthResult section at the bottom */}
      {/* {healthResult && (
        <MPanel
          //... Removed code
        >
          //... Removed code
        </MPanel>
      )}
      */}

      <div className="flex gap-4">
        <button onClick={() => toast('DbStatus toast!')} className="px-3 py-1 bg-gray-200 rounded">
          Make me a toast!
        </button>

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
        <button onClick={exportMetrics} className="px-3 py-2 bg-gray-600 text-white rounded">
          Export Metrics JSON
        </button>
        <label className="flex items-center gap-2 px-3 py-2 bg-white border rounded cursor-pointer">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm">Auto-Refresh (30s)</span>
        </label>
      </div>
    </div>
  );
}
