'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getDbStatus } from '@/app/utils/getDbStatus';
import { generateUUID } from '../../uuidj';
import { logInfoFactory } from '../utils/logger';
const logInfo = logInfoFactory('app/components/DbStatus.tsx');

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
  const emailSentRef = useRef(false);

  const region = process.env.NEXT_PUBLIC_DB_REGION || 'Unknown';

  // Log event once on mount
  useEffect(() => {
    const requestId = generateUUID();
    const baseUrl =
      (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
      'https://www.kraus.my.id';

    const jck = async () => {
      try {
        await logInfo('Retrieving database status', 
          { userAction: 'fetch', source: 'DbStatus' },
            requestId,
        );
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
        const data = await getDbStatus();
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

    try {
      const requestId = generateUUID();
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
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }

      const result = await response.json();
      toast.success('Status report email success!');
      console.log('Email API result:', result);
    } catch (err) {
      console.error('Failed to send status email:', err);
      toast.error('Failed to send status email');
    }
  }, [status, region]);

  // Auto-send once after status loads (only in browser, not during build)
  useEffect(() => {
    if (status && !emailSentRef.current && typeof window !== 'undefined') {
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

      <div className="flex gap-4">
        <button onClick={() => toast('DbStatus toast!')} className="px-3 py-1 bg-gray-200 rounded">
          Make me a toast!
        </button>
        <button onClick={sendStatusEmail} className="px-3 py-1 bg-blue-500 text-white rounded">
          Send Status Email
        </button>
      </div>
    </div>
  );
}
