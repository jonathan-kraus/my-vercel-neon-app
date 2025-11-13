'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getDbStatus } from '@/app/utils/getDbStatus';
import { useRequestId } from '@/app/contexts/RequestIdContext';
import { createLogger } from '@/app/utils/logger';
import { isFeatureEnabled } from '@/app/utils/featureFlags';

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

  // 🆔 Get the SHARED requestId from context!
  const requestId = useRequestId();

  const log = useRef(createLogger('app/components/DbStatus.tsx', requestId));
  const emailSentRef = useRef(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{
    type: 'success' | 'throttled' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const region = process.env.NEXT_PUBLIC_DB_REGION || 'Unknown';

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
    if (
      status &&
      !emailSentRef.current &&
      typeof window !== 'undefined' &&
      isFeatureEnabled('EMAIL_NOTIFICATIONS')
    ) {
      emailSentRef.current = true;
      sendStatusEmail();
    }
  }, [status, sendStatusEmail]);

  if (!status) return <p>Loading DB status...</p>;

  return (
    <div className="space-y-4 animate-fade-in delay-[index * 100]">
      <h2 className="text-xl font-bold">Database Status</h2>

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
        <strong>Latency:</strong> {status.latencyMs} ms
      </p>
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
      </div>
    </div>
  );
}
