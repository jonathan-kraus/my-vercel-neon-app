'use client';
import toast, { Toaster } from 'react-hot-toast';
import { logger } from '@/app/lib/logger';
import { Component, useEffect, useState } from 'react';
import { getDbStatus } from '@/app/utils/getDbStatus';

type DbStatusType = {
  version: string;
  postCount: number;
  latestPostDate: string | null;
  logCount: number;
  region?: string;
  latencyMs?: number;
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

  useEffect(() => {
    const requestId = crypto.randomUUID();

    const baseUrl =
      (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
      'https://www.kraus.my.id';
    const logEvent = async () => {
      try {
        await logger({
          severity: 'info',
          source: 'DbStatus.tsx',
          message: `DbStatus invoked`,
          requestId,
          metadata: { userAction: 'fetch', Component: 'DbStatus' },
        });
      } catch (error) {
        console.error('Failed to log event:', error);
      }
    };

    logEvent();
  }, []);

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

  const notify = () => toast('DbStatus toast!');

  if (!status) return <p>Loading DB status...</p>;

  const region = process.env.NEXT_PUBLIC_DB_REGION || 'Unknown';

  console.log('region:', region);
  return (
    <div className={'space-y-4 animate-fade-in delay-[index * 100]'}>
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
        <strong>Latest Post:</strong>{' '}
        {status.latestPostDate ? new Date(status.latestPostDate).toLocaleString() : 'N/A'}
      </p>
      <p>
        <strong>Total Logs:</strong> {status.logCount}
      </p>
      <p>
        <strong>Latency:</strong> {status.latencyMs} ms
      </p>
      <button onClick={notify}>Make me a toast!</button>
      <Toaster />
    </div>
  );
}
