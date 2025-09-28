'use client';

import { useEffect, useState } from 'react';
import { getDbStatus } from '@/app/utils/getDbStatus';
type DbStatusType = {
  version: string;
  postCount: number;
  logCount: number;
  latestPostDate: string | null;
};

export default function DbStatus() {
  const [status, setStatus] = useState<DbStatusType | null>(null);


    useEffect(() => {
    const fetchStatus = async () => {
    const data = await getDbStatus();

    const formattedData: DbStatusType = {
      ...data,
      latestPostDate: data.latestPostDate ? data.latestPostDate.toISOString() : null,
    };

    setStatus(formattedData);
  };

  fetchStatus();
}, []);


  if (!status) return <p>Loading DB status...</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Database Status</h2>
      <p><strong>PostgreSQL Version:</strong> {status.version}</p>
      <p><strong>Total Posts:</strong> {status.postCount}</p>
      <p><strong>Total Logs:</strong> {status.logCount}</p>
      <p><strong>Latest Post:</strong> {status.latestPostDate ? new Date(status.latestPostDate).toLocaleString() : 'N/A'}</p>
    </div>
  );
}
