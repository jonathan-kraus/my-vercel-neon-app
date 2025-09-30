'use client';
import toast, { Toaster } from 'react-hot-toast';

import { useEffect, useState } from 'react';
import { getDbStatus } from '@/app/utils/getDbStatus';

type DbStatusType = {
  version: string;
  postCount: number;
  latestPostDate: string | null;
  logCount: number;
  region ?: string;
  latencyMs ?: number;
};

export default function DbStatus() {
  const [status, setStatus] = useState<DbStatusType | null>(null);


    useEffect(() => {
  const fetchStatus = async () => {
    try {
      const data = await getDbStatus();

      const formattedData: DbStatusType = {
        ...data,
        latestPostDate: data.latestPostDate ? data.latestPostDate.toISOString() : null,
        logCount: data.logCount
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
  const region = process.env.DATABASE_URL?.match(/neon\.(.*?)\.neon\.tech/)?.[1] || 'Unknown';
  console.log('region:', region);
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Database Status</h2>
      <p><strong>Neon Region:</strong> {region}</p>
      <p><strong>PostgreSQL Version:</strong> {status.version}</p>
      <p><strong>Total Posts:</strong> {status.postCount}</p>
      <p><strong>Latest Post:</strong> {status.latestPostDate ? new Date(status.latestPostDate).toLocaleString() : 'N/A'}</p>
      <p><strong>Total Logs:</strong> {status.logCount}</p>
      <p><strong>Latency:</strong> {status.latencyMs} ms</p>
      <button onClick={notify}>Make me a toast!</button>
      <Toaster />
    </div>
  );
}